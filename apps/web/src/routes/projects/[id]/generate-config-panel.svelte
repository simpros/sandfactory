<script lang="ts">
  import {
    generateProjectConfigForm,
    getProjectDetail,
    type GenerateFormResult,
  } from "./project-detail.remote";

  let {
    visible,
    projectId,
    detectedDockerfiles,
  }: {
    visible: boolean;
    projectId: string;
    detectedDockerfiles: string[];
  } = $props();

  const defaultAgentCommand = "npx tsx .sandcastle/main.ts";
  const generateForm = generateProjectConfigForm;
  const dockerfilePathField = generateForm.fields.dockerfilePath.as("text");
  const portField = generateForm.fields.port.as("text");
  const agentCommandField = generateForm.fields.agentCommand.as(
    "text",
    defaultAgentCommand
  );
  let generateError = $state<string | null>(null);

  function fieldIssue(name: "dockerfilePath" | "port" | "agentCommand") {
    const message = generateForm.fields[name].issues()?.[0]?.message;
    return typeof message === "string"
      ? message
      : message
        ? String(message)
        : undefined;
  }

  const enhancedGenerate = generateForm.enhance(async ({ submit }) => {
    generateError = null;
    const success = await submit();
    if (!success) return;

    const result = generateForm.result as GenerateFormResult | undefined;
    if (result && !result.ok) {
      generateError = result.error;
      return;
    }

    await getProjectDetail(projectId).refresh();
  });
</script>

{#if visible}
  <fieldset
    class="border-mac-border-light shadow-mac-etched bg-mac-window mb-2.5 border px-2.5 pt-4 pb-2.5"
  >
    <legend class="bg-mac-window px-1 text-[13px] font-bold text-black">
      Generate Project Config
    </legend>

    <p class="mb-2 text-[12px] text-[#555]">
      No <span class="font-mono">.sandcastle/config.yaml</span> found. Fill in
      the details below to create one. First time? Run
      <span class="font-mono">npx @ai-hero/sandcastle init</span> in your
      project to scaffold the full <span class="font-mono">.sandcastle/</span>
      directory.
    </p>

    {#if generateError}
      <div
        class="mb-2 border border-[#c44] bg-[#fff0f0] px-2 py-1.5 text-[13px] text-red-700"
        data-testid="generate-error"
      >
        ⚠ {generateError}
      </div>
    {/if}

    <form
      {...enhancedGenerate}
      class="flex flex-col gap-2"
      data-testid="generate-config-form"
    >
      <input type="hidden" name="projectId" value={projectId} />

      <div class="flex flex-col gap-1">
        <label class="text-[12px] font-bold text-[#333]" for="dockerfile-path">
          Dockerfile path:
        </label>
        {#if detectedDockerfiles.length > 1}
          <select
            id="dockerfile-path"
            bind:value={dockerfilePathField.value}
            class="border-mac-border-light h-7 border bg-white px-1.5 text-sm text-black shadow-[inset_1px_1px_2px_rgba(0,0,0,0.08)]"
            name={dockerfilePathField.name}
          >
            {#each detectedDockerfiles as df (df)}
              <option value={df}>{df}</option>
            {/each}
            <option value="">Other…</option>
          </select>
        {:else}
          <input
            id="dockerfile-path"
            type="text"
            {...dockerfilePathField}
            class="border-mac-border-light h-7 border bg-white px-1.5 text-sm text-black shadow-[inset_1px_1px_2px_rgba(0,0,0,0.08)]"
            placeholder="Dockerfile"
            data-testid="dockerfile-path-input"
          />
        {/if}
        {#if fieldIssue("dockerfilePath")}
          <p class="text-[13px] text-red-700">⚠ {fieldIssue("dockerfilePath")}</p>
        {/if}
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-[12px] font-bold text-[#333]" for="app-port">
          App port:
        </label>
        <input
          id="app-port"
          type="number"
          {...portField}
          min="1"
          max="65535"
          class="border-mac-border-light h-7 w-28 border bg-white px-1.5 text-sm text-black shadow-[inset_1px_1px_2px_rgba(0,0,0,0.08)]"
          placeholder="3000"
          data-testid="port-input"
        />
        {#if fieldIssue("port")}
          <p class="text-[13px] text-red-700">⚠ {fieldIssue("port")}</p>
        {/if}
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-[12px] font-bold text-[#333]" for="agent-command">
          Agent command
          <span class="font-normal text-[#888]">(optional)</span>:
        </label>
        <input
          id="agent-command"
          type="text"
          {...agentCommandField}
          class="border-mac-border-light h-7 border bg-white px-1.5 font-mono text-sm text-black shadow-[inset_1px_1px_2px_rgba(0,0,0,0.08)]"
          data-testid="agent-command-input"
        />
        {#if fieldIssue("agentCommand")}
          <p class="text-[13px] text-red-700">⚠ {fieldIssue("agentCommand")}</p>
        {/if}
      </div>

      <div>
        <button
          class="mac-btn-gradient border-mac-border-dark active:mac-btn-gradient-active inline-flex h-7 cursor-default items-center justify-center rounded border px-3 text-sm font-bold whitespace-nowrap text-black select-none disabled:text-[#999]"
          disabled={generateForm.pending > 0}
          type="submit"
          data-testid="generate-config-btn"
        >
          {generateForm.pending > 0 ? "Generating…" : "Generate config.yaml"}
        </button>
      </div>
    </form>
  </fieldset>
{/if}
