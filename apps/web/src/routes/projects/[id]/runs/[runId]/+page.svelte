<script lang="ts">
  import { resolve } from "$app/paths";
  import { onMount } from "svelte";

  import type { AgentRunEvent } from "$lib/server/agent-run-events";

  let { data } = $props();

  let liveEvents = $state<AgentRunEvent[]>([]);
  let streamError = $state<string | null>(null);

  const events = $derived([...data.events, ...liveEvents]);

  const terminalEvent = $derived(
    [...events].reverse().find((event) => event.type === "terminal") ?? null
  );

  const streamStatus = $derived(
    terminalEvent?.status ?? data.run.status
  );

  const displayFinishedAt = $derived(
    terminalEvent?.finishedAt ?? data.run.finishedAt
  );

  const displayFailureMessage = $derived(
    terminalEvent?.failureMessage ?? data.run.failureMessage
  );

  function formatTime(iso: string) {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function statusLabel(status: typeof data.run.status) {
    if (status === "succeeded") return "succeeded";
    if (status === "failed") return "failed";
    return "running";
  }

  function statusColor(status: typeof data.run.status) {
    if (status === "succeeded") return "text-[#383]";
    if (status === "failed") return "text-red-600";
    return "text-[#a60]";
  }

  onMount(() => {
    if (terminalEvent) {
      return;
    }

    const lastBufferedEventId = data.events.at(-1)?.id ?? 0;

    const eventSource = new EventSource(
      resolve(
        `/projects/${data.project.id}/runs/${data.run.id}/events?after=${lastBufferedEventId}`
      )
    );

    eventSource.addEventListener("agent-run-event", (rawEvent) => {
      const event = JSON.parse((rawEvent as MessageEvent<string>).data) as AgentRunEvent;
      liveEvents = [...liveEvents, event];

      if (event.type === "terminal") {
        eventSource.close();
      }
    });

    eventSource.onerror = () => {
      streamError = "Live Agent Run stream disconnected.";
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  });
</script>

<svelte:head>
  <title>Agent Run | Sandfactory</title>
</svelte:head>

<div class="flex h-[calc(100dvh-56px)] p-6">
  <div class="bg-mac-window border-mac-border shadow-mac-window flex max-h-full w-full max-w-210 flex-col overflow-hidden border">
    <div class="mac-pinstripe border-mac-border relative flex h-6 shrink-0 items-center justify-center border-b select-none">
      <span class="text-sm leading-none font-bold text-black">Sandfactory</span>
    </div>

    <div class="flex min-h-0 flex-1 flex-col bg-white p-4">
      <div class="mb-3 flex items-center justify-between gap-3">
        <div>
          <p class="text-[15px] font-bold text-black">{data.project.name}</p>
          <p class="text-mac-muted text-[12px]">Agent Run {data.run.id}</p>
        </div>
        <a
          href={resolve(`/projects/${data.project.id}`)}
          class="mac-btn-gradient border-mac-border-dark active:mac-btn-gradient-active inline-flex h-6 items-center justify-center rounded border px-2 text-[13px] text-black"
        >
          Back to project
        </a>
      </div>

      <div class="mb-3 flex items-center gap-3 text-[13px]">
        <span class={["font-bold uppercase", statusColor(streamStatus)]}>
          {statusLabel(streamStatus)}
        </span>
        <span class="text-mac-muted">Started {formatTime(data.run.startedAt)}</span>
        {#if displayFinishedAt}
          <span class="text-mac-muted">Finished {formatTime(displayFinishedAt)}</span>
        {/if}
      </div>

      {#if streamError}
        <div class="mb-3 border border-[#c44] bg-[#fff0f0] px-2 py-1.5 text-[13px] text-red-700">
          ⚠ {streamError}
        </div>
      {/if}

      <fieldset class="border-mac-border-light shadow-mac-etched bg-mac-window min-h-0 flex flex-1 flex-col border px-2.5 pt-4 pb-2.5">
        <legend class="bg-mac-window px-1 text-[13px] font-bold text-black">
          Agent Run Output
        </legend>

        <div class="min-h-0 flex-1 overflow-y-auto border border-[#222] bg-black p-3 font-mono text-[12px] leading-5 text-[#ddd]">
          {#if events.length === 0}
            <p class="text-[#888]">Waiting for Agent Run output…</p>
          {:else}
            {#each events as event (event.id)}
              {#if event.type === "output"}
                <p class:event-stderr={event.stream === "stderr"}>
                  <span class="mr-2 text-[#666]">[{event.stream}]</span>{event.text}
                </p>
              {:else}
                <p class={["mt-2 font-bold uppercase", statusColor(event.status)]}>
                  Agent Run {statusLabel(event.status)}
                </p>
                {#if event.failureMessage}
                  <p class="text-red-400">{event.failureMessage}</p>
                {/if}
              {/if}
            {/each}
          {/if}
        </div>
      </fieldset>

      {#if displayFailureMessage}
        <p class="mt-3 text-[13px] text-red-700">Failure: {displayFailureMessage}</p>
      {/if}
    </div>
  </div>
</div>

<style>
  :global(.whitespace-pre-wrap) {
    white-space: pre-wrap;
  }

  div :global(p) {
    white-space: pre-wrap;
  }

  .event-stderr {
    color: #ffb0b0;
  }
</style>
