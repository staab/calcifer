import { createServer } from 'node:http';

const PORT = Number(process.env.PORT ?? 8788);
const API_KEY = process.env.TYPESAFE_API_KEY ?? '';
// on when a reverse proxy sits in front, so the client ip comes from x-forwarded-for
const TRUST_PROXY = process.env.TRUST_PROXY === '1';
const UPSTREAM = 'https://api.typesafe.ai/v1/systemone';
const MODEL = 'jev-latest';
const TIMEOUT_MS = 15000;
const MAX_BODY_BYTES = 4 * 1024;

// counted in questions, since that is what each request costs upstream
const RATE_LIMITS = [
  { windowMs: 60_000, max: 60 },
  { windowMs: 3_600_000, max: 600 },
];

if (API_KEY === '') {
  console.error('TYPESAFE_API_KEY is not set');
  process.exit(1);
}

/**
 * Jev answers with a judgment, never a free-form number: a Score comes back as a
 * probability across the levels it was given. Each level therefore anchors a value,
 * and the distribution is averaged over those anchors to recover a number.
 * These anchors are the dial to turn when estimates skew high or low.
 */
const CALORIES_PER_HOUR = [
  ['Sitting or lying still, such as desk work or watching television', 75],
  ['On your feet but barely exerting, such as light housework or a slow stroll', 150],
  ['Easy sustained movement, such as walking at a normal pace or cycling gently', 250],
  ['Moderate effort that noticeably raises breathing, such as brisk walking, recreational swimming, or doubles tennis', 370],
  ['Hard continuous effort, such as jogging, swimming laps, or cycling at speed', 550],
  ['Very hard sustained effort, such as running at pace, singles squash, or a hard rowing session', 800],
  ['Near-maximal effort, such as sprint intervals, competitive racing, or hard interval training', 1100],
];

const CARBS_PER_100G = [
  ['No meaningful carbohydrate, such as meat, fish, eggs, or cooking oil', 0],
  ['Very little, such as leafy greens, non-starchy vegetables, or hard cheese', 3],
  ['A small amount, such as milk, plain yogurt, or tomatoes', 8],
  ['A moderate amount, such as whole fruit, cooked beans, or cooked pasta and rice', 20],
  ['A lot, such as bread, dried fruit, or a sweet pastry', 45],
  ['Very carbohydrate dense, such as dry oats, flour, or crackers', 65],
  ['Almost entirely carbohydrate, such as sugar, honey, or hard candy', 90],
];

const FAT_PER_100G = [
  ['Essentially fat free, such as fruit, plain vegetables, or sugar', 0],
  ['Very little, such as skimmed milk, white fish, or cooked beans', 2],
  ['A small amount, such as skinless chicken breast or low-fat yogurt', 5],
  ['A moderate amount, such as whole milk, eggs, or lean beef', 11],
  ['A lot, such as fatty cuts of meat, most cheese, or a fried dish', 22],
  ['Very fat dense, such as nuts, seeds, or cream', 45],
  ['Almost entirely fat, such as butter, lard, or cooking oil', 85],
];

const PROTEIN_PER_100G = [
  ['Essentially no protein, such as cooking oil, sugar, fruit juice, or soda', 0],
  ['Very little, such as whole fruit, most vegetables, or butter', 2],
  ['A small amount, such as milk, cooked rice, or bread', 6],
  ['A moderate amount, such as yogurt, cooked beans, or cooked pasta', 11],
  ['A lot, such as eggs, tofu, or cottage cheese', 17],
  ['Very protein dense, such as cooked chicken, fish, beef, or most cheese', 26],
  ['Almost entirely protein, such as protein powder, dried egg white, or jerky', 60],
];

const SERVING_GRAMS = [
  ['A single bite or a teaspoon, such as a sugar cube or a mint', 5],
  ['A tablespoon or a garnish, such as a spoon of sauce or a small handful of nuts', 15],
  ['A small side, such as one piece of fruit, a slice of bread, or a pot of yogurt', 60],
  ['One standard serving, such as a sandwich, a bowl of cereal, or a chicken breast', 180],
  ['A full main course, such as a plate of pasta or a burrito', 350],
  ['A large main or a generous restaurant plate', 550],
  ['An unusually large meal, such as a sharing platter eaten alone', 900],
];

