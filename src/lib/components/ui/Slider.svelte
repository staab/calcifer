<script lang="ts">
  import { cn } from '$lib/utils';

  let {
    value = $bindable(0),
    min = 0,
    max = 100,
    step = 1,
    class: className = '',
    oninput,
  }: {
    value: number;
    min?: number;
    max?: number;
    step?: number;
    class?: string;
    oninput?: (e: Event) => void;
  } = $props();
</script>

<input
  type="range"
  {min}
  {max}
  {step}
  bind:value
  {oninput}
  class={cn('slider w-full', className)}
/>

<style>
  .slider {
    appearance: none;
    height: 0.5rem;
    border-radius: 9999px;
    background: var(--muted);
    outline: none;
    --slider-color: var(--primary);
  }
  .slider::-webkit-slider-thumb {
    appearance: none;
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 9999px;
    background: var(--slider-color);
    border: none;
    cursor: pointer;
  }
  .slider::-moz-range-thumb {
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 9999px;
    background: var(--slider-color);
    border: none;
    cursor: pointer;
  }
</style>
