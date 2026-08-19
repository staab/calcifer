<script lang="ts">
  import { cn } from '$lib/utils';

  let {
    value = $bindable(''),
    type = 'text',
    placeholder = '',
    clearable = false,
    loading = false,
    onclear,
    oninput,
    class: className = '',
    inputmode,
  }: {
    value: string | number | null;
    type?: 'text' | 'number' | 'password';
    placeholder?: string;
    clearable?: boolean;
    loading?: boolean;
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
      (loading || (clearable && value !== '' && value !== null)) && 'pr-9'
    )}
  />
  {#if loading}
    <span class="absolute top-1/2 right-2 -translate-y-1/2 p-1 text-muted-foreground">
      <svg class="size-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    </span>
  {:else if clearable && value !== '' && value !== null}
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
