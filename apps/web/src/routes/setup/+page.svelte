<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { PageFrame } from "@sandfactory/ui";
  import { saveSetup } from "./setup.remote";

  const setupForm = saveSetup;
  let apiToken = $state("");

  const baseUrlField = setupForm.fields.baseUrl.as("text");
  const repoRootField = setupForm.fields.repoRoot.as("text");

  function issueFor(name: "baseUrl" | "repoRoot") {
    const message = setupForm.fields[name].issues()?.[0]?.message;
    return typeof message === "string" ? message : message ? String(message) : undefined;
  }

  function formIssue() {
    const message = setupForm.fields.allIssues()?.find((issue) => issue.path?.length === 0)?.message;
    return typeof message === "string" ? message : message ? String(message) : undefined;
  }

  const enhancedSetupForm: ReturnType<typeof setupForm.enhance> = setupForm.enhance(async ({ submit }) => {
    const success = await submit();
    if (success && setupForm.result?.apiToken) {
      apiToken = setupForm.result.apiToken;
    }
  });

  async function continueToDashboard() {
    await goto(resolve("/"));
  }

  const steps = ["Introduction", "Configuration", "Complete"];
  const currentStep = $derived(apiToken ? 2 : 1);
</script>

<svelte:head>
  <title>Setup | Sandfactory</title>
</svelte:head>

