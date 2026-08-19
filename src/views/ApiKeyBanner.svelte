<script lang="ts">
  import { view } from '$src/state/app';
  import { llmConfig, bannerDismissed } from '$src/state/settings';
</script>

{#if $llmConfig.openrouterApiKey === '' && !$bannerDismissed}
  <div class="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
    <button type="button" class="flex-1 text-left text-sm text-muted-foreground" onclick={() => view.set('settings')}>
      Add an OpenRouter API key in Settings to auto-estimate calories and macros.
    </button>
    <button
      type="button"
      aria-label="Dismiss"
      class="rounded-full p-1 text-muted-foreground active:text-foreground"
      onclick={() => bannerDismissed.set(true)}
    >
      <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    </button>
  </div>
{/if}