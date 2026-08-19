<script lang="ts">
  import Slider from '$lib/components/ui/Slider.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { rebalanceSplit } from '$src/domain/energy';
  import { DEFAULT_MACRO_SPLIT } from '$src/domain/constants';
  import type { MacroSplit } from '$src/domain/types';

  let { split, onchange }: { split: MacroSplit; onchange: (s: MacroSplit) => void } = $props();

  const rows: { key: keyof MacroSplit; label: string; sliderClass: string; dotClass: string }[] = [
    { key: 'carbsPct', label: 'Carbs', sliderClass: '[--slider-color:var(--carbs)]!', dotClass: 'bg-carbs' },
    { key: 'fatPct', label: 'Fat', sliderClass: '[--slider-color:var(--fat)]!', dotClass: 'bg-fat' },
    { key: 'proteinPct', label: 'Protein', sliderClass: '[--slider-color:var(--protein)]!', dotClass: 'bg-protein' },
  ];

  function slide(key: keyof MacroSplit, e: Event) {
    onchange(rebalanceSplit(split, key, Number((e.target as HTMLInputElement).value)));
  }
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-sm font-semibold">Macro split</h2>
      <p class="text-xs text-muted-foreground">{split.carbsPct + split.fatPct + split.proteinPct}% total</p>
    </div>
    <Button variant="ghost" size="sm" onclick={() => onchange(DEFAULT_MACRO_SPLIT)}>Reset</Button>
  </div>
  {#each rows as row (row.key)}
    <div>
      <div class="mb-2 flex items-center justify-between">
        <span class="flex items-center gap-2 text-sm">
          <span class={['size-2.5 rounded-full', row.dotClass]}></span>
          {row.label}
        </span>
        <span class="rounded-md bg-muted px-2 py-0.5 text-sm tabular-nums">{split[row.key]} %</span>
      </div>
      <Slider value={split[row.key]} min={0} max={100} step={1} class={row.sliderClass} oninput={(e) => slide(row.key, e)} />
    </div>
  {/each}
</div>
