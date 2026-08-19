<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    open = $bindable(false),
    title,
    children,
  }: {
    open: boolean;
    title?: string;
    children: Snippet;
  } = $props();

  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') open = false;
  }
</script>

<svelte:window {onkeydown} />

{#if open}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-6">
    <button
      type="button"
      aria-label="Close"
      class="absolute inset-0 bg-black/60"
      onclick={() => (open = false)}
    ></button>
    <div
      class="relative w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-xl"
      role="dialog"
      aria-modal="true"
    >
      {#if title}
        <h2 class="mb-3 text-lg font-semibold">{title}</h2>
      {/if}
      {@render children()}
    </div>
  </div>
{/if}
