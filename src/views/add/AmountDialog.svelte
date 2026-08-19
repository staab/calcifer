<script lang="ts">
  import Dialog from '$lib/components/ui/Dialog.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { debounce } from '$lib/utils';

  let {
    open = $bindable(false),
    title,
    label,
    unit,
    kcalPreview,
    onconfirm,
    estimateAmount,
    initialAmount = null,
  }: {
    open: boolean;
    title: string;
    label: 'Minutes' | 'Grams';
    unit: 'min' | 'g';
    kcalPreview: (amount: number) => number;
    onconfirm: (amount: number) => void;
    estimateAmount?: (estimate: string) => Promise<number | null>;
    initialAmount?: number | null;
  } = $props();

  let amountText = $state('');
  let estimateText = $state('');
  let touched = $state(false);
  let estimating = $state(false);
  let seq = 0;
  const amount = $derived(Number(amountText) || 0);

  const requestEstimate = debounce(async () => {
    if (!estimateAmount || estimateText.trim() === '') return;
    const id = ++seq;
    estimating = true;
    const result = await estimateAmount(estimateText);
    if (id !== seq) return;
    estimating = false;
    if (result !== null && !touched) amountText = String(result);
  }, 600);

  $effect(() => {
    if (open) {
      amountText = initialAmount === null ? '' : String(initialAmount);
      estimateText = '';
      touched = false;
      estimating = false;
      seq++;
    }
  });
</script>

<Dialog bind:open {title}>
  <div class="flex flex-col gap-3">
    {#if estimateAmount}
      <div>
        <span class="mb-1 block text-sm text-muted-foreground">Describe it (optional)</span>
        <Input
          bind:value={estimateText}
          placeholder={unit === 'min' ? 'e.g. a walk around the block' : 'e.g. a large bowl'}
          oninput={requestEstimate}
        />
      </div>
    {/if}
    <span class="text-sm text-muted-foreground">{label}</span>
    <div class="flex items-center gap-2">
      <Input
        bind:value={amountText}
        type="number"
        inputmode="decimal"
        placeholder="0"
        class="flex-1"
        clearable
        loading={estimating && !touched}
        oninput={() => (touched = true)}
        onclear={() => {
          touched = false;
          requestEstimate();
        }}
      />
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
