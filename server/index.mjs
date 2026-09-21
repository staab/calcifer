import { createServer } from 'node:http';

const PORT = Number(process.env.PORT ?? 8788);
const API_KEY = process.env.TYPESAFE_API_KEY ?? '';
const UPSTREAM = 'https://api.typesafe.ai/v1/systemone';
const TIMEOUT_MS = 15000;
const MAX_BODY_BYTES = 64 * 1024;

if (API_KEY === '') {
  console.error('TYPESAFE_API_KEY is not set');
  process.exit(1);
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function send(res, status, body) {
  res.writeHead(status, { ...CORS, 'Content-Type': 'application/json' });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
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
  if (req.method !== 'POST' || req.url !== '/systemone') {
    send(res, 404, { error: 'not found' });
    return;
  }

  let body;
  try {
    body = await readBody(req);
  } catch {
    res.writeHead(413, { ...CORS, 'Content-Type': 'application/json', Connection: 'close' });
    res.end(JSON.stringify({ error: 'request too large' }));
    return;
  }

  try {
    const upstream = await fetch(UPSTREAM, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    send(res, upstream.status, await upstream.text());
  } catch {
    send(res, 502, { error: 'upstream request failed' });
  }
});

server.listen(PORT, () => console.log(`jev proxy listening on ${PORT}`));
