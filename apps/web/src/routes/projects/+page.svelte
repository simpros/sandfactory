<script lang="ts">
  import { resolve } from "$app/paths";
  import {
    listRegisteredProjects,
    registerRemoteProject,
  } from "../projects.remote";

  const projectsQuery = listRegisteredProjects();
  const registerForm = registerRemoteProject;

  const remoteUrlField = registerForm.fields.remoteUrl.as("text");

  let formError = $state<string | null>(null);
  let conflict = $state<{
    reason: "directory-exists" | "already-registered";
    name: string;
    localPath: string;
    remoteUrl: string;
  } | null>(null);

  function fieldIssue() {
    const message = registerForm.fields.remoteUrl.issues()?.[0]?.message;
    return typeof message === "string"
      ? message
      : message
        ? String(message)
        : undefined;
  }

  const enhancedRegisterForm: ReturnType<typeof registerForm.enhance> =
    registerForm.enhance(async ({ submit, form }) => {
      formError = null;
      const success = await submit();
      if (!success) return;
      const result = registerForm.result as
        | { ok: true; project: unknown }
        | { ok: false; conflict: false; error: string }
        | {
            ok: false;
            conflict: true;
            reason: "directory-exists" | "already-registered";
            name: string;
            localPath: string;
            remoteUrl: string;
          }
        | undefined;
      if (result && result.ok === false) {
        if (result.conflict) {
          conflict = {
            reason: result.reason,
            name: result.name,
            localPath: result.localPath,
            remoteUrl: result.remoteUrl,
          };
          return;
        }
        formError = result.error;
        return;
      }
      conflict = null;
      form.reset();
    });

  function cancelConflict() {
    conflict = null;
    formError = null;
  }

  const navItems = [
    { icon: "🏠", label: "Dashboard", active: false, path: "/" },
    { icon: "📁", label: "Projects", active: true, path: "/projects" },
    {
      icon: "⚙",
      label: "Settings",
      active: false,
      path: "/settings",
    },
    { icon: "🗝", label: "API Tokens", active: false, path: null },
  ];
</script>

<svelte:head>
  <title>Projects | Sandfactory</title>
</svelte:head>

<div class="p-6">
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
      <span class="text-sm leading-none font-bold text-black">Sandfactory</span>
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
        Sandfactory › Projects
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
            href={item.path ? resolve(item.path as Parameters<typeof resolve>[0]) : undefined}
            type="button"
          >
            <span class="text-base leading-none">{item.icon}</span>
            <span>{item.label}</span>
          </a>
        {/each}
      </div>

      <!-- Main content: white area -->
      <div class="flex flex-1 flex-col bg-white p-4">
        <p class="mb-1 text-[15px] font-bold text-black">Projects</p>
        <hr
          class="border-mac-border-light mb-3 border-t border-none shadow-[0_1px_0_#fff]"
        />

        <!-- Register project fieldset -->
        <fieldset
          class="border-mac-border-light shadow-mac-etched bg-mac-window mb-2.5 border px-2.5 pt-4 pb-2.5"
        >
          <legend class="bg-mac-window px-1 text-[13px] font-bold text-black"
            >Register Project</legend
          >

          <form
            id="sf-register-project"
            class="flex flex-col gap-2"
            {...enhancedRegisterForm}
          >
            {#if conflict}
              <input
                name="remoteUrl"
                type="hidden"
                value={conflict.remoteUrl}
              />
              <input name="overwrite" type="hidden" value="true" />
              <div
                class="border border-[#c80] bg-[#fff8e0] px-2 py-1.5 text-[13px] text-black"
                data-testid="register-conflict"
              >
                <p class="mb-1 font-bold">
                  ⚠ A project named <span class="font-mono"
                    >{conflict.name}</span
                  > is already present.
                </p>
                <p class="text-mac-muted mb-2 text-[12px]">
                  {conflict.reason === "already-registered"
                    ? "It is already registered in Sandfactory."
                    : `A directory exists at ${conflict.localPath}.`}
                </p>
                <p class="mb-2">
                  Overwrite it with a fresh clone from <span
                    class="font-mono">{conflict.remoteUrl}</span
                  >?
                </p>
                <div class="flex gap-2">
                  <button
                    class="mac-btn-gradient border-mac-border-dark active:mac-btn-gradient-active inline-flex h-7 cursor-default items-center justify-center rounded border px-3 text-sm font-bold whitespace-nowrap text-black select-none disabled:text-[#999]"
                    disabled={registerForm.pending > 0}
                    type="submit"
                    data-testid="confirm-overwrite"
                  >
                    {registerForm.pending > 0 ? "Overwriting…" : "Overwrite"}
                  </button>
                  <button
                    class="mac-btn-gradient border-mac-border-dark active:mac-btn-gradient-active inline-flex h-7 cursor-default items-center justify-center rounded border px-3 text-sm whitespace-nowrap text-black select-none"
                    disabled={registerForm.pending > 0}
                    type="button"
                    onclick={cancelConflict}
                    data-testid="cancel-overwrite"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            {:else}
              <label class="text-sm font-bold text-[#333]" for="remote-url"
                >Remote Git URL:</label
              >
              <div class="flex items-stretch gap-2">
                <input
                  id="remote-url"
                  class="border-mac-border-light h-7 flex-1 border bg-white px-1.5 text-sm text-black shadow-[inset_1px_1px_2px_rgba(0,0,0,0.08)]"
                  placeholder="git@github.com:owner/repo.git"
                  {...remoteUrlField}
                />
                <button
                  class="mac-btn-gradient border-mac-border-dark active:mac-btn-gradient-active inline-flex h-7 cursor-default items-center justify-center rounded border px-3 text-sm font-bold whitespace-nowrap text-black select-none disabled:text-[#999]"
                  disabled={registerForm.pending > 0}
                  type="submit"
                >
                  {registerForm.pending > 0 ? "Cloning…" : "Register"}
                </button>
              </div>
              {#if fieldIssue()}
                <p class="text-[13px] text-red-700">⚠ {fieldIssue()}</p>
              {/if}
              {#if formError}
                <div
                  class="border border-[#c44] bg-[#fff0f0] px-2 py-1.5 text-[13px] text-red-700"
                  data-testid="register-error"
                >
                  ⚠ {formError}
                </div>
              {/if}
            {/if}
          </form>
        </fieldset>

        <!-- Project list fieldset -->
        <fieldset
          class="border-mac-border-light shadow-mac-etched bg-mac-window border px-2.5 pt-4 pb-2.5"
        >
          <legend class="bg-mac-window px-1 text-[13px] font-bold text-black"
            >Registered Projects</legend
          >
          <div class="space-y-1.5 text-sm" data-testid="project-list">
            {#await projectsQuery}
              <span class="text-mac-muted">Loading projects…</span>
            {:then projectList}
              {#if projectList.length === 0}
                <div class="flex items-center gap-2">
                  <span class="text-mac-border-light">○</span>
                  <span class="text-mac-muted">No registered projects</span>
                </div>
              {:else}
                {#each projectList as project (project.id)}
                  <div
                    class="flex items-center justify-between gap-2"
                    data-testid="project-row"
                  >
                    <div class="flex items-center gap-2">
                      <span class="text-[#383]">●</span>
                      <span class="font-bold text-black">{project.name}</span>
                    </div>
                    <span
                      class="text-mac-muted truncate text-xs"
                      title={project.localPath}
                    >
                      {project.localPath}
                    </span>
                  </div>
                {/each}
              {/if}
            {/await}
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
      <div class="mac-resize-pattern ml-2 h-[15px] w-[15px]"></div>
    </div>
  </div>
</div>
