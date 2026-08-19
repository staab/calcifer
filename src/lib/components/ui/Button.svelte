<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';

  let {
    variant = 'default',
    size = 'default',
    class: className = '',
    onclick,
    disabled = false,
    children,
  }: {
    variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
    size?: 'default' | 'sm' | 'icon';
    class?: string;
    onclick?: (e: MouseEvent) => void;
    disabled?: boolean;
    children: Snippet;
  } = $props();

  const variants = {
    default: 'bg-primary text-primary-foreground active:bg-primary/85',
    secondary: 'bg-muted text-foreground active:bg-muted/80',
    outline: 'border border-border bg-transparent text-foreground active:bg-muted/50',
    ghost: 'bg-transparent text-foreground active:bg-muted/50',
    destructive: 'bg-destructive text-primary-foreground active:bg-destructive/85',
  };

  const sizes = {
    default: 'h-11 px-5 text-sm',
    sm: 'h-9 px-3 text-sm',
    icon: 'size-9',
  };
</script>

<button
  type="button"
  class={cn(
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
    'disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    sizes[size],
    className
  )}
  {onclick}
  {disabled}
>
  {@render children()}
</button>