const MINUTES = [
  ['A brief moment, under five minutes', 3],
  ['A short burst of around ten minutes', 10],
  ['About a quarter of an hour', 15],
  ['About half an hour', 30],
  ['About an hour', 60],
  ['A long session of two to three hours', 150],
  ['Most of a day, four hours or more', 300],
];

const PORTION_GRAMS = [
  ['A taste or a single bite of this food', 10],
  ['A small snack portion or a side garnish of this food', 40],
  ['A small serving of this food, such as one piece or one slice', 90],
  ['One standard serving of this food', 200],
  ['A generous serving, noticeably more than standard', 350],
  ['A large or double portion', 550],
  ['An unusually large amount, such as a sharing platter eaten alone', 900],
];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const isObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const text = (v, max) => typeof v === 'string' && v.length <= max;
const filled = (v, max) => text(v, max) && v.trim() !== '';
const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

function send(res, status, body, headers = {}) {
  res.writeHead(status, { ...CORS, 'Content-Type': 'application/json', ...headers });
  res.end(JSON.stringify(body));
}

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (TRUST_PROXY && typeof forwarded === 'string' && forwarded !== '') {
    // the nearest proxy appends last, so anything earlier may be client-supplied
    return forwarded.split(',').pop().trim();
  }
  return req.socket.remoteAddress ?? 'unknown';
}

const buckets = new Map();

/** seconds to wait, or 0 when the request is allowed */
function rateLimited(ip, cost) {
  const now = Date.now();
  let windows = buckets.get(ip);
  if (!windows) {
    windows = RATE_LIMITS.map(() => ({ count: 0, resetAt: 0 }));
    buckets.set(ip, windows);
  }

  let retryAfter = 0;
  RATE_LIMITS.forEach((limit, i) => {
    const window = windows[i];
    if (now >= window.resetAt) {
      window.count = 0;
      window.resetAt = now + limit.windowMs;
    }
    if (window.count + cost > limit.max) {
      retryAfter = Math.max(retryAfter, Math.ceil((window.resetAt - now) / 1000));
    }
  });
  if (retryAfter > 0) return retryAfter;

  for (const window of windows) window.count += cost;
  return 0;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, windows] of buckets) {
    if (windows.every((w) => now >= w.resetAt)) buckets.delete(ip);
  }
}, 600_000).unref();

const score = (instructions, levels) => ({
  type: 'score',
  instructions,
  criteria: levels.map(([label]) => label),
});

async function ask(state, questions) {
  const res = await fetch(UPSTREAM, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ state, model: MODEL, questions }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return isObject(data?.answers) ? data.answers : null;
}

/**
 * Averaging the anchors by probability rather than interpolating around the score
 * keeps tail mass in the estimate. The two agree when the answer sits on adjacent
 * levels, and diverge when it does not; interpolating there reads low, because the
 * anchors are spaced geometrically.
 */
function expectedValue(answers, id, levels) {
  const probabilities = answers?.[id]?.probabilities;
  if (!isObject(probabilities)) return null;

  let total = 0;
  let mass = 0;
  for (const [index, probability] of Object.entries(probabilities)) {
    const level = levels[Number(index)];
    if (!level || typeof probability !== 'number' || !Number.isFinite(probability)) return null;
    total += probability * level[1];
    mass += probability;
  }
  // they sum to 1, but normalising keeps rounding in the response from skewing the value
  return mass > 0 ? total / mass : null;
}

const subject = (input) => ({ name: input.title, description: input.description ?? '' });

async function activityRate(input) {
  const answers = await ask({ activity: subject(input) }, {
    intensity: score(
      'How hard is an average adult working while doing `activity.name`, taking `activity.description` into account?',
      CALORIES_PER_HOUR
    ),
  });
  const caloriesPerHour = expectedValue(answers, 'intensity', CALORIES_PER_HOUR);
  return caloriesPerHour === null ? null : { caloriesPerHour: Math.round(clamp(caloriesPerHour, 0, 3000)) };
}

