<script lang="ts">
  import { PageFrame } from "@sandfactory/ui";

  let { data } = $props();

  const navItems = [
    { icon: "🏠", label: "Dashboard", active: true },
    { icon: "📁", label: "Projects", active: false },
    { icon: "⚙", label: "Settings", active: false },
    { icon: "🗝", label: "API Tokens", active: false },
  ];
</script>

<svelte:head>
  <title>Sandfactory</title>
</svelte:head>

<PageFrame>
  <div class="p-6">
    <!-- Main Finder-style application window -->
    <div class="mac9-window inline-block w-full max-w-[680px]">

      <!-- Pinstripe title bar -->
      <div class="mac9-titlebar">
        <button class="mac9-titlebar-btn" style="left: 6px;" type="button">
          <span style="font-size:7px;">✕</span>
        </button>
        <span>Sandfactory</span>
        <div style="position:absolute; right:6px; display:flex; gap:3px;">
          <button class="mac9-titlebar-btn" style="position:static;" type="button">
            <span style="font-size:7px;">+</span>
          </button>
          <button class="mac9-titlebar-btn" style="position:static;" type="button">
            <span style="font-size:7px;">–</span>
          </button>
        </div>
      </div>

      <!-- Menu bar inside window (Finder-style) -->
      <div class="mac9-menubar" style="border-top: none;">
        <span class="mac9-menu-item">File</span>
        <span class="mac9-menu-item">Edit</span>
        <span class="mac9-menu-item">View</span>
        <span class="mac9-menu-item">Favorites</span>
        <span class="mac9-menu-item">Tools</span>
        <span class="mac9-menu-item">Help</span>
        <!-- Apple mark on right like Finder -->
        <span class="ml-auto mac9-menu-item" style="font-size:14px;">🍎</span>
      </div>

      <!-- Toolbar row -->
      <div
        class="flex items-center gap-1 bg-[#ececec] px-2 py-1"
        style="border-bottom: 1px solid #aaaaaa; box-shadow: inset 0 -1px 0 #ffffff;"
      >
        <button class="mac9-btn" style="height:18px; font-size:11px; padding:0 8px; min-width:0;" type="button">⬆ Back</button>
        <button class="mac9-btn" style="height:18px; font-size:11px; padding:0 8px; min-width:0;" type="button">🔄</button>
        <div style="width:1px; height:16px; background:#aaaaaa; box-shadow: 1px 0 0 #ffffff; margin:0 2px;"></div>
        <!-- Address field -->
        <div
          class="flex flex-1 items-center bg-white px-2 text-[11px] text-black"
          style="height:18px; border:1px solid #aaaaaa; box-shadow: inset 1px 1px 2px rgba(0,0,0,0.08);"
        >
          Sandfactory › Dashboard
        </div>
      </div>

      <!-- Two-panel content -->
      <div class="flex" style="min-height: 340px;">

        <!-- Left sidebar: navigation -->
        <div
          class="flex w-[140px] shrink-0 flex-col"
          style="background: #dddddd; border-right: 1px solid #aaaaaa; box-shadow: inset -1px 0 0 #ffffff;"
        >
          <p
            class="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#555]"
            style="border-bottom: 1px solid #cccccc;"
          >
            Navigation
          </p>
          {#each navItems as item (item.label)}
            <button
              class={[
                "flex items-center gap-2 px-3 py-1.5 text-left text-[12px]",
                item.active
                  ? "bg-[#2255cc] text-white"
                  : "bg-transparent text-black hover:bg-[#2255cc] hover:text-white",
              ]}
              type="button"
            >
              <span class="text-sm leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          {/each}
        </div>

        <!-- Main content: white area -->
        <div class="flex flex-1 flex-col bg-white p-4">
          <p class="mb-1 text-[13px] font-bold text-black">System Information</p>
          <hr class="mac9-hr mb-3">

          <!-- Server Settings groupbox -->
          <fieldset class="mac9-group">
            <legend>Server Settings</legend>
            <div class="grid gap-y-2" style="grid-template-columns: 110px 1fr;">
              <span class="text-[12px] font-bold text-[#333]">Base URL:</span>
              <span
                class="break-all bg-white px-1.5 py-0.5 text-[12px] text-black"
                style="border: 1px solid #cccccc;"
              >
                {data.settings?.baseUrl ?? "—"}
              </span>
              <span class="text-[12px] font-bold text-[#333]">Repo Root:</span>
              <span
                class="break-all bg-white px-1.5 py-0.5 text-[12px] text-black"
                style="border: 1px solid #cccccc;"
              >
                {data.settings?.repoRoot ?? "—"}
              </span>
            </div>
          </fieldset>

          <!-- Status groupbox -->
          <fieldset class="mac9-group">
            <legend>System Status</legend>
            <div class="space-y-1.5 text-[12px]">
              <div class="flex items-center gap-2">
                <span style="color: #338833;">●</span>
                <span class="text-black">First-run configuration complete</span>
              </div>
              <div class="flex items-center gap-2">
                <span style="color: #aaaaaa;">○</span>
                <span class="text-[#666]">No active agent runs</span>
              </div>
              <div class="flex items-center gap-2">
                <span style="color: #aaaaaa;">○</span>
                <span class="text-[#666]">No registered projects</span>
              </div>
            </div>
          </fieldset>

          <!-- Roadmap groupbox -->
          <fieldset class="mac9-group" style="margin-bottom: 0;">
            <legend>Planned Features</legend>
            <div class="space-y-1 text-[12px]">
              {#each ["Project registration", "Agent run queue", "Preview environment lifecycle", "Cleanup automation via GitHub Actions"] as feat (feat)}
                <div class="flex items-center gap-2 text-[#666]">
                  <input class="m-0" disabled type="checkbox" />
                  <span>{feat}</span>
                </div>
              {/each}
            </div>
          </fieldset>
        </div>
      </div>

      <!-- Resize handle + status bar -->
      <div class="mac9-statusbar">
        <span style="flex:1; font-size:11px; color:#333;">Ready</span>
        <span style="font-size:11px; color:#333;">1 item</span>
        <!-- Resize handle (decorative) -->
        <div
          class="ml-2"
          style="width:15px; height:15px; background: repeating-linear-gradient(135deg, #aaaaaa 0px, #aaaaaa 1px, #dddddd 1px, #dddddd 3px);"
        ></div>
      </div>
    </div>
  </div>
</PageFrame>
