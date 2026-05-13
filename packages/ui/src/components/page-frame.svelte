<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    children,
    class: className = "",
  }: {
    children: Snippet;
    class?: string;
  } = $props();
</script>

<!-- Mac OS 9 blue desktop + global menu bar -->
<div
  class={["relative min-h-screen pb-0", className]}
  style="background: linear-gradient(150deg, #6088bb 0%, #3a6ea5 30%, #2255a0 65%, #14348a 100%);"
>
  <!-- Global menu bar (Mac-style, always at top) -->
  <div class="mac9-menubar sticky top-0 z-50">
    <span class="mac9-menu-item mac9-menu-item-bold">Sandfactory</span>
    <span class="mac9-menu-item">File</span>
    <span class="mac9-menu-item">Edit</span>
    <span class="mac9-menu-item">View</span>
    <span class="mac9-menu-item">Special</span>
    <span class="mac9-menu-item">Help</span>
    <!-- Clock area -->
    <div class="ml-auto flex items-center gap-3">
      <span class="mac9-menu-item text-[11px]" id="mac9-clock">
        {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
      </span>
      <span class="mac9-menu-item" style="font-size:14px;">🔊</span>
    </div>
  </div>

  <!-- Desktop content -->
  <div class="relative">
    {@render children()}
  </div>
</div>
