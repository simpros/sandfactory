<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    type = "button",
    class: className = "",
    variant = "secondary",
    disabled = false,
    href,
    onclick,
    children,
  }: {
    type?: "button" | "submit" | "reset";
    class?: string;
    variant?: "primary" | "secondary" | "ghost";
    disabled?: boolean;
    href?: string;
    onclick?: (event: MouseEvent) => void;
    children?: Snippet;
  } = $props();

  const base =
    "inline-flex items-center justify-center min-w-20 h-7 px-4 mac-btn-gradient border border-mac-border-dark rounded text-sm text-black cursor-default select-none whitespace-nowrap active:enabled:mac-btn-gradient-active disabled:text-mac-border-dark";

  const primary =
    "border-2 border-[#222] rounded-[5px] font-bold active:enabled:mac-btn-primary-gradient-active";

  const cls = $derived([base, variant === "primary" && primary, className]);
</script>

{#if href}
  <a class={cls} {href} {onclick}>
    {@render children?.()}
  </a>
{:else}
  <button class={cls} {disabled} {onclick} {type}>
    {@render children?.()}
  </button>
{/if}
