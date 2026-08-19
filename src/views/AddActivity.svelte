<script lang="ts">
  import { view, selectedDate } from '$src/state/app';
  import { addActivity } from '$src/state/log';
  import {
    unboundActivities,
    saveUnboundActivity,
    touchUnboundActivity,
    removeUnboundActivity,
  } from '$src/state/library';
  import { activityCalories } from '$src/domain/energy';
  import { createLlm } from '$src/adapters/llm';
  import { llmConfig } from '$src/state/settings';
  import type { UnboundActivity } from '$src/domain/types';
  import Button from '$lib/components/ui/Button.svelte';
  import RecentList from '$src/views/add/RecentList.svelte';
  import ActivityForm from '$src/views/add/ActivityForm.svelte';
  import AmountDialog from '$src/views/add/AmountDialog.svelte';

  const llm = $derived(createLlm($llmConfig.openrouterApiKey));
  let showForm = $state(false);
  let dialogOpen = $state(false);
  let pending = $state<UnboundActivity>({ id: '', title: '', description: '', caloriesPerHour: 0, lastUsedAt: 0 });

  const recents = $derived($unboundActivities);

  function pick(entry: UnboundActivity) {
    pending = entry;
    dialogOpen = true;
  }

  function confirm(minutes: number) {
    addActivity($selectedDate, {
      title: pending.title,
      description: pending.description,
      caloriesPerHour: pending.caloriesPerHour,
      minutes,
    });
    touchUnboundActivity(pending.id);
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
    <h1 class="text-lg font-semibold">Add activity</h1>
  </div>

  {#if showForm}
    <ActivityForm onsubmit={(entry) => pick(saveUnboundActivity(entry))} />
  {:else}
    <RecentList
      addLabel="Add activity"
      items={recents.map((r) => ({
        title: r.title,
        description: r.description,
        detail: `${r.caloriesPerHour} kcal/hr`,
      }))}
      onadd={() => (showForm = true)}
      onselect={(i) => pick(recents[i])}
      ondelete={(i) => removeUnboundActivity(recents[i].id)}
    />
  {/if}
</div>

<AmountDialog
  bind:open={dialogOpen}
  title={pending.title}
  label="Minutes"
  unit="min"
  kcalPreview={(minutes) => activityCalories(pending.caloriesPerHour, minutes)}
  estimateAmount={$llmConfig.openrouterApiKey
    ? (estimate) => llm.estimateActivityMinutes(pending.title, pending.description, estimate)
    : undefined}
  onconfirm={confirm}
/>
