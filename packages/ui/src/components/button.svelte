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

  const cls = $derived([
    "mac9-btn",
    variant === "primary" && "mac9-btn-primary",
    className,
  ]);
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
