<script lang="ts">
  import type { MealSlot } from '$src/domain/types';
  import { SLOT_ORDER } from '$src/domain/constants';
  import { emptyDayLog, dayTotals, mealsBySlot, slotTotals } from '$src/domain/daylog';
  import { macroTargets } from '$src/domain/energy';
  import { todayKey, addDays, shortLabel } from '$lib/date';
  import { formatMacrosCompact } from '$lib/format';
  import { navigate, selectedDate, addMealSlot } from '$src/state/app';
  import { settings } from '$src/state/settings';
  import { dayLogs, removeActivity, removeMeal } from '$src/state/log';
  import Button from '$lib/components/ui/Button.svelte';
  import DaySummary from './dashboard/DaySummary.svelte';
  import LogSection from './dashboard/LogSection.svelte';

  const SLOT_LABEL: Record<MealSlot, string> = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snack: 'Snack',
  };

  const log = $derived($dayLogs[$selectedDate] ?? emptyDayLog());
  const totals = $derived(dayTotals(log));
  const targets = $derived(macroTargets($settings, totals.burned));
  const bySlot = $derived(mealsBySlot(log));

  const dayLabel = $derived(
    $selectedDate === todayKey()
      ? 'Today'
      : $selectedDate === addDays(todayKey(), -1)
        ? 'Yesterday'
        : shortLabel($selectedDate)
  );

  function slotSummary(slot: MealSlot): string[] {
    const meals = bySlot[slot];
    if (meals.length === 0) return [];
    const t = slotTotals(meals);
    return [`${t.calories} kcal`, formatMacrosCompact(t.macros)];
  }

  function openAddMeal(slot: MealSlot) {
    addMealSlot.set(slot);
    navigate('add-meal');
  }

  let touchX = 0;
  let touchY = 0;

  function handleTouchStart(e: TouchEvent) {
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
  }

  function handleTouchEnd(e: TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchX;
    const dy = e.changedTouches[0].clientY - touchY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > 2 * Math.abs(dy)) {
      selectedDate.set(addDays($selectedDate, dx < 0 ? 1 : -1));
    }
  }
</script>

<div class="p-4" role="presentation" ontouchstart={handleTouchStart} ontouchend={handleTouchEnd}>
  <div class="mb-3 flex items-center justify-between">
    <Button variant="ghost" size="icon" onclick={() => selectedDate.set(addDays($selectedDate, -1))}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m15 18-6-6 6-6" />
      </svg>
    </Button>
    <span class="text-lg font-semibold">{dayLabel}</span>
    <Button variant="ghost" size="icon" onclick={() => selectedDate.set(addDays($selectedDate, 1))}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m9 18 6-6-6-6" />
      </svg>
    </Button>
  </div>

  <DaySummary {totals} {targets} />

  <LogSection
    title="Activity"
    kind="activity"
    items={log.activities}
    onadd={() => navigate('add-activity')}
    ondelete={(id) => removeActivity($selectedDate, id)}
  />

  {#each SLOT_ORDER as slot (slot)}
    <LogSection
      title={SLOT_LABEL[slot]}
      kind="meal"
      items={bySlot[slot]}
      summary={slotSummary(slot)}
      onadd={() => openAddMeal(slot)}
      ondelete={(id) => removeMeal($selectedDate, id)}
    />
  {/each}
</div>
