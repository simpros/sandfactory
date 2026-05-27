<script lang="ts">
  import { resolve } from "$app/paths";

  let { data } = $props();

  const navItems = [
    { icon: "🏠", label: "Dashboard", active: true, path: "/" },
    { icon: "📁", label: "Projects", active: false, path: null },
    {
      icon: "⚙",
      label: "Settings",
      active: false,
      path: "/settings",
    },
    { icon: "🗝", label: "API Tokens", active: false, path: null },
  ] as const;
</script>

<svelte:head>
  <title>Sandfactory</title>
</svelte:head>

<div class="p-6">
  <!-- Main Finder-style application window -->
  <div
    class="bg-mac-window border-mac-border shadow-mac-window inline-block w-full max-w-170 border"
  >
    <!-- Pinstripe title bar -->
    <div
      class="mac-pinstripe border-mac-border relative flex h-6 shrink-0 items-center justify-center border-b select-none"
    >
      <button
        class="bg-mac-btn-face border-mac-btn-border absolute left-1.5 flex size-3.5 items-center justify-center border text-[10px] leading-none active:bg-[#aaa]"
        type="button"
      >
        <span class="text-[9px]">✕</span>
      </button>
      <span class="text-sm leading-none font-bold text-black"
        >Sandfactory</span
      >
      <div class="absolute right-1.5 flex gap-[3px]">
        <button
          class="bg-mac-btn-face border-mac-btn-border flex size-3.5 items-center justify-center border text-[10px] leading-none active:bg-[#aaa]"
          type="button"
        >
          <span class="text-[9px]">+</span>
        </button>
        <button
          class="bg-mac-btn-face border-mac-btn-border flex size-3.5 items-center justify-center border text-[10px] leading-none active:bg-[#aaa]"
          type="button"
        >
          <span class="text-[9px]">–</span>
        </button>
      </div>
    </div>

    <!-- Menu bar inside window (Finder-style) -->
    <div
      class="bg-mac-surface border-mac-border-dark shadow-mac-menubar flex h-6 items-center border-b px-1 select-none"
    >
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
        >Favorites</span
      >
      <span
        class="hover:bg-mac-highlight inline-flex h-full items-center rounded-sm px-2 text-sm text-black hover:text-white"
        >Tools</span
      >
      <span
        class="hover:bg-mac-highlight inline-flex h-full items-center rounded-sm px-2 text-sm text-black hover:text-white"
        >Help</span
      >
    </div>

    <!-- Toolbar row -->
    <div
      class="bg-mac-window border-mac-border-light flex items-center gap-1 border-b px-2 py-1 shadow-[inset_0_-1px_0_#fff]"
    >
      <button
        class="mac-btn-gradient border-mac-border-dark active:mac-btn-gradient-active inline-flex h-[22px] cursor-default items-center justify-center rounded border px-2 text-[13px] whitespace-nowrap text-black select-none"
        type="button">⬆ Back</button
      >
      <button
        class="mac-btn-gradient border-mac-border-dark active:mac-btn-gradient-active inline-flex h-[22px] cursor-default items-center justify-center rounded border px-2 text-[13px] whitespace-nowrap text-black select-none"
        type="button">🔄</button
      >
      <div
        class="bg-mac-border-light mx-0.5 h-4 w-px shadow-[1px_0_0_#fff]"
      ></div>
      <!-- Address field -->
      <div
        class="border-mac-border-light flex h-[22px] flex-1 items-center border bg-white px-2 text-[13px] text-black shadow-[inset_1px_1px_2px_rgba(0,0,0,0.08)]"
      >
        Sandfactory › Dashboard
      </div>
    </div>

    <!-- Two-panel content -->
    <div class="flex min-h-[340px]">
      <!-- Left sidebar: navigation -->
      <div
        class="bg-mac-surface border-mac-border-light flex w-40 shrink-0 flex-col border-r shadow-[inset_-1px_0_0_#fff]"
      >
        <p
          class="border-b border-[#ccc] px-3 py-1.5 text-xs font-bold tracking-wide text-[#555] uppercase"
        >
          Navigation
        </p>
        {#each navItems as item (item.label)}
          <a
            class={[
              "flex items-center gap-2 px-3 py-1.5 text-left text-sm",
              item.active
                ? "bg-mac-highlight text-white"
                : "hover:bg-mac-highlight bg-transparent text-black hover:text-white",
            ]}
            href={item.path ? resolve(item.path) : undefined}
            type="button"
          >
            <span class="text-base leading-none">{item.icon}</span>
            <span>{item.label}</span>
          </a>
        {/each}
      </div>

      <!-- Main content: white area -->
      <div class="flex flex-1 flex-col bg-white p-4">
        <p class="mb-1 text-[15px] font-bold text-black">
          System Information
        </p>
        <hr
          class="border-mac-border-light mb-3 border-t border-none shadow-[0_1px_0_#fff]"
        />

        <!-- Server Settings groupbox -->
        <fieldset
          class="border-mac-border-light shadow-mac-etched bg-mac-window mb-2.5 border px-2.5 pt-4 pb-2.5"
        >
          <legend
            class="bg-mac-window px-1 text-[13px] font-bold text-black"
            >Server Settings</legend
          >
          <div
            class="grid gap-y-2"
            style="grid-template-columns: 120px 1fr;"
          >
            <span class="text-sm font-bold text-[#333]">Base URL:</span>
            <span
              class="border border-[#ccc] bg-white px-1.5 py-0.5 text-sm break-all text-black"
            >
              {data.settings?.baseUrl ?? "—"}
            </span>
            <span class="text-sm font-bold text-[#333]">Repo Root:</span>
            <span
              class="border border-[#ccc] bg-white px-1.5 py-0.5 text-sm break-all text-black"
            >
              {data.settings?.repoRoot ?? "—"}
            </span>
          </div>
        </fieldset>

        <!-- Status groupbox -->
        <fieldset
          class="border-mac-border-light shadow-mac-etched bg-mac-window mb-2.5 border px-2.5 pt-4 pb-2.5"
        >
          <legend
            class="bg-mac-window px-1 text-[13px] font-bold text-black"
            >System Status</legend
          >
          <div class="space-y-1.5 text-sm">
            <div class="flex items-center gap-2">
              <span class="text-[#383]">●</span>
              <span class="text-black"
                >First-run configuration complete</span
              >
            </div>
            <div class="flex items-center gap-2">
              <span class="text-mac-border-light">○</span>
              <span class="text-mac-muted">No active agent runs</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-mac-border-light">○</span>
              <span class="text-mac-muted">No registered projects</span>
            </div>
          </div>
        </fieldset>

        <!-- Roadmap groupbox -->
        <fieldset
          class="border-mac-border-light shadow-mac-etched bg-mac-window border px-2.5 pt-4 pb-2.5"
        >
          <legend
            class="bg-mac-window px-1 text-[13px] font-bold text-black"
            >Planned Features</legend
          >
          <div class="space-y-1 text-sm">
            {#each ["Project registration", "Agent run queue", "Preview environment lifecycle", "Cleanup automation via GitHub Actions"] as feat (feat)}
              <div class="text-mac-muted flex items-center gap-2">
                <input class="m-0" disabled type="checkbox" />
                <span>{feat}</span>
              </div>
            {/each}
          </div>
        </fieldset>
      </div>
    </div>

    <!-- Resize handle + status bar -->
    <div
      class="bg-mac-surface border-mac-border-light shadow-mac-statusbar flex h-[22px] items-center gap-1.5 border-t px-1.5 text-[13px] text-black"
    >
      <span class="flex-1 text-[13px] text-[#333]">Ready</span>
      <span class="text-[13px] text-[#333]">1 item</span>
      <!-- Resize handle (decorative) -->
      <div class="mac-resize-pattern ml-2 h-[15px] w-[15px]"></div>
    </div>
  </div>
</div>
