<script lang="ts">
  import { resolve } from "$app/paths";

  import { getProjectDetail } from "./project-detail.remote";
  import AgentRunPanel from "./agent-run-panel.svelte";
  import GenerateConfigPanel from "./generate-config-panel.svelte";
  import InitSandcastlePanel from "./init-sandcastle-panel.svelte";
  import ProjectHeader from "./project-header.svelte";
  import RunHistoryPanel from "./run-history-panel.svelte";
  import type { AgentRun } from "$lib/server/agent-runs";

  let { params } = $props();
  const projectId = $derived(params.id);
  const projectDetail = $derived(getProjectDetail(projectId));

  function formatDuration(
    startedAt: string,
    finishedAt: string | null
  ): string {
    if (!finishedAt) return "running…";
    const ms =
      new Date(finishedAt).getTime() - new Date(startedAt).getTime();
    const s = Math.round(ms / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
  }

  function formatTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function statusColor(status: AgentRun["status"]): string {
    if (status === "succeeded") return "text-[#383]";
    if (status === "failed") return "text-red-600";
    return "text-[#a60]";
  }

  function statusLabel(status: AgentRun["status"]): string {
    if (status === "succeeded") return "✓ succeeded";
    if (status === "failed") return "✕ failed";
    return "● running";
  }

  const navItems = [
    { icon: "🏠", label: "Dashboard", active: false, path: "/" },
    { icon: "📁", label: "Projects", active: true, path: "/projects" },
    { icon: "⚙", label: "Settings", active: false, path: "/settings" },
    { icon: "🗝", label: "API Tokens", active: false, path: null },
  ] as const;
</script>

<svelte:head>
  <title>Project | Sandfactory</title>
</svelte:head>

<div class="flex h-[calc(100dvh-56px)] p-6">
  <div
    class="bg-mac-window border-mac-border shadow-mac-window flex max-h-full w-full max-w-170 flex-col overflow-hidden border"
  >
    <!-- Title bar -->
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
      <div class="absolute right-1.5 flex gap-0.75">
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

    <!-- Menu bar -->
    <div
      class="bg-mac-surface border-mac-border-dark shadow-mac-menubar flex h-6 items-center border-b px-1 select-none"
    >
      {#each ["File", "Edit", "View", "Favorites", "Tools", "Help"] as item (item)}
        <span
          class="hover:bg-mac-highlight inline-flex h-full items-center rounded-sm px-2 text-sm text-black hover:text-white"
        >
          {item}
        </span>
      {/each}
    </div>

    <!-- Toolbar -->
    <div
      class="bg-mac-window border-mac-border-light flex items-center gap-1 border-b px-2 py-1 shadow-[inset_0_-1px_0_#fff]"
    >
      <a
        href={resolve("/projects")}
        class="mac-btn-gradient border-mac-border-dark active:mac-btn-gradient-active inline-flex h-5.5 cursor-default items-center justify-center rounded border px-2 text-[13px] whitespace-nowrap text-black select-none"
        >⬆ Back</a
      >
      <div
        class="bg-mac-border-light mx-0.5 h-4 w-px shadow-[1px_0_0_#fff]"
      ></div>
      <div
        class="border-mac-border-light flex h-5.5 flex-1 items-center border bg-white px-2 text-[13px] text-black shadow-[inset_1px_1px_2px_rgba(0,0,0,0.08)]"
      >
        <svelte:boundary>
          {#await projectDetail}
            Sandfactory › Projects › ...
          {:then detail}
            Sandfactory › Projects › {detail.project.name}
          {:catch}
            Sandfactory › Projects
          {/await}
          {#snippet pending()}Sandfactory › Projects › …{/snippet}
        </svelte:boundary>
      </div>
    </div>

    <!-- Two-panel layout -->
    <div class="flex min-h-0 flex-1">
      <!-- Sidebar -->
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
          >
            <span class="text-base leading-none">{item.icon}</span>
            <span>{item.label}</span>
          </a>
        {/each}
      </div>

      <!-- Main content -->
      <div class="flex min-h-0 flex-1 flex-col overflow-y-auto bg-white p-4">
        <svelte:boundary>
          {#await projectDetail then detail}
            {@const project = detail.project}
            {@const config = detail.config}
            {@const runs = detail.runs}
            {@const detectedDockerfiles = detail.detectedDockerfiles}
            {@const onboarding = detail.onboardingPanel}

            <ProjectHeader {project} />

            {#if onboarding.panel === "init-sandcastle"}
              <InitSandcastlePanel />
            {:else if onboarding.panel === "generate-config"}
              <GenerateConfigPanel
                projectId={project.id}
                {detectedDockerfiles}
              />
            {:else if onboarding.panel === "ready"}
              {@const agentCommand = config.ok
                ? (config.config.agent?.command ?? null)
                : null}
              {@const apps = config.ok ? config.config.apps : []}
              {#if apps.length > 0}
                <div class="mb-2.5">
                  <p class="mb-1 text-[12px] font-bold text-[#333]">Declared Apps:</p>
                  <ul class="ml-2 flex flex-col gap-0.5">
                    {#each apps as app (app.dockerfile_path)}
                      <li class="text-[12px] text-[#555]">
                        <span class="font-mono">{app.dockerfile_path}</span>
                        <span class="text-[#888]"> · port {app.port}</span>
                      </li>
                    {/each}
                  </ul>
                </div>
              {/if}
              <AgentRunPanel {agentCommand} projectId={project.id} />
              <RunHistoryPanel
                projectId={project.id}
                {runs}
                {formatTime}
                {formatDuration}
                {statusColor}
                {statusLabel}
              />
            {:else if onboarding.panel === "config-error"}
              <div
                class="border border-[#c44] bg-[#fff0f0] px-2 py-2 text-[13px] text-red-700"
                data-testid="config-errors"
              >
                <p class="mb-1 font-bold">
                  ⚠ <span class="font-mono">.sandfactory/config.yaml</span> is
                  invalid:
                </p>
                <ul class="ml-4 list-disc">
                  {#each onboarding.errors as err (err)}
                    <li>{err}</li>
                  {/each}
                </ul>
              </div>
            {/if}
          {:catch}
            <p class="text-[13px] text-red-700">⚠ Project not found.</p>
          {/await}

          {#snippet pending()}
            <p class="text-mac-muted text-[13px]">Loading project…</p>
          {/snippet}
        </svelte:boundary>
      </div>
    </div>

    <!-- Status bar -->
    <div
      class="bg-mac-surface border-mac-border-light shadow-mac-statusbar flex h-5.5 items-center gap-1.5 border-t px-1.5 text-[13px] text-black"
    >
      <span class="flex-1 text-[13px] text-[#333]">Ready</span>
      <div class="mac-resize-pattern ml-2 h-3.75 w-3.75"></div>
    </div>
  </div>
</div>
