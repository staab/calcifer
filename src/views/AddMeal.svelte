<script lang="ts">
  import { back, selectedDate, addMealSlot } from '$src/state/app';
  import { addMeal } from '$src/state/log';
  import { unboundMeals, saveUnboundMeal, touchUnboundMeal, removeUnboundMeal } from '$src/state/library';
  import { mealCalories, mealMacros } from '$src/domain/energy';
  import { canEstimate, estimateMealGrams } from '$src/adapters/jev';
  import type { UnboundMeal } from '$src/domain/types';
  import { formatMacrosCompact } from '$lib/format';
  import Button from '$lib/components/ui/Button.svelte';
  import RecentList from '$src/views/add/RecentList.svelte';
  import MealForm from '$src/views/add/MealForm.svelte';
  import AmountDialog from '$src/views/add/AmountDialog.svelte';

  let showForm = $state(false);
  let formTitle = $state('');
  let dialogOpen = $state(false);
  let pending = $state<UnboundMeal>({
    id: '',
    title: '',
    description: '',
    macrosPer100g: { carbs: 0, fat: 0, protein: 0 },
    lastUsedAt: 0,
  });
  let pendingGrams = $state<number | null>(null);

  const recents = $derived($unboundMeals);

  function pick(entry: UnboundMeal, servingGrams: number | null = null) {
    pending = entry;
    pendingGrams = servingGrams;
    dialogOpen = true;
  }

  function confirm(grams: number) {
    addMeal($selectedDate, {
      title: pending.title,
      description: pending.description,
      macrosPer100g: pending.macrosPer100g,
      grams,
      slot: $addMealSlot,
    });
    touchUnboundMeal(pending.id);
    back();
  }
</script>

<div class="flex flex-col gap-4 p-4">
  <div class="flex items-center gap-2">
    <Button
      variant="ghost"
      size="icon"
      onclick={() => (showForm ? (showForm = false) : back())}
    >
      <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 12H5m7-7l-7 7 7 7" />
      </svg>
    </Button>
    <h1 class="text-lg font-semibold">Add meal</h1>
    <span class="ml-auto text-sm text-muted-foreground capitalize">{$addMealSlot}</span>
  </div>

  {#if showForm}
    <MealForm
      initialTitle={formTitle}
      onsubmit={(entry, servingGrams) => pick(saveUnboundMeal(entry), servingGrams)}
    />
  {:else}
    <RecentList
      items={recents.map((r) => ({
        title: r.title,
        description: r.description,
        detail: `${formatMacrosCompact(mealMacros(r.macrosPer100g, 100))} / 100 g`,
      }))}
      onadd={(title) => {
        formTitle = title;
        showForm = true;
      }}
      onselect={(i) => pick(recents[i])}
      ondelete={(i) => removeUnboundMeal(recents[i].id)}
    />
  {/if}
</div>

<AmountDialog
  bind:open={dialogOpen}
  title={pending.title}
  label="Grams"
  unit="g"
  initialAmount={pendingGrams}
  kcalPreview={(grams) => mealCalories(pending.macrosPer100g, grams)}
  estimateAmount={canEstimate
    ? (estimate) => estimateMealGrams(pending.title, pending.description, estimate)
    : undefined}
  onconfirm={confirm}
/>
