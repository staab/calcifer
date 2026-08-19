<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import LineChart from '$lib/components/charts/LineChart.svelte';
  import BudgetBar from '$lib/components/charts/BudgetBar.svelte';
  import { cn } from '$lib/utils';
  import { shortLabel, todayKey } from '$lib/date';
  import { dailyAverage, seriesForRange } from '$src/domain/daylog';
  import { calorieGoal, macroTargets } from '$src/domain/energy';
  import { dayLogs } from '$src/state/log';
  import { settings } from '$src/state/settings';

  const ranges: { label: string; value: number | 'all' }[] = [
    { label: '7d', value: 7 },
    { label: '30d', value: 30 },
    { label: '90d', value: 90 },
    { label: 'All', value: 'all' },
  ];

  let range: number | 'all' = $state(7);

  const points = $derived(seriesForRange($dayLogs, range, todayKey()));
  const hasData = $derived(points.some((p) => p.calories > 0));
  const goal = $derived(calorieGoal($settings, 0));
  const targets = $derived(macroTargets($settings, 0));
  const avg = $derived(dailyAverage(points));

  const chartSeries = $derived([
    { color: 'var(--calories)', points: points.map((p) => p.calories), axis: 'right' as const },
    { color: 'var(--carbs)', points: points.map((p) => p.carbs), axis: 'left' as const },
    { color: 'var(--fat)', points: points.map((p) => p.fat), axis: 'left' as const },
    { color: 'var(--protein)', points: points.map((p) => p.protein), axis: 'left' as const },
  ]);

  const legend = [
    { name: 'calories', color: 'var(--calories)' },
    { name: 'carbs', color: 'var(--carbs)' },
    { name: 'fat', color: 'var(--fat)' },
    { name: 'protein', color: 'var(--protein)' },
  ];

  // At most ~6 evenly spaced x-axis tick labels for long ranges.
  const tickIndices = $derived.by(() => {
    const n = points.length;
    if (n === 0) return [];
    if (n <= 7) return points.map((_, i) => i);
    const idx = Array.from({ length: 6 }, (_, k) => Math.round((k * (n - 1)) / 5));
    return [...new Set(idx)];
  });

  const tickLeft = (i: number) =>
    points.length <= 1 ? 50 : (i / (points.length - 1)) * 100;

  const avgRows = $derived([
    { name: 'calories', color: 'calories', value: Math.round(avg.calories), max: goal, unit: 'kcal' },
    { name: 'carbs', color: 'carbs', value: Math.round(avg.carbs), max: targets.carbs, unit: 'g' },
    { name: 'fat', color: 'fat', value: Math.round(avg.fat), max: targets.fat, unit: 'g' },
    { name: 'protein', color: 'protein', value: Math.round(avg.protein), max: targets.protein, unit: 'g' },
  ] as const);
</script>

<div class="flex flex-col gap-4 p-4">
  <h1 class="text-2xl font-bold">Stats</h1>

  <div class="inline-flex self-start overflow-hidden rounded-full border border-border">
    {#each ranges as r (r.label)}
      <button
        type="button"
        class={cn(
          'px-5 py-2 text-sm font-medium transition-colors',
          range === r.value ? 'bg-muted text-foreground' : 'text-muted-foreground'
        )}
        onclick={() => (range = r.value)}
      >
        {r.label}
      </button>
    {/each}
  </div>

  <Card>
    <h2 class="text-lg font-semibold">Calories &amp; macros</h2>
    {#if hasData}
      <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {#each legend as l (l.name)}
          <span class="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span class="size-2 rounded-full" style="background: {l.color}"></span>
            {l.name}
          </span>
        {/each}
      </div>
      <div class="mt-3">
        <LineChart series={chartSeries} labels={points.map((p) => shortLabel(p.date))} referenceValue={goal} />
        <div class="relative mt-1 h-4">
          {#each tickIndices as i (i)}
            <span
              class="absolute -translate-x-1/2 text-[10px] text-muted-foreground"
              style="left: {tickLeft(i)}%"
            >
              {shortLabel(points[i].date)}
            </span>
          {/each}
        </div>
      </div>
    {:else}
      <p class="mt-4 py-8 text-center text-sm text-muted-foreground">No data yet</p>
    {/if}
  </Card>

  <Card>
    <h2 class="text-lg font-semibold">Daily average</h2>
    <div class="mt-3 flex flex-col gap-4">
      {#each avgRows as row (row.name)}
        <div>
          <div class="mb-1.5 flex items-baseline justify-between">
            <span class="text-sm font-medium">{row.name}</span>
            <span class="text-sm text-muted-foreground">{row.value} / {row.max} {row.unit}</span>
          </div>
          <BudgetBar value={row.value} max={row.max} color={row.color} />
        </div>
      {/each}
    </div>
  </Card>
</div>
