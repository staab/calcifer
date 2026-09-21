<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';

  let {
    items,
    onadd,
    onselect,
    ondelete,
  }: {
    items: { title: string; description: string; detail?: string }[];
    onadd: (title: string) => void;
    onselect: (index: number) => void;
    ondelete: (index: number) => void;
  } = $props();

  let confirmOpen = $state(false);
  let pendingIndex = $state(-1);
  let query = $state('');

  const term = $derived(query.trim());

  const visible = $derived.by(() => {
    const q = term.toLowerCase();
    return items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => q === '' || item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q));
  });
</script>

<div class="flex flex-col gap-3">
  <Input bind:value={query} placeholder="Search" clearable onclear={() => (query = '')} />
  {#if term !== ''}
    <Button class="w-full" onclick={() => onadd(term)}>Add "{term}"</Button>
  {/if}
  {#if items.length > 0}
    <h2 class="mt-2 text-sm font-medium text-muted-foreground">Recent</h2>
    {#each visible as { item, index: i } (i)}
      <Card class="flex items-center gap-3">
        <button type="button" class="flex min-w-0 flex-1 items-center gap-3 text-left" onclick={() => onselect(i)}>
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
        </button>
        <Button
          variant="ghost"
          size="icon"
          class="shrink-0 text-muted-foreground"
          onclick={() => {
            pendingIndex = i;
            confirmOpen = true;
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <path d="M10 11v6" /><path d="M14 11v6" />
          </svg>
        </Button>
      </Card>
    {/each}
  {/if}
</div>

<ConfirmDialog
  bind:open={confirmOpen}
  title="Delete"
  message={`Delete "${items[pendingIndex]?.title ?? ''}"? Entries already logged are kept.`}
  onconfirm={() => {
    if (pendingIndex >= 0) ondelete(pendingIndex);
  }}
/>
