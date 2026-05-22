<script lang="ts">
  let {
    label,
    value,
    class: className = "",
  }: {
    label: string;
    value: string;
    class?: string;
  } = $props();
</script>

<div class={["flex flex-col gap-1", className]}>
  <span class="text-[12px] font-bold text-black">{label}:</span>
  <div
    class="min-h-[22px] w-full break-all bg-white px-1.5 py-1 text-[12px] text-black"
    style="border: 1px solid #aaaaaa; box-shadow: inset 0 0 0 1px #ffffff;"
  >
    {value}
  </div>
</div>
