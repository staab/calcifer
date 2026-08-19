<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';

  let {
    addLabel,
    items,
    onadd,
    onselect,
  }: {
    addLabel: string;
    items: { title: string; description: string; detail?: string }[];
    onadd: () => void;
    onselect: (index: number) => void;
  } = $props();
</script>

<div class="flex flex-col gap-3">
  <Button class="w-full" onclick={onadd}>{addLabel}</Button>
  {#if items.length > 0}
    <h2 class="mt-2 text-sm font-medium text-muted-foreground">Recent</h2>
    {#each items as item, i}
      <button type="button" class="w-full text-left" onclick={() => onselect(i)}>
        <Card class="flex items-center gap-3">
          <div class="min-w-0 flex-1">
            <div class="truncate font-medium">{item.title}</div>
            {#if item.description}
              <div class="line-clamp-2 text-sm text-muted-foreground">{item.description}</div>
            {/if}
            {#if item.detail}
              <div class="mt-0.5 text-xs text-muted-foreground">{item.detail}</div>
            {/if}
          </div>
          <span class="shrink-0 rounded-full bg-muted p-1.5 text-muted-foreground">
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
        </Card>
      </button>
    {/each}
  {/if}
</div>
