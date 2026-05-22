<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";

  let {
    id,
    label,
    name,
    type = "text",
    value = $bindable(),
    placeholder = "",
    error,
    autocomplete,
  }: {
    id: string;
    label: string;
    name: string;
    type?: string;
    value?: string | number;
    placeholder?: string;
    error?: string;
    autocomplete?: HTMLInputAttributes["autocomplete"];
  } = $props();

  function handleInput(event: Event) {
    value = (event.currentTarget as HTMLInputElement).value;
  }
</script>

<div class="flex flex-col gap-1">
  <label class="text-[12px] font-bold text-black" for={id}>{label}</label>
  <input
    {autocomplete}
    class={["mac9-field w-full", error && "border-red-500"]}
    {id}
    {name}
    oninput={handleInput}
    {placeholder}
    {type}
    value={typeof value === "number" ? String(value) : value}
  />
  {#if error}
    <p class="text-[11px] text-red-700">⚠ {error}</p>
  {/if}
</div>
