<script lang="ts">
  import { view, type View } from '$src/state/app';
  import { cn } from '$lib/utils';

  const tabs: { id: View; label: string; icon: string }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10',
    },
    {
      id: 'stats',
      label: 'Stats',
      icon: 'M4 20V10m6 10V4m6 16v-7m4 7H2',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'M10.325 4.317a1.724 1.724 0 013.35 0 1.724 1.724 0 002.573 1.066 1.724 1.724 0 012.37 2.37 1.724 1.724 0 001.065 2.572 1.724 1.724 0 010 3.35 1.724 1.724 0 00-1.066 2.573 1.724 1.724 0 01-2.37 2.37 1.724 1.724 0 00-2.572 1.065 1.724 1.724 0 01-3.35 0 1.724 1.724 0 00-2.573-1.066 1.724 1.724 0 01-2.37-2.37 1.724 1.724 0 00-1.065-2.572 1.724 1.724 0 010-3.35 1.724 1.724 0 001.066-2.573 1.724 1.724 0 012.37-2.37c.996.574 2.25.072 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z',
    },
  ];
</script>

<nav
  class="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]"
>
  <div class="mx-auto flex max-w-md">
    {#each tabs as tab (tab.id)}
      <button
        type="button"
        class={cn(
          'flex flex-1 flex-col items-center gap-1 py-2.5 text-xs',
          $view === tab.id ? 'font-semibold text-primary' : 'font-medium text-muted-foreground'
        )}
        onclick={() => view.set(tab.id)}
      >
        <span class={cn('rounded-full px-4 py-0.5', $view === tab.id && 'bg-primary/15')}>
          <svg
            class="size-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width={$view === tab.id ? 2.2 : 1.8}
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d={tab.icon} />
          </svg>
        </span>
        {tab.label}
      </button>
    {/each}
  </div>
</nav>
