<script lang="ts">
  import { resolve } from "$app/paths";

  import type { AgentRun } from "$lib/server/agent-runs";

  let {
    runs,
    projectId,
    formatTime,
    formatDuration,
    statusColor,
    statusLabel,
  }: {
    runs: AgentRun[];
    projectId: string;
    formatTime: (iso: string) => string;
    formatDuration: (
      startedAt: string,
      finishedAt: string | null
    ) => string;
    statusColor: (status: AgentRun["status"]) => string;
    statusLabel: (status: AgentRun["status"]) => string;
  } = $props();
</script>

<fieldset
  class="border-mac-border-light shadow-mac-etched bg-mac-window flex min-h-0 flex-1 flex-col border px-2.5 pt-4 pb-2.5"
>
  <legend class="bg-mac-window px-1 text-[13px] font-bold text-black">
    Run History
  </legend>

  {#if runs.length === 0}
    <div class="flex items-center gap-2">
      <span class="text-mac-border-light">○</span>
      <span class="text-mac-muted text-sm">No Agent Runs yet.</span>
    </div>
  {:else}
    <div
      class="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1"
      data-testid="run-list"
    >
      {#each runs as run (run.id)}
        <div
          class="border-mac-border-light border bg-white text-[12px]"
          data-testid="run-row"
        >
          <div class="flex items-center justify-between gap-2 px-2 py-1.5">
            <span class={["font-bold", statusColor(run.status)]}>
              {statusLabel(run.status)}
            </span>
            <div class="flex items-center gap-2">
              <span class="text-mac-muted truncate">
                {formatTime(run.startedAt)}
              </span>
              <span class="text-[#555]">
                {formatDuration(run.startedAt, run.finishedAt)}
              </span>
              <a
                class="border-mac-border-light bg-mac-window px-1.5 py-0.5 text-[11px] text-[#333] underline"
                href={resolve(`/projects/${projectId}/runs/${run.id}`)}
              >
                View details
              </a>
            </div>
          </div>
          {#if run.branch || run.failureMessage || (run.commits && run.commits.length > 0)}
            <div class="border-t border-[#eee] px-2 py-1">
              {#if run.branch}
                <p class="text-[#555]">
                  <span class="font-semibold">Branch:</span>
                  <span class="font-mono">{run.branch}</span>
                </p>
              {/if}
              {#if run.failureMessage}
                <p class="break-words text-red-700">
                  <span class="font-semibold">Failure:</span>
                  <span class="font-mono">{run.failureMessage}</span>
                </p>
              {/if}
              {#if run.commits && run.commits.length > 0}
                <p class="mt-0.5 font-semibold text-[#555]">Commits:</p>
                <ul class="mt-0.5 list-disc pl-4 text-[#555]">
                  {#each run.commits as commit (commit)}
                    <li class="break-all font-mono">{commit}</li>
                  {/each}
                </ul>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</fieldset>
