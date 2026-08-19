<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import MacroSplitSliders from './settings/MacroSplitSliders.svelte';
  import { settings, llmConfig } from '$src/state/settings';
  import { tdee, calorieGoal, macroTargets } from '$src/domain/energy';
  import { GOAL_OFFSET_KCAL } from '$src/domain/constants';
  import type { ActivityLevel, Goal, MacroSplit } from '$src/domain/types';

  let age = $state(String($settings.age));
  let heightCm = $state(String($settings.heightCm));
  let weightLbs = $state(String($settings.weightLbs));
  let adjustment = $state(String($settings.dailyKcalAdjustment));
  let activityLevel = $state<string>($settings.activityLevel);
  let goal = $state<string>($settings.goal);
  let braveApiKey = $state($llmConfig.braveApiKey);

  function commitApiKey(key: string) {
    llmConfig.update((c) => ({ ...c, braveApiKey: key.trim() }));
  }

  const activityOptions = [
    { value: 'sedentary', label: 'Sedentary' },
    { value: 'lowActive', label: 'Low Active' },
    { value: 'active', label: 'Active' },
    { value: 'veryActive', label: 'Very Active' },
  ];
  const goalOptions = [
    { value: 'lose', label: 'Lose weight' },
    { value: 'maintain', label: 'Maintain' },
    { value: 'gain', label: 'Gain weight' },
  ];

  // bind:value on type="number" inputs yields string | number | null at runtime
  function commitPositive(key: 'age' | 'heightCm' | 'weightLbs', value: string | number | null) {
    const n = value === '' || value === null ? NaN : Number(value);
    if (Number.isFinite(n) && n > 0) settings.update((s) => ({ ...s, [key]: n }));
  }

  function commitAdjustment(value: string | number | null) {
    const n = value === '' || value === null ? NaN : Number(value);
    if (Number.isFinite(n)) settings.update((s) => ({ ...s, dailyKcalAdjustment: n }));
  }

  function syncFromStore() {
    age = String($settings.age);
    heightCm = String($settings.heightCm);
    weightLbs = String($settings.weightLbs);
    adjustment = String($settings.dailyKcalAdjustment);
  }

  function setSplit(split: MacroSplit) {
    settings.update((s) => ({ ...s, macroSplit: split }));
  }

  const maintenance = $derived(tdee($settings));
  const goalOffset = $derived(GOAL_OFFSET_KCAL[$settings.goal]);
  const targets = $derived(macroTargets($settings, 0));

  const signed = (n: number) => (n >= 0 ? `+${n}` : `${n}`);
</script>

<div class="space-y-4 p-4">
  <h1 class="text-lg font-semibold">Settings</h1>

  <Card>
    <h2 class="mb-3 text-sm font-semibold">Profile</h2>
    <div class="grid grid-cols-3 gap-3" onfocusout={syncFromStore}>
      <div>
        <span class="mb-1 block text-xs text-muted-foreground">Age</span>
        <Input bind:value={age} type="number" inputmode="numeric" oninput={() => commitPositive('age', age)} />
      </div>
      <div>
        <span class="mb-1 block text-xs text-muted-foreground">Height cm</span>
        <Input bind:value={heightCm} type="number" inputmode="decimal" oninput={() => commitPositive('heightCm', heightCm)} />
      </div>
      <div>
        <span class="mb-1 block text-xs text-muted-foreground">Weight lbs</span>
        <Input bind:value={weightLbs} type="number" inputmode="decimal" oninput={() => commitPositive('weightLbs', weightLbs)} />
      </div>
    </div>
  </Card>

  <Card>
    <h2 class="mb-3 text-sm font-semibold">Goal</h2>
    <div class="space-y-3" onfocusout={syncFromStore}>
      <div>
        <span class="mb-1 block text-xs text-muted-foreground">Activity level</span>
        <Select
          bind:value={activityLevel}
          options={activityOptions}
          onchange={() => settings.update((s) => ({ ...s, activityLevel: activityLevel as ActivityLevel }))}
        />
      </div>
      <div>
        <span class="mb-1 block text-xs text-muted-foreground">Goal</span>
        <Select
          bind:value={goal}
          options={goalOptions}
          onchange={() => settings.update((s) => ({ ...s, goal: goal as Goal }))}
        />
      </div>
      <div>
        <span class="mb-1 block text-xs text-muted-foreground">Daily kcal adjustment</span>
        <Input bind:value={adjustment} type="number" inputmode="numeric" oninput={() => commitAdjustment(adjustment)} />
      </div>
    </div>
  </Card>

  <Card>
    <MacroSplitSliders split={$settings.macroSplit} onchange={setSplit} />
  </Card>

  <Card>
    <h2 class="mb-3 text-sm font-semibold">Your targets</h2>
    <div class="space-y-2 text-sm">
      <div class="flex justify-between">
        <span class="text-muted-foreground">Maintenance (TDEE)</span>
        <span class="tabular-nums">{maintenance} kcal</span>
      </div>
      <div class="flex justify-between">
        <span class="text-muted-foreground">Goal adjustment</span>
        <span class="tabular-nums">{signed(goalOffset)} kcal</span>
      </div>
      <div class="flex justify-between">
        <span class="text-muted-foreground">Daily adjustment</span>
        <span class="tabular-nums">{signed($settings.dailyKcalAdjustment)} kcal</span>
      </div>
      <div class="flex justify-between border-t border-border pt-2 font-semibold">
        <span>Daily calorie goal</span>
        <span class="tabular-nums">{calorieGoal($settings, 0)} kcal</span>
      </div>
      <div class="flex justify-between">
        <span class="flex items-center gap-2 text-muted-foreground"><span class="size-2.5 rounded-full bg-carbs"></span>Carbs</span>
        <span class="tabular-nums">{targets.carbs} g</span>
      </div>
      <div class="flex justify-between">
        <span class="flex items-center gap-2 text-muted-foreground"><span class="size-2.5 rounded-full bg-fat"></span>Fat</span>
        <span class="tabular-nums">{targets.fat} g</span>
      </div>
      <div class="flex justify-between">
        <span class="flex items-center gap-2 text-muted-foreground"><span class="size-2.5 rounded-full bg-protein"></span>Protein</span>
        <span class="tabular-nums">{targets.protein} g</span>
      </div>
    </div>
  </Card>

  <Card>
    <h2 class="mb-3 text-sm font-semibold">AI estimates</h2>
    <span class="mb-1 block text-xs text-muted-foreground">Brave LLM API key</span>
    <Input
      bind:value={braveApiKey}
      type="password"
      placeholder="API key"
      clearable
      oninput={() => commitApiKey(braveApiKey)}
      onclear={() => commitApiKey('')}
    />
    <p class="mt-2 text-xs text-muted-foreground">
      Used to auto-estimate calories and macros as you type. Get a key at
      <a href="https://api-dashboard.search.brave.com" target="_blank" rel="noreferrer" class="underline">api-dashboard.search.brave.com</a>.
    </p>
  </Card>
</div>
