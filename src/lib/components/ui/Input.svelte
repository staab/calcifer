<script lang="ts">
  import { cn } from '$lib/utils';

  let {
    value = $bindable(''),
    type = 'text',
    placeholder = '',
    clearable = false,
    onclear,
    oninput,
    class: className = '',
    inputmode,
  }: {
    value: string | number | null;
    type?: 'text' | 'number';
    placeholder?: string;
    clearable?: boolean;
    onclear?: () => void;
    oninput?: (e: Event) => void;
    class?: string;
    inputmode?: 'text' | 'numeric' | 'decimal';
  } = $props();
</script>

<div class={cn('relative', className)}>
  <input
    {type}
    {placeholder}
    {inputmode}
    bind:value
    {oninput}
    class={cn(
      'h-11 w-full rounded-lg border border-border bg-transparent px-3 text-sm text-foreground',
      'placeholder:text-muted-foreground',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
      clearable && value !== '' && value !== null && 'pr-9'
    )}
  />
  {#if clearable && value !== '' && value !== null}
    <button
      type="button"
      aria-label="Clear"
      class="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1 text-muted-foreground active:text-foreground"
      onclick={() => {
        value = '';
        onclear?.();
      }}
    >
      <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    </button>
  {/if}
</div>
