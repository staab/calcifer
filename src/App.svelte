<script lang="ts">
  import { fly } from 'svelte/transition';
  import { view } from '$src/state/app';
  import BottomNav from '$lib/components/BottomNav.svelte';
  import Dashboard from '$src/views/Dashboard.svelte';
  import AddActivity from '$src/views/AddActivity.svelte';
  import AddMeal from '$src/views/AddMeal.svelte';
  import Stats from '$src/views/Stats.svelte';
  import Settings from '$src/views/Settings.svelte';

  const hasNav = $derived($view === 'dashboard' || $view === 'stats' || $view === 'settings');
</script>

<div
  class="mx-auto flex min-h-dvh max-w-md flex-col pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]"
>
  <main class={['flex-1', hasNav && 'pb-[calc(5rem+env(safe-area-inset-bottom))]']}>
    {#key $view}
      <div in:fly={{ y: 8, duration: 180 }}>
        {#if $view === 'dashboard'}
          <Dashboard />
        {:else if $view === 'add-activity'}
          <AddActivity />
        {:else if $view === 'add-meal'}
          <AddMeal />
        {:else if $view === 'stats'}
          <Stats />
        {:else if $view === 'settings'}
          <Settings />
        {/if}
      </div>
    {/key}
  </main>
  {#if hasNav}
    <BottomNav />
  {/if}
</div>
