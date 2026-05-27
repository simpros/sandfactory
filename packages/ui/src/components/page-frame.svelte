<script lang="ts">
  import type { Snippet } from "svelte";

  let sandfactoryMenuOpen = $state(false);

  let {
    children,
    class: className = "",
    showLogout = false,
    onLogout = undefined,
  }: {
    children: Snippet;
    class?: string;
    showLogout?: boolean;
    onLogout?: (() => void | Promise<void>) | undefined;
  } = $props();
</script>

<!-- Mac OS 9 blue desktop + global menu bar -->
<div
  class={[
    "from-mac-desktop-from via-mac-desktop-via to-mac-desktop-to relative min-h-screen bg-gradient-to-br pb-0",
    className,
  ]}
>
  <!-- Global menu bar (Mac-style, always at top) -->
  <div
    class="bg-mac-surface border-mac-border-dark shadow-mac-menubar sticky top-0 z-50 flex h-6 items-center justify-between gap-4 border-b px-1 select-none"
  >
    <div class="flex items-center">
      <div class="relative">
        <button
          aria-haspopup={showLogout ? "menu" : undefined}
          aria-expanded={showLogout ? sandfactoryMenuOpen : undefined}
          class={[
            "hover:bg-mac-highlight inline-flex h-6 items-center rounded-sm px-2 text-sm font-bold text-black hover:text-white",
            showLogout && sandfactoryMenuOpen
              ? "bg-mac-highlight text-white"
              : "",
          ]}
          onclick={() => {
            if (!showLogout) {
              return;
            }

            sandfactoryMenuOpen = !sandfactoryMenuOpen;
          }}
          type="button"
        >
          Sandfactory
        </button>
        {#if showLogout && sandfactoryMenuOpen}
          <div
            class="bg-mac-surface border-mac-border-dark shadow-mac-dropdown absolute top-full left-0 z-80 min-w-[120px] border p-0.5 whitespace-nowrap"
          >
            <button
              class="hover:bg-mac-highlight focus-visible:bg-mac-highlight block w-full border-none bg-transparent py-1 pr-5 pl-3 text-left text-sm text-black hover:text-white focus-visible:text-white focus-visible:outline-none"
              onclick={async () => {
                sandfactoryMenuOpen = false;
                await onLogout?.();
              }}
              type="button"
            >
              Log Out
            </button>
          </div>
        {/if}
      </div>
      <span
        class="hover:bg-mac-highlight inline-flex h-full items-center rounded-sm px-2 text-sm text-black hover:text-white"
        >File</span
      >
      <span
        class="hover:bg-mac-highlight inline-flex h-full items-center rounded-sm px-2 text-sm text-black hover:text-white"
        >Edit</span
      >
      <span
        class="hover:bg-mac-highlight inline-flex h-full items-center rounded-sm px-2 text-sm text-black hover:text-white"
        >View</span
      >
      <span
        class="hover:bg-mac-highlight inline-flex h-full items-center rounded-sm px-2 text-sm text-black hover:text-white"
        >Special</span
      >
      <span
        class="hover:bg-mac-highlight inline-flex h-full items-center rounded-sm px-2 text-sm text-black hover:text-white"
        >Help</span
      >
    </div>
    <div class="flex items-center gap-3">
      <span
        class="inline-flex h-full items-center rounded-sm px-2 text-[13px] text-black"
        id="mac-clock"
      >
        {new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        })}
      </span>
      <span
        class="inline-flex h-full items-center rounded-sm px-2 text-base text-black"
        >🔊</span
      >
    </div>
  </div>

  <!-- Desktop content -->
  <div class="relative pt-8">
    {@render children()}
  </div>
</div>
