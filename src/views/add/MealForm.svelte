<script lang="ts">
  import Input from '$lib/components/ui/Input.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { debounce } from '$lib/utils';
  import { createLlm } from '$src/adapters/llm';
  import { llmConfig } from '$src/state/settings';
  import { caloriesFromMacros } from '$src/domain/energy';
  import type { Macros } from '$src/domain/types';

  let {
    onsubmit,
  }: {
    onsubmit: (entry: { title: string; description: string; macrosPerGram: Macros }) => void;
  } = $props();

  const llm = $derived(createLlm($llmConfig.braveApiKey));
  let title = $state('');
  let description = $state('');
  let texts = $state({ carbs: '', fat: '', protein: '' });
  let touched = $state({ carbs: false, fat: false, protein: false });
  let estimating = $state(false);
  let seq = 0;

  const macroKeys = ['carbs', 'fat', 'protein'] as const;
  const labels = { carbs: 'Carbs g/g', fat: 'Fat g/g', protein: 'Protein g/g' };

  const requestEstimate = debounce(async () => {
    if (title.trim() === '') return;
    const id = ++seq;
    estimating = true;
    const est = await llm.estimateMealMacrosPerGram(title, description);
    if (id !== seq) return;
    estimating = false;
    if (!est) return;
    for (const key of macroKeys) {
      if (!touched[key]) texts[key] = String(est.macrosPerGram[key]);
    }
  }, 600);

  const macrosPerGram = $derived({
    carbs: Number(texts.carbs) || 0,
    fat: Number(texts.fat) || 0,
    protein: Number(texts.protein) || 0,
  });
  const valid = $derived(
    title.trim() !== '' &&
      macroKeys.every((k) => macrosPerGram[k] >= 0) &&
      caloriesFromMacros(macrosPerGram) > 0
  );
</script>

<div class="flex flex-col gap-3">
  <Input bind:value={title} placeholder="Title" oninput={requestEstimate} />
  <Input bind:value={description} placeholder="Description" oninput={requestEstimate} />
  <div class="grid grid-cols-3 gap-2">
    {#each macroKeys as key}
      <div>
        <span class="mb-1 block text-sm text-muted-foreground">{labels[key]}</span>
        <Input
          bind:value={texts[key]}
          type="number"
          inputmode="decimal"
          placeholder="0"
          clearable
          loading={estimating && !touched[key]}
          oninput={() => (touched[key] = true)}
          onclear={() => {
            touched[key] = false;
            requestEstimate();
          }}
        />
      </div>
    {/each}
  </div>
  <Button
    class="mt-1 w-full"
    disabled={!valid}
    onclick={() => onsubmit({ title: title.trim(), description, macrosPerGram })}
  >
    Next
  </Button>
</div>
