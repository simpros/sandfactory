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

<div class={["mac9-window", className]}>
  {#if title}
    <!-- Pinstripe title bar -->
    <div class="mac9-titlebar">
      <!-- Left: close box -->
      <button class="mac9-titlebar-btn" style="left: 6px;" type="button">
        <span style="font-size:7px; line-height:1;">✕</span>
      </button>
      <!-- Centre: title -->
      <span>{title}</span>
      <!-- Right: shade + zoom -->
      <div style="position:absolute; right:6px; display:flex; gap:3px;">
        <button
          class="mac9-titlebar-btn"
          style="position:static;"
          type="button"
        >
          <span style="font-size:7px; line-height:1;">+</span>
        </button>
        <button
          class="mac9-titlebar-btn"
          style="position:static;"
          type="button"
        >
          <span style="font-size:7px; line-height:1;">–</span>
        </button>
      </div>
    </div>
  {/if}
  <div class={["p-3", contentClass]}>
    {@render children()}
  </div>
</div>
