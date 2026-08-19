<script lang="ts">
  import { view, selectedDate } from '$src/state/app';
  import { dayLogs, addActivity } from '$src/state/log';
  import { recentActivities, type RecentActivity } from '$src/domain/daylog';
  import { activityCalories } from '$src/domain/energy';
  import Button from '$lib/components/ui/Button.svelte';
  import RecentList from '$src/views/add/RecentList.svelte';
  import ActivityForm from '$src/views/add/ActivityForm.svelte';
  import AmountDialog from '$src/views/add/AmountDialog.svelte';

  let showForm = $state(false);
  let dialogOpen = $state(false);
  let pending = $state<RecentActivity>({ title: '', description: '', caloriesPerHour: 0 });

  const recents = $derived(recentActivities($dayLogs));

  function pick(entry: RecentActivity) {
    pending = entry;
    dialogOpen = true;
  }

  function confirm(minutes: number) {
    addActivity($selectedDate, { ...pending, minutes });
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
    <ActivityForm onsubmit={pick} />
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
    />
  {/if}
</div>

<AmountDialog
  bind:open={dialogOpen}
  title={pending.title}
  label="Minutes"
  unit="min"
  kcalPreview={(minutes) => activityCalories(pending.caloriesPerHour, minutes)}
  onconfirm={confirm}
/>
