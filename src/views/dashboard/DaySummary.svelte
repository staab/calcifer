<script lang="ts">
  import type { MacroTargets } from '$src/domain/types';
  import type { DayTotals } from '$src/domain/daylog';
  import Card from '$lib/components/ui/Card.svelte';
  import RadialRing from '$lib/components/charts/RadialRing.svelte';
  import BudgetBar from '$lib/components/charts/BudgetBar.svelte';

  let { totals, targets }: { totals: DayTotals; targets: MacroTargets } = $props();

  const macroRows = $derived(
    (['carbs', 'fat', 'protein'] as const).map((key) => ({
      key,
      consumed: totals.macros[key],
      target: targets[key],
    }))
  );
</script>

<Card>
  <div class="flex items-start justify-between">
    <div class="flex flex-col items-center gap-1">
      <span class="flex size-11 items-center justify-center rounded-full bg-muted text-protein">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 5v14" /><path d="m19 12-7 7-7-7" />
        </svg>
      </span>
      <span class="text-xl font-bold">{totals.consumed}</span>
      <span class="text-sm text-muted-foreground">supplied</span>
    </div>
    <div class="flex flex-col items-center gap-1">
      <span class="flex size-11 items-center justify-center rounded-full bg-muted text-carbs">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
      </span>
      <span class="text-xl font-bold">{totals.burned}</span>
      <span class="text-sm text-muted-foreground">burned</span>
    </div>
  </div>
  <div class="flex justify-center pt-2 pb-4">
    <RadialRing consumed={totals.consumed} goal={targets.calories} />
  </div>
</Card>

<div class="mt-4 grid grid-cols-3 gap-3">
  {#each macroRows as m (m.key)}
    <Card class="p-3">
      <div class="flex items-center gap-1.5 text-sm font-medium">
        <span class="size-2 shrink-0 rounded-full" style="background: var(--{m.key})"></span>
        {m.key}
      </div>
      <BudgetBar class="mt-3" value={m.consumed} max={m.target} color={m.key} />
      <div class="mt-3 text-sm text-muted-foreground">{Math.round(m.consumed)}/{m.target} g</div>
    </Card>
  {/each}
</div>
