<script lang="ts">
  import Dialog from './Dialog.svelte';
  import Button from './Button.svelte';

  let {
    open = $bindable(false),
    title,
    message,
    confirmLabel = 'Delete',
    onconfirm,
  }: {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onconfirm: () => void;
  } = $props();
</script>

<Dialog bind:open {title}>
  <p class="text-sm text-muted-foreground">{message}</p>
  <div class="mt-5 flex justify-end gap-2">
    <Button variant="ghost" onclick={() => (open = false)}>Cancel</Button>
    <Button
      variant="destructive"
      onclick={() => {
        open = false;
        onconfirm();
      }}
    >
      {confirmLabel}
    </Button>
  </div>
</Dialog>
