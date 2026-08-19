<script lang="ts">
  import { cn } from '$lib/utils';

  let {
    value = $bindable(''),
    options,
    class: className = '',
    onchange,
  }: {
    value: string;
    options: { value: string; label: string }[];
    class?: string;
    onchange?: (e: Event) => void;
  } = $props();
</script>

<div class={cn('relative', className)}>
  <select
    bind:value
    {onchange}
    class={cn(
      'h-11 w-full appearance-none rounded-lg border border-border bg-card px-3 pr-9 text-sm text-foreground',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60'
    )}
  >
    {#each options as opt (opt.value)}
      <option value={opt.value}>{opt.label}</option>
    {/each}
  </select>
  <svg
    class="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
</div>
