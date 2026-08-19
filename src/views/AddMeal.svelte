<script lang="ts">
  import { view, selectedDate, addMealSlot } from '$src/state/app';
  import { dayLogs, addMeal } from '$src/state/log';
  import { recentMeals, type RecentMeal } from '$src/domain/daylog';
  import { mealCalories, mealMacros } from '$src/domain/energy';
  import { formatMacrosCompact } from '$lib/format';
  import Button from '$lib/components/ui/Button.svelte';
  import RecentList from '$src/views/add/RecentList.svelte';
  import MealForm from '$src/views/add/MealForm.svelte';
  import AmountDialog from '$src/views/add/AmountDialog.svelte';

  let showForm = $state(false);
  let dialogOpen = $state(false);
  let pending = $state<RecentMeal>({
    title: '',
    description: '',
    macrosPerGram: { carbs: 0, fat: 0, protein: 0 },
  });

  const recents = $derived(recentMeals($dayLogs));

  function pick(entry: RecentMeal) {
    pending = entry;
    dialogOpen = true;
  }

  function confirm(grams: number) {
    addMeal($selectedDate, { ...pending, grams, slot: $addMealSlot });
    view.set('dashboard');
  }
</script>

<div class="flex flex-col gap-4 p-4">
  <div class="flex items-center gap-2">
    <Button
      variant="ghost"
      size="icon"
      onclick={() => (showForm ? (showForm = false) : view.set('dashboard'))}
    >
      <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 12H5m7-7l-7 7 7 7" />
      </svg>
    </Button>
    <h1 class="text-lg font-semibold">Add meal</h1>
    <span class="ml-auto text-sm text-muted-foreground capitalize">{$addMealSlot}</span>
  </div>

  {#if showForm}
    <MealForm onsubmit={pick} />
  {:else}
    <RecentList
      addLabel="Add meal"
      items={recents.map((r) => ({
        title: r.title,
        description: r.description,
        detail: `${formatMacrosCompact(mealMacros(r.macrosPerGram, 100))} / 100 g`,
      }))}
      onadd={() => (showForm = true)}
      onselect={(i) => pick(recents[i])}
    />
  {/if}
</div>

<AmountDialog
  bind:open={dialogOpen}
  title={pending.title}
  label="Grams"
  unit="g"
  kcalPreview={(grams) => mealCalories(pending.macrosPerGram, grams)}
  onconfirm={confirm}
/>
