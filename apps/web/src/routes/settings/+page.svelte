<script lang="ts">
  import { PageFrame } from "@sandfactory/ui";
  import { regenerateApiToken } from "../setup/setup.remote";
  import { resolve } from "$app/paths";

  let { data } = $props();

  let apiToken = $state("");
  let errorMessage = $state("");
  let isRegenerating = $state(false);

  const navItems = [
    {
      icon: "🏠",
      label: "Dashboard",
      active: false,
      path: "/",
    },
    { icon: "📁", label: "Projects", active: false, path: null },
    {
      icon: "⚙",
      label: "Settings",
      active: true,
      path: "/settings",
    },
    { icon: "🗝", label: "API Tokens", active: false, path: null },
  ] as const;

  async function rotateApiToken() {
    isRegenerating = true;
    errorMessage = "";

    try {
      const result = await regenerateApiToken();

      if (result?.apiToken) {
        apiToken = result.apiToken;
        return;
      }

      errorMessage = "Could not regenerate the API token.";
    } catch {
      errorMessage = "Could not regenerate the API token.";
    } finally {
      isRegenerating = false;
    }
  }
</script>

<svelte:head>
  <title>Settings | Sandfactory</title>
</svelte:head>

<PageFrame>
  <div class="p-6">
    <div class="mac9-window inline-block w-full max-w-190">
      <div class="mac9-titlebar">
        <button class="mac9-titlebar-btn" style="left: 6px;" type="button">
          <span style="font-size:7px;">✕</span>
        </button>
        <span>Sandfactory</span>
        <div style="position:absolute; right:6px; display:flex; gap:3px;">
          <button
            class="mac9-titlebar-btn"
            style="position:static;"
            type="button"
          >
            <span style="font-size:7px;">+</span>
          </button>
          <button
            class="mac9-titlebar-btn"
            style="position:static;"
            type="button"
          >
            <span style="font-size:7px;">–</span>
          </button>
        </div>
      </div>

      <div class="mac9-menubar" style="border-top: none;">
        <span class="mac9-menu-item">File</span>
        <span class="mac9-menu-item">Edit</span>
        <span class="mac9-menu-item">View</span>
        <span class="mac9-menu-item">Favorites</span>
        <span class="mac9-menu-item">Tools</span>
        <span class="mac9-menu-item">Help</span>
      </div>

      <div
        class="flex items-center gap-1 bg-[#ececec] px-2 py-1"
        style="border-bottom: 1px solid #aaaaaa; box-shadow: inset 0 -1px 0 #ffffff;"
      >
        <button
          class="mac9-btn"
          style="height:18px; font-size:11px; padding:0 8px; min-width:0;"
          type="button">⬆ Back</button
        >
        <button
          class="mac9-btn"
          style="height:18px; font-size:11px; padding:0 8px; min-width:0;"
          type="button">🔄</button
        >
        <div
          style="width:1px; height:16px; background:#aaaaaa; box-shadow: 1px 0 0 #ffffff; margin:0 2px;"
        ></div>
        <div
          class="flex flex-1 items-center bg-white px-2 text-[11px] text-black"
          style="height:18px; border:1px solid #aaaaaa; box-shadow: inset 1px 1px 2px rgba(0,0,0,0.08);"
        >
          Sandfactory › Settings
        </div>
      </div>

      <div class="flex" style="min-height: 340px;">
        <div
          class="flex w-35 shrink-0 flex-col"
          style="background: #dddddd; border-right: 1px solid #aaaaaa; box-shadow: inset -1px 0 0 #ffffff;"
        >
          <p
            class="px-3 py-1.5 text-[10px] font-bold tracking-wide text-[#555] uppercase"
            style="border-bottom: 1px solid #cccccc;"
          >
            Navigation
          </p>
          {#each navItems as item (item.label)}
            <a
              class={[
                "flex items-center gap-2 px-3 py-1.5 text-left text-[12px]",
                item.active
                  ? "bg-[#2255cc] text-white"
                  : "bg-transparent text-black hover:bg-[#2255cc] hover:text-white",
              ]}
              href={item.path ? resolve(item.path) : undefined}
              type="button"
            >
              <span class="text-sm leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          {/each}
        </div>

        <div class="flex flex-1 flex-col gap-3 bg-white p-4">
          <div>
            <p class="mb-1 text-[13px] font-bold text-black">Settings</p>
            <hr class="mac9-hr mb-3">
            <p class="text-[12px] text-black">
              Manage Sandfactory server configuration and rotate the CLI API token.
            </p>
          </div>

          <fieldset class="mac9-group">
            <legend>Server Settings</legend>
            <div
              class="grid gap-y-2"
              style="grid-template-columns: 110px 1fr;"
            >
              <span class="text-[12px] font-bold text-[#333]"
                >Base URL:</span
              >
              <span
                class="bg-white px-1.5 py-0.5 text-[12px] break-all text-black"
                style="border: 1px solid #cccccc;"
              >
                {data.settings?.baseUrl ?? "—"}
              </span>
              <span class="text-[12px] font-bold text-[#333]"
                >Repo Root:</span
              >
              <span
                class="bg-white px-1.5 py-0.5 text-[12px] break-all text-black"
                style="border: 1px solid #cccccc;"
              >
                {data.settings?.repoRoot ?? "—"}
              </span>
            </div>
          </fieldset>

          <fieldset class="mac9-group" style="margin-bottom: 0;">
            <legend>API Token</legend>
            <div class="space-y-3 text-[12px] text-black">
              <p>
                Use this token for CLI requests from automation. Regenerating it invalidates the previous token immediately.
              </p>

              <div class="flex items-center gap-2">
                <button
                  class="mac9-btn mac9-btn-primary"
                  disabled={isRegenerating}
                  onclick={rotateApiToken}
                  type="button"
                >
                  {isRegenerating ? "Regenerating…" : "Regenerate API Token"}
                </button>
              </div>

              {#if errorMessage}
                <div
                  class="px-3 py-2 text-[11px] text-red-700"
                  style="background: #fff0f0; border: 1px solid #cc4444;"
                >
                  ⚠ {errorMessage}
                </div>
              {/if}

              {#if apiToken}
                <div>
                  <p class="mb-1 text-[12px] font-bold text-black">Replacement API Token</p>
                  <div
                    class="mb-3 w-full bg-white px-2 py-2"
                    style="border: 1px solid #aaaaaa; box-shadow: inset 1px 1px 3px rgba(0,0,0,0.12);"
                  >
                    <code class="break-all text-[11px] text-black" style="font-family: Monaco, 'Courier New', monospace; user-select: text; cursor: text;">
                      {apiToken}
                    </code>
                  </div>

                  <div
                    class="flex gap-2 px-3 py-2 text-[11px] text-black"
                    style="background: #ffffcc; border: 1px solid #ccaa00;"
                  >
                    <span>⚠</span>
                    <span>This is the only time the raw value will be shown. Update your automation now.</span>
                  </div>
                </div>
              {/if}
            </div>
          </fieldset>
        </div>
      </div>

      <div class="mac9-statusbar">
        <span style="flex:1; font-size:11px; color:#333;">Ready</span>
        <span style="font-size:11px; color:#333;">1 item</span>
        <div
          class="ml-2"
          style="width:15px; height:15px; background: repeating-linear-gradient(135deg, #aaaaaa 0px, #aaaaaa 1px, #dddddd 1px, #dddddd 3px);"
        ></div>
      </div>
    </div>
  </div>
</PageFrame>
