<script lang="ts">
  let {
    title,
    description,
    index,
    class: className = "",
  }: {
    title: string;
    description: string;
    index?: string;
    class?: string;
  } = $props();
</script>

<fieldset class={["border border-mac-border-light shadow-mac-etched pt-4 px-2.5 pb-2.5 mb-2.5 bg-mac-window", className]}>
  <legend class="px-1 text-[13px] font-bold text-black bg-mac-window">{title}</legend>
  {#if index}
    <p class="mb-1 text-xs text-[#666]">{index}</p>
  {/if}
  <p class="text-sm leading-snug text-black">{description}</p>
</fieldset>
