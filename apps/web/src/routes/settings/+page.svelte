<script lang="ts">
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
    { icon: "📁", label: "Projects", active: false, path: "/projects" },
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

<div class="flex h-[calc(100dvh-56px)] p-6">
  <div class="bg-mac-window border border-mac-border shadow-mac-window flex max-h-full w-full max-w-190 flex-col overflow-hidden">
      <div class="h-6 mac-pinstripe border-b border-mac-border flex items-center justify-center relative select-none shrink-0">
        <button class="absolute left-1.5 size-3.5 bg-mac-btn-face border border-mac-btn-border flex items-center justify-center text-[10px] leading-none active:bg-[#aaa]" type="button">
          <span class="text-[9px]">✕</span>
        </button>
        <span class="text-sm font-bold text-black leading-none">Sandfactory</span>
        <div class="absolute right-1.5 flex gap-[3px]">
          <button
            class="size-3.5 bg-mac-btn-face border border-mac-btn-border flex items-center justify-center text-[10px] leading-none active:bg-[#aaa]"
            type="button"
          >
            <span class="text-[9px]">+</span>
          </button>
          <button
            class="size-3.5 bg-mac-btn-face border border-mac-btn-border flex items-center justify-center text-[10px] leading-none active:bg-[#aaa]"
            type="button"
          >
            <span class="text-[9px]">–</span>
          </button>
        </div>
      </div>

      <div class="flex items-center h-6 bg-mac-surface border-b border-mac-border-dark px-1 select-none shadow-mac-menubar">
        <span class="px-2 h-full inline-flex items-center text-sm text-black rounded-sm hover:bg-mac-highlight hover:text-white">File</span>
        <span class="px-2 h-full inline-flex items-center text-sm text-black rounded-sm hover:bg-mac-highlight hover:text-white">Edit</span>
        <span class="px-2 h-full inline-flex items-center text-sm text-black rounded-sm hover:bg-mac-highlight hover:text-white">View</span>
        <span class="px-2 h-full inline-flex items-center text-sm text-black rounded-sm hover:bg-mac-highlight hover:text-white">Favorites</span>
        <span class="px-2 h-full inline-flex items-center text-sm text-black rounded-sm hover:bg-mac-highlight hover:text-white">Tools</span>
        <span class="px-2 h-full inline-flex items-center text-sm text-black rounded-sm hover:bg-mac-highlight hover:text-white">Help</span>
      </div>

      <div
        class="flex items-center gap-1 bg-mac-window px-2 py-1 border-b border-mac-border-light shadow-[inset_0_-1px_0_#fff]"
      >
        <button
          class="inline-flex items-center justify-center h-[22px] px-2 mac-btn-gradient border border-mac-border-dark rounded text-[13px] text-black cursor-default select-none whitespace-nowrap active:mac-btn-gradient-active"
          type="button">⬆ Back</button
        >
        <button
          class="inline-flex items-center justify-center h-[22px] px-2 mac-btn-gradient border border-mac-border-dark rounded text-[13px] text-black cursor-default select-none whitespace-nowrap active:mac-btn-gradient-active"
          type="button">🔄</button
        >
        <div
          class="w-px h-4 bg-mac-border-light shadow-[1px_0_0_#fff] mx-0.5"
        ></div>
        <div
          class="flex flex-1 items-center h-[22px] bg-white px-2 text-[13px] text-black border border-mac-border-light shadow-[inset_1px_1px_2px_rgba(0,0,0,0.08)]"
        >
          Sandfactory › Settings
        </div>
      </div>

      <div class="flex min-h-0 flex-1">
        <div
          class="flex w-40 shrink-0 flex-col bg-mac-surface border-r border-mac-border-light shadow-[inset_-1px_0_0_#fff]"
        >
          <p
            class="px-3 py-1.5 text-xs font-bold tracking-wide text-[#555] uppercase border-b border-[#ccc]"
          >
            Navigation
          </p>
          {#each navItems as item (item.label)}
            <a
              class={[
                "flex items-center gap-2 px-3 py-1.5 text-left text-sm",
                item.active
                  ? "bg-mac-highlight text-white"
                  : "bg-transparent text-black hover:bg-mac-highlight hover:text-white",
              ]}
              href={item.path ? resolve(item.path) : undefined}
              type="button"
            >
              <span class="text-base leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          {/each}
        </div>

        <div class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-white p-4">
          <div>
            <p class="mb-1 text-[15px] font-bold text-black">Settings</p>
            <hr class="border-none border-t border-mac-border-light shadow-[0_1px_0_#fff] mb-3">
            <p class="text-sm text-black">
              Manage Sandfactory server configuration and rotate the CLI API token.
            </p>
          </div>

          <fieldset class="border border-mac-border-light shadow-mac-etched pt-4 px-2.5 pb-2.5 mb-2.5 bg-mac-window">
            <legend class="px-1 text-[13px] font-bold text-black bg-mac-window">Server Settings</legend>
            <div
              class="grid gap-y-2"
              style="grid-template-columns: 120px 1fr;"
            >
              <span class="text-sm font-bold text-[#333]"
                >Base URL:</span
              >
              <span
                class="bg-white px-1.5 py-0.5 text-sm break-all text-black border border-[#ccc]"
              >
                {data.settings?.baseUrl ?? "—"}
              </span>
              <span class="text-sm font-bold text-[#333]"
                >Repo Root:</span
              >
              <span
                class="bg-white px-1.5 py-0.5 text-sm break-all text-black border border-[#ccc]"
              >
                {data.settings?.repoRoot ?? "—"}
              </span>
            </div>
          </fieldset>

          <fieldset class="border border-mac-border-light shadow-mac-etched pt-4 px-2.5 pb-2.5 bg-mac-window">
            <legend class="px-1 text-[13px] font-bold text-black bg-mac-window">API Token</legend>
            <div class="space-y-3 text-sm text-black">
              <p>
                Use this token for CLI requests from automation. Regenerating it invalidates the previous token immediately.
              </p>

              <div class="flex items-center gap-2">
                <button
                  class="inline-flex items-center justify-center min-w-20 h-7 px-4 mac-btn-gradient border-2 border-[#222] rounded-[5px] text-sm font-bold text-black cursor-default select-none whitespace-nowrap active:enabled:mac-btn-primary-gradient-active disabled:text-mac-border-dark"
                  disabled={isRegenerating}
                  onclick={rotateApiToken}
                  type="button"
                >
                  {isRegenerating ? "Regenerating…" : "Regenerate API Token"}
                </button>
              </div>

              {#if errorMessage}
                <div
                  class="px-3 py-2 text-[13px] text-red-700 bg-[#fff0f0] border border-[#c44]"
                >
                  ⚠ {errorMessage}
                </div>
              {/if}

              {#if apiToken}
                <div>
                  <p class="mb-1 text-sm font-bold text-black">Replacement API Token</p>
                  <div
                    class="mb-3 w-full bg-white px-2 py-2 border border-mac-border-light shadow-[inset_1px_1px_3px_rgba(0,0,0,0.12)]"
                  >
                    <code class="break-all text-[13px] text-black font-mono select-text cursor-text">
                      {apiToken}
                    </code>
                  </div>

                  <div
                    class="flex gap-2 px-3 py-2 text-[13px] text-black bg-[#ffc] border border-[#ca0]"
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

      <div class="flex items-center gap-1.5 h-[22px] px-1.5 bg-mac-surface border-t border-mac-border-light shadow-mac-statusbar text-[13px] text-black">
        <span class="flex-1 text-[13px] text-[#333]">Ready</span>
        <span class="text-[13px] text-[#333]">1 item</span>
        <div class="ml-2 w-[15px] h-[15px] mac-resize-pattern"></div>
      </div>
  </div>
</div>
