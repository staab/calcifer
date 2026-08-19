<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import { DEFAULT_MACRO_SPLIT } from '$src/domain/constants';
  import type { MacroSplit } from '$src/domain/types';

  let { split, onchange }: { split: MacroSplit; onchange: (s: MacroSplit) => void } = $props();

  const legend: { key: keyof MacroSplit; label: string; dotClass: string }[] = [
    { key: 'carbsPct', label: 'Carbs', dotClass: 'bg-carbs' },
    { key: 'fatPct', label: 'Fat', dotClass: 'bg-fat' },
    { key: 'proteinPct', label: 'Protein', dotClass: 'bg-protein' },
  ];

  // the knobs mark the carbs/fat and fat/protein boundaries, so segments always sum to 100%
  const k1 = $derived(split.carbsPct);
  const k2 = $derived(split.carbsPct + split.fatPct);
  const gradient = $derived(
    `linear-gradient(to right, var(--carbs) 0%, var(--carbs) ${k1}%, var(--fat) ${k1}%, var(--fat) ${k2}%, var(--protein) ${k2}%, var(--protein) 100%)`,
  );

  let track = $state<HTMLDivElement>();
  let dragging = $state<number | null>(null);

  function fromKnobs(a: number, b: number): MacroSplit {
    return { carbsPct: a, fatPct: b - a, proteinPct: 100 - b };
  }

  function moveKnob(knob: number, pct: number) {
    if (knob === 0) onchange(fromKnobs(Math.max(0, Math.min(pct, k2)), k2));
    else onchange(fromKnobs(k1, Math.max(k1, Math.min(pct, 100))));
  }

  function drag(e: PointerEvent) {
    if (dragging === null || !track) return;
    const rect = track.getBoundingClientRect();
    moveKnob(dragging, Math.round(((e.clientX - rect.left) / rect.width) * 100));
  }

  function nudge(knob: number, e: KeyboardEvent) {
    let delta = 0;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') delta = -1;
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') delta = 1;
    else return;
    e.preventDefault();
    moveKnob(knob, (knob === 0 ? k1 : k2) + delta);
  }

  const labels = ['Carbs/fat boundary', 'Fat/protein boundary'];
</script>

<div>
  <div class="mb-3 flex items-center justify-between">
    <h2 class="text-sm font-semibold">Macro split</h2>
    <Button variant="ghost" size="sm" onclick={() => onchange(DEFAULT_MACRO_SPLIT)}>Reset</Button>
  </div>

  <div bind:this={track} class="relative h-2 rounded-full" style:background={gradient}>
    {#each labels as label, i (label)}
      <div
        role="slider"
        tabindex="0"
        aria-label={label}
        aria-valuemin={i === 0 ? 0 : k1}
        aria-valuemax={i === 0 ? k2 : 100}
        aria-valuenow={i === 0 ? k1 : k2}
        class="knob"
        style:left="{i === 0 ? k1 : k2}%"
        onpointerdown={(e) => {
          dragging = i;
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onpointermove={drag}
        onpointerup={() => (dragging = null)}
        onpointercancel={() => (dragging = null)}
        onkeydown={(e) => nudge(i, e)}
      ></div>
    {/each}
  </div>

  <div class="mt-3 flex justify-between text-sm">
    {#each legend as item (item.key)}
      <span class="flex items-center gap-2">
        <span class={['size-2.5 rounded-full', item.dotClass]}></span>
        {item.label}
        <span class="rounded-md bg-muted px-1.5 py-0.5 text-xs tabular-nums">{split[item.key]}%</span>
      </span>
    {/each}
  </div>
</div>

<style>
  .knob {
    position: absolute;
    top: 50%;
    width: 1.25rem;
    height: 1.25rem;
    transform: translate(-50%, -50%);
    border-radius: 9999px;
    background: var(--foreground);
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.5);
    cursor: grab;
    touch-action: none;
  }
  .knob:active {
    cursor: grabbing;
  }
  .knob:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }
</style>
