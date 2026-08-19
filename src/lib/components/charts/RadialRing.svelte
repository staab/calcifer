<script lang="ts">
  let {
    consumed,
    goal,
    size = 224,
    strokeWidth = 16,
  }: {
    consumed: number;
    goal: number;
    size?: number;
    strokeWidth?: number;
  } = $props();

  const r = $derived((size - strokeWidth) / 2);
  const c = $derived(2 * Math.PI * r);
  const over = $derived(consumed > goal);

  const primarySweep = $derived(
    over ? 360 : goal > 0 ? Math.min((consumed / goal) * 360, 359.9) : 0
  );
  // Overflow arc from 12 o'clock, same overlap rule as BudgetBar.
  const overSweep = $derived(over && consumed > 0 ? ((consumed - goal) / consumed) * 360 : 0);

  const dash = (sweep: number) => `${(sweep / 360) * c} ${c}`;

  const remaining = $derived(Math.round(goal - consumed));
</script>

<div class="relative" style="width: {size}px; height: {size}px">
  <svg width={size} height={size} viewBox="0 0 {size} {size}" class="-rotate-90">
    <circle
      cx={size / 2}
      cy={size / 2}
      {r}
      fill="none"
      stroke="var(--muted)"
      stroke-width={strokeWidth}
    />
    {#if primarySweep > 0}
      <circle
        cx={size / 2}
        cy={size / 2}
        {r}
        fill="none"
        stroke="var(--calories)"
        stroke-width={strokeWidth}
        stroke-linecap="round"
        stroke-dasharray={dash(primarySweep)}
      />
    {/if}
    {#if overSweep > 0}
      <circle
        cx={size / 2}
        cy={size / 2}
        {r}
        fill="none"
        stroke="var(--calories-over)"
        stroke-width={strokeWidth}
        stroke-linecap="round"
        stroke-dasharray={dash(Math.min(overSweep, 359.9))}
      />
    {/if}
  </svg>
  <div class="absolute inset-0 flex flex-col items-center justify-center">
    <span class="text-4xl font-bold">{Math.abs(remaining)}</span>
    <span class="text-sm text-muted-foreground">{remaining < 0 ? 'kcal over' : 'kcal left'}</span>
  </div>
</div>
