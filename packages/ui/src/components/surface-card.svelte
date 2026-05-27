<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    children,
    title,
    class: className = "",
    contentClass = "",
    tone: _tone = "default",
  }: {
    children: Snippet;
    title?: string;
    class?: string;
    contentClass?: string;
    tone?: "default" | "strong" | "accent" | "success" | "danger";
  } = $props();
</script>

<div class={["bg-mac-window border border-mac-border shadow-mac-window", className]}>
  {#if title}
    <!-- Pinstripe title bar -->
    <div class="h-6 mac-pinstripe border-b border-mac-border flex items-center justify-center relative select-none shrink-0">
      <!-- Left: close box -->
      <button class="absolute left-1.5 size-3.5 bg-mac-btn-face border border-mac-btn-border flex items-center justify-center text-[10px] leading-none active:bg-[#aaa]" type="button">
        <span class="text-[9px] leading-none">✕</span>
      </button>
      <!-- Centre: title -->
      <span class="text-sm font-bold text-black leading-none">{title}</span>
      <!-- Right: shade + zoom -->
      <div class="absolute right-1.5 flex gap-[3px]">
        <button
          class="size-3.5 bg-mac-btn-face border border-mac-btn-border flex items-center justify-center text-[10px] leading-none active:bg-[#aaa]"
          type="button"
        >
          <span class="text-[9px] leading-none">+</span>
        </button>
        <button
          class="size-3.5 bg-mac-btn-face border border-mac-btn-border flex items-center justify-center text-[10px] leading-none active:bg-[#aaa]"
          type="button"
        >
          <span class="text-[9px] leading-none">–</span>
        </button>
      </div>
    </div>
  {/if}
  <div class={["p-3", contentClass]}>
    {@render children()}
  </div>
</div>
