<script lang="ts">
  import {
    getProjectDetail,
    triggerAgentRun,
    type TriggerRunResult,
  } from "./project-detail.remote";

  let {
    agentCommand,
    projectId,
  }: {
    agentCommand: string | null;
    projectId: string;
  } = $props();

  let triggerError = $state<string | null>(null);
  let triggerConflict = $state(false);

  const enhancedTrigger = triggerAgentRun.enhance(async ({ submit }) => {
    triggerError = null;
    triggerConflict = false;
    const success = await submit();
    if (!success) return;

    const result = triggerAgentRun.result as TriggerRunResult | undefined;
    if (result && !result.ok) {
      if (result.conflict) {
        triggerConflict = true;
      } else {
        triggerError = result.error;
      }
      return;
    }

    await getProjectDetail(projectId).refresh();
  });
</script>

<fieldset
  class="border-mac-border-light shadow-mac-etched bg-mac-window mb-2.5 border px-2.5 pt-4 pb-2.5"
>
  <legend class="bg-mac-window px-1 text-[13px] font-bold text-black">
    Agent Run
  </legend>

  <form {...enhancedTrigger} class="flex flex-col gap-2">
    <input type="hidden" name="projectId" value={projectId} />

    {#if triggerConflict}
      <div
        class="border border-[#c80] bg-[#fff8e0] px-2 py-1.5 text-[13px] text-black"
        data-testid="trigger-conflict"
      >
        ⚠ An Agent Run is already active for this project. Wait for it to
        finish.
      </div>
    {/if}

    {#if triggerError}
      <div
        class="border border-[#c44] bg-[#fff0f0] px-2 py-1.5 text-[13px] text-red-700"
        data-testid="trigger-error"
      >
        ⚠ {triggerError}
      </div>
    {/if}

    {#if agentCommand}
      <p class="text-[12px] text-[#555]">
        Command: <span class="font-mono">{agentCommand}</span>
      </p>
      <div>
        <button
          class="mac-btn-gradient border-mac-border-dark active:mac-btn-gradient-active inline-flex h-7 cursor-default items-center justify-center rounded border px-3 text-sm font-bold whitespace-nowrap text-black select-none disabled:text-[#999]"
          disabled={triggerAgentRun.pending > 0}
          type="submit"
          data-testid="trigger-run-btn"
        >
          {triggerAgentRun.pending > 0 ? "Starting…" : "▶ Run Agent"}
        </button>
      </div>
    {:else}
      <p class="text-[13px] text-[#888]">
        No <span class="font-mono">agent.command</span> declared in
        <span class="font-mono">.sandfactory/config.yaml</span>.
      </p>
    {/if}
  </form>
</fieldset>
