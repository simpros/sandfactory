<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { saveSetup } from "./setup.remote";

  const setupForm = saveSetup;
  let apiToken = $state("");
  let wizardStep = $state<"introduction" | "configuration" | "complete">("introduction");

  const baseUrlField = setupForm.fields.baseUrl.as("text");
  const loginPasswordField = setupForm.fields.loginPassword.as("password");
  const repoRootField = setupForm.fields.repoRoot.as("text");

  function issueFor(name: "baseUrl" | "loginPassword" | "repoRoot") {
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
      wizardStep = "complete";
    }
  });

  function continueToConfiguration() {
    wizardStep = "configuration";
  }

  async function continueToDashboard() {
    await goto(resolve("/login"));
  }

  const steps = ["Introduction", "Configuration", "Complete"];
  const currentStep = $derived(
    wizardStep === "introduction" ? 0 : wizardStep === "configuration" ? 1 : 2,
  );
</script>

<svelte:head>
  <title>Setup | Sandfactory</title>
</svelte:head>

<div class="flex min-h-[calc(100vh-24px)] items-center justify-center p-8">
  <!-- Setup assistant window -->
  <div class="bg-mac-window border border-mac-border shadow-mac-window w-full max-w-[520px]">

      <!-- Pinstripe title bar -->
      <div class="h-6 mac-pinstripe border-b border-mac-border flex items-center justify-center relative select-none shrink-0">
        <button class="absolute left-1.5 size-3.5 bg-mac-btn-face border border-mac-btn-border flex items-center justify-center text-[10px] leading-none active:bg-[#aaa]" type="button">
          <span class="text-[9px]">✕</span>
        </button>
        <span class="text-sm font-bold text-black leading-none">Sandfactory Setup Assistant</span>
        <div class="absolute right-1.5 flex gap-[3px]">
          <button class="size-3.5 bg-mac-btn-face border border-mac-btn-border flex items-center justify-center text-[10px] leading-none active:bg-[#aaa]" type="button">
            <span class="text-[9px]">+</span>
          </button>
          <button class="size-3.5 bg-mac-btn-face border border-mac-btn-border flex items-center justify-center text-[10px] leading-none active:bg-[#aaa]" type="button">
            <span class="text-[9px]">–</span>
          </button>
        </div>
      </div>

      <!-- Two-panel body -->
      <form id="sf-setup" {...enhancedSetupForm}>
        <div class="flex min-h-[360px]">

          <!-- Left: Platinum sidebar with steps -->
          <div
            class="flex w-[160px] shrink-0 flex-col justify-between bg-mac-sidebar border-r border-mac-border-light shadow-[inset_-1px_0_0_#fff] p-3"
          >
            <!-- Logo area -->
            <div>
              <div
                class="mb-3 flex h-16 w-16 items-center justify-center bg-gradient-to-br from-[#6688cc] to-[#3355aa] border border-mac-border-light"
              >
                <span class="text-[30px] leading-none">🏭</span>
              </div>
              <p class="text-[15px] font-bold leading-tight text-black">Sandfactory</p>
              <p class="text-xs text-[#555]">v0.1.0</p>
            </div>

            <!-- Step list -->
            <div class="mb-2">
              <hr class="border-none border-t border-mac-border-light shadow-[0_1px_0_#fff] mb-2.5">
              {#each steps as step, i (step)}
                <div
                  class={[
                    "flex items-center gap-2 py-1 text-[13px]",
                    i === currentStep ? "font-bold text-black" : "text-mac-muted",
                  ]}
                >
                  {#if i < currentStep}
                    <span class="text-[#383] text-xs">✔</span>
                  {:else if i === currentStep}
                    <span class="text-mac-highlight text-xs">▶</span>
                  {:else}
                    <span class="text-mac-border-light text-xs">○</span>
                  {/if}
                  <span>{step}</span>
                </div>
              {/each}
            </div>
          </div>

          <!-- Right: white content area -->
          <div class="flex flex-1 flex-col bg-white p-5">
            {#if wizardStep === "complete"}
              <!-- Success state -->
              <h2 class="mb-1 text-base font-bold text-black">Setup Complete</h2>
              <hr class="border-none border-t border-mac-border-light shadow-[0_1px_0_#fff] mb-3">
              <p class="mb-4 text-sm leading-relaxed text-black">
                Sandfactory has been configured successfully. Your API token has been generated.
                <strong>This is the only time the raw value will be shown.</strong>
              </p>

              <p class="mb-1 text-sm font-bold text-black">API Token</p>
              <div
                class="mb-4 w-full bg-white px-2 py-2 border border-mac-border-light shadow-[inset_1px_1px_3px_rgba(0,0,0,0.12)]"
              >
                <code class="break-all text-[13px] text-black font-mono select-text cursor-text">
                  {apiToken}
                </code>
              </div>

              <!-- Yellow warning note -->
              <div
                class="flex gap-2 px-3 py-2 text-[13px] text-black bg-[#ffc] border border-[#ca0]"
              >
                <span>⚠</span>
                <span>Copy this token to GitHub Actions → Settings → Secrets. It cannot be retrieved again.</span>
              </div>
            {:else if wizardStep === "configuration"}
              <!-- Form state -->
              <h2 class="mb-1 text-base font-bold text-black">Server Configuration</h2>
              <hr class="border-none border-t border-mac-border-light shadow-[0_1px_0_#fff] mb-3">
              <p class="mb-5 text-sm leading-relaxed text-black">
                Enter the public URL of this server and the path where remote repositories
                will be cloned. These settings are required before your first agent run.
              </p>

              <div class="flex flex-col gap-4">
                <div>
                  <label class="mb-1 block text-sm font-bold text-black" for="base-url">
                    Base URL:
                  </label>
                  <input
                    id="base-url"
                    bind:value={baseUrlField.value}
                    class="h-7 w-full px-2 bg-white border border-mac-border-dark text-sm text-black outline-none rounded-none focus:border-mac-highlight focus:shadow-mac-focus"
                    name={baseUrlField.name}
                    placeholder="https://sandfactory.example.com"
                    type="url"
                  />
                  {#if issueFor("baseUrl")}
                    <p class="mt-1 text-[13px] text-red-700">⚠ {issueFor("baseUrl")}</p>
                  {/if}
                </div>

                <div>
                  <label class="mb-1 block text-sm font-bold text-black" for="login-password">
                    Login Password:
                  </label>
                  <input
                    id="login-password"
                    bind:value={loginPasswordField.value}
                    class="h-7 w-full px-2 bg-white border border-mac-border-dark text-sm text-black outline-none rounded-none focus:border-mac-highlight focus:shadow-mac-focus"
                    name={loginPasswordField.name}
                    placeholder="Choose a password"
                    type="password"
                  />
                  {#if issueFor("loginPassword")}
                    <p class="mt-1 text-[13px] text-red-700">⚠ {issueFor("loginPassword")}</p>
                  {/if}
                </div>

                <div>
                  <label class="mb-1 block text-sm font-bold text-black" for="repo-root">
                    Repository Root:
                  </label>
                  <input
                    id="repo-root"
                    bind:value={repoRootField.value}
                    class="h-7 w-full px-2 bg-white border border-mac-border-dark text-sm text-black outline-none rounded-none focus:border-mac-highlight focus:shadow-mac-focus"
                    name={repoRootField.name}
                    placeholder="/srv/projects"
                    type="text"
                  />
                  {#if issueFor("repoRoot")}
                    <p class="mt-1 text-[13px] text-red-700">⚠ {issueFor("repoRoot")}</p>
                  {/if}
                </div>

                {#if formIssue()}
                  <div
                    class="px-3 py-2 text-[13px] text-red-700 bg-[#fff0f0] border border-[#c44]"
                  >
                    ⚠ {formIssue()}
                  </div>
                {/if}
              </div>
            {:else}
              <h2 class="mb-1 text-base font-bold text-black">Welcome to Sandfactory</h2>
              <hr class="border-none border-t border-mac-border-light shadow-[0_1px_0_#fff] mb-3">
              <div class="space-y-3 text-sm leading-relaxed text-black">
                <p>
                  This assistant will configure the Sandfactory dev-server for a single-user MVP.
                </p>
                <p>
                  In the next step you will set the public base URL, choose the repo root where
                  Projects are cloned, and create the password that protects the Sandfactory UI.
                </p>
                <div
                  class="px-3 py-2 bg-[#f3f3f3] border border-[#ccc]"
                >
                  The setup flow will also generate the CLI API token once. Save it before you
                  finish because the raw value will not be shown again.
                </div>
              </div>
            {/if}
          </div>
        </div>

        <!-- Full-width button strip -->
        <div
          class="flex items-center justify-between px-4 py-2 bg-mac-window border-t border-mac-border-light shadow-[inset_0_1px_0_#fff]"
        >
          <span class="text-[13px] text-mac-muted">
            Step {currentStep + 1} of {steps.length}
          </span>
          <div class="flex gap-2">
            {#if wizardStep === "complete"}
              <button
                class="inline-flex items-center justify-center min-w-20 h-7 px-4 mac-btn-gradient border-2 border-[#222] rounded-[5px] text-sm font-bold text-black cursor-default select-none whitespace-nowrap active:enabled:mac-btn-primary-gradient-active"
                onclick={continueToDashboard}
                type="button"
              >
                Finish
              </button>
            {:else if wizardStep === "introduction"}
              <button class="inline-flex items-center justify-center min-w-20 h-7 px-4 mac-btn-gradient border border-mac-border-dark rounded text-sm text-black cursor-default select-none whitespace-nowrap active:mac-btn-gradient-active" type="button">Cancel</button>
              <button
                class="inline-flex items-center justify-center min-w-20 h-7 px-4 mac-btn-gradient border-2 border-[#222] rounded-[5px] text-sm font-bold text-black cursor-default select-none whitespace-nowrap active:enabled:mac-btn-primary-gradient-active"
                onclick={continueToConfiguration}
                type="button"
              >
                Continue →
              </button>
            {:else}
              <button class="inline-flex items-center justify-center min-w-20 h-7 px-4 mac-btn-gradient border border-mac-border-dark rounded text-sm text-black cursor-default select-none whitespace-nowrap active:mac-btn-gradient-active" type="button">Cancel</button>
              <button
                class="inline-flex items-center justify-center min-w-20 h-7 px-4 mac-btn-gradient border-2 border-[#222] rounded-[5px] text-sm font-bold text-black cursor-default select-none whitespace-nowrap active:enabled:mac-btn-primary-gradient-active disabled:text-mac-border-dark"
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
