<script lang="ts">
  import type { BoundActivity, BoundMeal } from '$src/domain/types';
  import { activityCalories, mealCalories, mealMacros } from '$src/domain/energy';
  import { formatMinutes, formatMacrosCompact } from '$lib/format';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';

  let {
    title,
    kind,
    items,
    summary = [],
    onadd,
    ondelete,
  }: {
    title: string;
    kind: 'activity' | 'meal';
    items: (BoundActivity | BoundMeal)[];
    summary?: string[];
    onadd: () => void;
    ondelete: (id: string) => void;
  } = $props();

  interface Row {
    id: string;
    title: string;
    subtitle: string;
    kcal: number;
  }

  const rows: Row[] = $derived(
    items.map((item) =>
      kind === 'activity'
        ? {
            id: item.id,
            title: item.title,
            subtitle: formatMinutes((item as BoundActivity).minutes),
            kcal: activityCalories((item as BoundActivity).caloriesPerHour, (item as BoundActivity).minutes),
          }
        : {
            id: item.id,
            title: item.title,
            subtitle: formatMacrosCompact(mealMacros((item as BoundMeal).macrosPer100g, (item as BoundMeal).grams)),
            kcal: mealCalories((item as BoundMeal).macrosPer100g, (item as BoundMeal).grams),
          }
    )
  );

  let confirmOpen = $state(false);
  let pending = $state<Row | null>(null);
</script>

<section class="mt-6">
  <div class="flex items-end justify-between px-1">
    <h2 class="flex items-center gap-2 text-lg font-semibold">
      {#if kind === 'activity'}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="14" cy="4" r="2" />
          <path d="M13.7 8.3 11 7.2c-.6-.2-1.2-.1-1.7.3L6.6 9.6a1 1 0 1 0 1.3 1.5l2.4-1.9.9.4-2.8 6.1-3.5.7a1 1 0 1 0 .4 2l4-.8c.3-.1.6-.3.7-.6l1-2.1 2.6 2.3.6 3.9a1 1 0 1 0 2-.3l-.6-4.2c0-.2-.2-.5-.4-.6l-2.1-1.9 1.6-3.4.9 1.3c.2.3.5.4.8.4l2.6.3a1 1 0 1 0 .2-2l-2.2-.2-1.8-2.6c-.2-.2-.4-.4-.5-.6z" />
        </svg>
      {/if}
      {title}
    </h2>
    {#if summary.length > 0}
      <div class="text-right">
        {#each summary as line, i (i)}
          <div class={i === 0 ? 'text-sm font-medium' : 'text-xs text-muted-foreground'}>{line}</div>
        {/each}
      </div>
    {/if}
  </div>

  <div class="mt-3 space-y-2">
    {#each rows as row (row.id)}
      <Card class="flex items-center gap-2 py-3">
        <div class="min-w-0 flex-1">
          <div class="truncate font-medium">{row.title}</div>
          <div class="text-sm text-muted-foreground">{row.subtitle}</div>
        </div>
        <div class="text-sm font-semibold whitespace-nowrap">{row.kcal} kcal</div>
        <Button
          variant="ghost"
          size="icon"
          class="shrink-0 text-muted-foreground"
          onclick={() => {
            pending = row;
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
    <Button variant="secondary" class="w-full" onclick={onadd}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M12 5v14" /><path d="M5 12h14" />
      </svg>
    </Button>
  </div>
</section>

<ConfirmDialog
  bind:open={confirmOpen}
  title="Delete entry"
  message={`Delete "${pending?.title ?? ''}"?`}
  onconfirm={() => {
    if (pending) ondelete(pending.id);
  }}
/>
