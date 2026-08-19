<script lang="ts">
  import Dialog from '$lib/components/ui/Dialog.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Button from '$lib/components/ui/Button.svelte';

  let {
    open = $bindable(false),
    title,
    label,
    unit,
    kcalPreview,
    onconfirm,
  }: {
    open: boolean;
    title: string;
    label: 'Minutes' | 'Grams';
    unit: 'min' | 'g';
    kcalPreview: (amount: number) => number;
    onconfirm: (amount: number) => void;
  } = $props();

  let amountText = $state('');
  const amount = $derived(Number(amountText) || 0);

  $effect(() => {
    if (open) amountText = '';
  });
</script>

<Dialog bind:open {title}>
  <div class="flex flex-col gap-3">
    <span class="text-sm text-muted-foreground">{label}</span>
    <div class="flex items-center gap-2">
      <Input bind:value={amountText} type="number" inputmode="decimal" placeholder="0" class="flex-1" />
      <span class="w-8 text-sm text-muted-foreground">{unit}</span>
    </div>
    <div class="text-sm text-muted-foreground">{kcalPreview(amount)} kcal</div>
    <Button
      disabled={!(amount > 0)}
      onclick={() => {
        open = false;
        onconfirm(amount);
      }}
    >
      Add
    </Button>
  </div>
</Dialog>