async function mealMacros(input) {
  // the four judgments share one state, so they go in a single request and run in parallel
  const answers = await ask({ food: subject(input) }, {
    carbs: score('How much carbohydrate does 100 g of `food.name` contain, taking `food.description` into account?', CARBS_PER_100G),
    fat: score('How much fat does 100 g of `food.name` contain, taking `food.description` into account?', FAT_PER_100G),
    protein: score('How much protein does 100 g of `food.name` contain, taking `food.description` into account?', PROTEIN_PER_100G),
    serving: score('How much does one portion of `food.name` weigh, as described in `food.description`?', SERVING_GRAMS),
  });
  const carbs = expectedValue(answers, 'carbs', CARBS_PER_100G);
  const fat = expectedValue(answers, 'fat', FAT_PER_100G);
  const protein = expectedValue(answers, 'protein', PROTEIN_PER_100G);
  const servingGrams = expectedValue(answers, 'serving', SERVING_GRAMS);
  if (carbs === null || fat === null || protein === null || servingGrams === null) return null;

  const grams = (n) => Math.round(clamp(n, 0, 100) * 10) / 10;
  const macros = { carbs: grams(carbs), fat: grams(fat), protein: grams(protein) };
  // the three judgments are independent, so an incoherent combination is possible;
  // macros are constituents of the food, so they cannot exceed its weight
  if (macros.carbs + macros.fat + macros.protein > 100) return null;

  return { ...macros, servingGrams: Math.round(clamp(servingGrams, 1, 5000)) };
}

async function activityMinutes(input) {
  const answers = await ask({ activity: subject(input), duration: input.duration }, {
    minutes: score('How long did `duration` last, for someone doing `activity.name`?', MINUTES),
  });
  const minutes = expectedValue(answers, 'minutes', MINUTES);
  return minutes === null ? null : { minutes: Math.round(clamp(minutes, 0, 1440)) };
}

async function mealGrams(input) {
  const answers = await ask({ food: subject(input), portion: input.portion }, {
    grams: score('How much does the portion in `portion` weigh, given that the food is `food.name`?', PORTION_GRAMS),
  });
  const grams = expectedValue(answers, 'grams', PORTION_GRAMS);
  return grams === null ? null : { grams: Math.round(clamp(grams, 0, 5000)) };
}

const ROUTES = {
  '/v1/activity/rate': { handler: activityRate, cost: 1 },
  '/v1/activity/minutes': { handler: activityMinutes, cost: 1, requires: 'duration' },
  '/v1/meal/macros': { handler: mealMacros, cost: 4 },
  '/v1/meal/grams': { handler: mealGrams, cost: 1, requires: 'portion' },
};

function invalidInput(input, requires) {
  if (!isObject(input)) return 'body must be an object';
  if (!filled(input.title, 200)) return 'title must be a non-empty string';
  if (input.description !== undefined && !text(input.description, 1000)) return 'description must be a string';
  if (requires && !filled(input[requires], 200)) return `${requires} must be a non-empty string`;
  return null;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('body too large'));
        req.pause();
      } else {
        chunks.push(chunk);
      }
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS);
    res.end();
    return;
  }
  if (req.method === 'GET' && req.url === '/health') {
    send(res, 200, { ok: true });
    return;
  }

  const route = ROUTES[req.url];
  if (req.method !== 'POST' || !route) {
    send(res, 404, { error: 'not found' });
    return;
  }

  const retryAfter = rateLimited(clientIp(req), route.cost);
  if (retryAfter > 0) {
    send(res, 429, { error: 'rate limited' }, { 'Retry-After': String(retryAfter) });
    return;
  }

  let body;
  try {
    body = await readBody(req);
  } catch {
    send(res, 413, { error: 'request too large' }, { Connection: 'close' });
    return;
  }

  let input;
  try {
    input = JSON.parse(body.toString('utf8'));
  } catch {
    send(res, 400, { error: 'invalid json' });
    return;
  }

  const reason = invalidInput(input, route.requires);
  if (reason) {
    send(res, 400, { error: reason });
    return;
  }

  try {
    const result = await route.handler(input);
    if (result === null) {
      send(res, 422, { error: 'no usable estimate' });
      return;
    }
    send(res, 200, result);
  } catch {
    send(res, 502, { error: 'upstream request failed' });
  }
});

server.listen(PORT, () => console.log(`calcifer api listening on ${PORT}`));
