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

<fieldset class={["mac9-group", className]}>
  <legend>{title}</legend>
  {#if index}
    <p class="mb-1 text-[10px] text-[#666]">{index}</p>
  {/if}
  <p class="text-[12px] leading-snug text-black">{description}</p>
</fieldset>
