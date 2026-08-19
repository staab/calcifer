<script lang="ts">
  import Input from '$lib/components/ui/Input.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { debounce } from '$lib/utils';
  import { createLlm } from '$src/adapters/llm';
  import { llmConfig } from '$src/state/settings';
  import ApiKeyBanner from '../ApiKeyBanner.svelte';

  let {
    onsubmit,
  }: {
    onsubmit: (entry: { title: string; description: string; caloriesPerHour: number }) => void;
  } = $props();

  const llm = $derived(createLlm($llmConfig.openrouterApiKey));
  let title = $state('');
  let description = $state('');
  let calText = $state('');
  let touched = $state(false);
  let estimating = $state(false);
  let seq = 0;

  const requestEstimate = debounce(async () => {
    if (title.trim() === '') return;
    const id = ++seq;
    estimating = true;
    const est = await llm.estimateActivityCaloriesPerHour(title, description);
    if (id !== seq) return;
    estimating = false;
    if (est && !touched) calText = String(est.caloriesPerHour);
  }, 600);

  const caloriesPerHour = $derived(Number(calText) || 0);
  const valid = $derived(title.trim() !== '' && caloriesPerHour > 0);
</script>

<div class="flex flex-col gap-3">
  <Input bind:value={title} placeholder="Title" oninput={requestEstimate} />
  <Input bind:value={description} placeholder="Description" oninput={requestEstimate} />
  <div>
    <span class="mb-1 block text-sm text-muted-foreground">Calories / hr</span>
    <Input
      bind:value={calText}
      type="number"
      inputmode="decimal"
      placeholder="0"
      clearable
      loading={estimating && !touched}
      oninput={() => (touched = true)}
      onclear={() => {
        touched = false;
        requestEstimate();
      }}
    />
  </div>
  <ApiKeyBanner />
  <Button
    class="mt-1 w-full"
    disabled={!valid}
    onclick={() => onsubmit({ title: title.trim(), description, caloriesPerHour })}
  >
    Next
  </Button>
</div>