<PageFrame>
  <div class="flex min-h-[calc(100vh-20px)] items-center justify-center p-8">
    <!-- Setup assistant window -->
    <div class="mac9-window w-full max-w-[520px]">

      <!-- Pinstripe title bar -->
      <div class="mac9-titlebar">
        <button class="mac9-titlebar-btn" style="left: 6px;" type="button">
          <span style="font-size:7px;">✕</span>
        </button>
        <span>Sandfactory Setup Assistant</span>
        <div style="position:absolute; right:6px; display:flex; gap:3px;">
          <button class="mac9-titlebar-btn" style="position:static;" type="button">
            <span style="font-size:7px;">+</span>
          </button>
          <button class="mac9-titlebar-btn" style="position:static;" type="button">
            <span style="font-size:7px;">–</span>
          </button>
        </div>
      </div>

      <!-- Two-panel body -->
      <form id="sf-setup" {...enhancedSetupForm}>
        <div class="flex" style="min-height: 360px;">

          <!-- Left: Platinum sidebar with steps -->
          <div
            class="flex w-[152px] shrink-0 flex-col justify-between"
            style="background: #c8c8c8; border-right: 1px solid #aaaaaa; box-shadow: inset -1px 0 0 #ffffff; padding: 16px 12px;"
          >
            <!-- Logo area -->
            <div>
              <div
                class="mb-3 flex h-16 w-16 items-center justify-center"
                style="background: linear-gradient(135deg, #6688cc 0%, #3355aa 100%); border: 1px solid #aaaaaa;"
              >
                <span style="font-size: 30px; line-height: 1;">🏭</span>
              </div>
              <p class="text-[13px] font-bold leading-tight text-black">Sandfactory</p>
              <p class="text-[10px] text-[#555]">v0.1.0</p>
            </div>

            <!-- Step list -->
            <div style="margin-bottom: 8px;">
              <hr class="mac9-hr" style="margin-bottom: 10px;">
              {#each steps as step, i (step)}
                <div
                  class="flex items-center gap-2 py-1 text-[11px]"
                  style={i === currentStep ? "font-weight: bold; color: #000;" : "color: #666;"}
                >
                  {#if i < currentStep}
                    <span style="color: #338833; font-size: 10px;">✔</span>
                  {:else if i === currentStep}
                    <span style="color: #2255cc; font-size: 10px;">▶</span>
                  {:else}
                    <span style="color: #aaaaaa; font-size: 10px;">○</span>
                  {/if}
                  <span>{step}</span>
                </div>
              {/each}
            </div>
          </div>

          <!-- Right: white content area -->
          <div class="flex flex-1 flex-col bg-white p-5">
            {#if apiToken}
              <!-- Success state -->
              <h2 class="mb-1 text-[14px] font-bold text-black">Setup Complete</h2>
              <hr class="mac9-hr mb-3">
              <p class="mb-4 text-[12px] leading-relaxed text-black">
                Sandfactory has been configured successfully. Your API token has been generated.
                <strong>This is the only time the raw value will be shown.</strong>
              </p>

              <p class="mb-1 text-[12px] font-bold text-black">API Token</p>
              <div
                class="mb-4 w-full bg-white px-2 py-2"
                style="border: 1px solid #aaaaaa; box-shadow: inset 1px 1px 3px rgba(0,0,0,0.12);"
              >
                <code class="break-all text-[11px] text-black" style="font-family: Monaco, 'Courier New', monospace; user-select: text; cursor: text;">
                  {apiToken}
                </code>
              </div>

              <!-- Yellow warning note -->
              <div
                class="flex gap-2 px-3 py-2 text-[11px] text-black"
                style="background: #ffffcc; border: 1px solid #ccaa00;"
              >
                <span>⚠</span>
                <span>Copy this token to GitHub Actions → Settings → Secrets. It cannot be retrieved again.</span>
              </div>
            {:else}
              <!-- Form state -->
              <h2 class="mb-1 text-[14px] font-bold text-black">Server Configuration</h2>
              <hr class="mac9-hr mb-3">
              <p class="mb-5 text-[12px] leading-relaxed text-black">
                Enter the public URL of this server and the path where remote repositories
                will be cloned. These settings are required before your first agent run.
              </p>

              <div class="flex flex-col gap-4">
                <div>
                  <label class="mb-1 block text-[12px] font-bold text-black" for="base-url">
                    Base URL:
                  </label>
                  <input
                    id="base-url"
                    bind:value={baseUrlField.value}
                    class="mac9-field w-full"
                    name={baseUrlField.name}
                    placeholder="https://sandfactory.example.com"
                    type="url"
                  />
                  {#if issueFor("baseUrl")}
                    <p class="mt-1 text-[11px] text-red-700">⚠ {issueFor("baseUrl")}</p>
                  {/if}
                </div>

                <div>
                  <label class="mb-1 block text-[12px] font-bold text-black" for="repo-root">
                    Repository Root:
                  </label>
                  <input
                    id="repo-root"
                    bind:value={repoRootField.value}
                    class="mac9-field w-full"
                    name={repoRootField.name}
                    placeholder="/srv/projects"
                    type="text"
                  />
                  {#if issueFor("repoRoot")}
                    <p class="mt-1 text-[11px] text-red-700">⚠ {issueFor("repoRoot")}</p>
                  {/if}
                </div>

                {#if formIssue()}
                  <div
                    class="px-3 py-2 text-[11px] text-red-700"
                    style="background: #fff0f0; border: 1px solid #cc4444;"
                  >
                    ⚠ {formIssue()}
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        </div>

        <!-- Full-width button strip -->
        <div
          class="flex items-center justify-between px-4 py-2"
          style="background: #ececec; border-top: 1px solid #aaaaaa; box-shadow: inset 0 1px 0 #ffffff;"
        >
          <span class="text-[11px] text-[#666]">
            Step {currentStep + 1} of {steps.length}
          </span>
          <div class="flex gap-2">
            {#if apiToken}
              <button
                class="mac9-btn mac9-btn-primary"
                onclick={continueToDashboard}
                type="button"
              >
                Finish
              </button>
            {:else}
              <button class="mac9-btn" type="button">Cancel</button>
              <button
                class="mac9-btn mac9-btn-primary"
                disabled={setupForm.pending > 0}
                type="submit"
              >
                {setupForm.pending > 0 ? "Saving…" : "Continue →"}
              </button>
            {/if}
          </div>
        </div>
      </form>
    </div>
  </div>
</PageFrame>
