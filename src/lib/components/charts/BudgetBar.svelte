<script lang="ts">
  import { cn } from '$lib/utils';

  let {
    value,
    max,
    color,
    class: className = '',
  }: {
    value: number;
    max: number;
    color: 'calories' | 'carbs' | 'fat' | 'protein';
    class?: string;
  } = $props();

  const fillPct = $derived(max > 0 ? Math.min(value / max, 1) * 100 : 0);
  // Over budget: overflow segment anchored left on top of the full primary fill ("#####=====").
  const overPct = $derived(value > max && value > 0 ? ((value - max) / value) * 100 : 0);
</script>

<div class={cn('relative h-2 w-full overflow-hidden rounded-full bg-muted', className)}>
  <div
    class="absolute inset-y-0 left-0 rounded-full"
    style="width: {fillPct}%; background: var(--{color})"
  ></div>
  {#if overPct > 0}
    <div
      class="absolute inset-y-0 left-0 rounded-full"
      style="width: {overPct}%; background: var(--{color}-over)"
    ></div>
  {/if}
</div>
