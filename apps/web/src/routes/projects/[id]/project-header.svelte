<script lang="ts">
  import type { Project } from "$lib/server/projects";

  let { project }: { project: Project } = $props();
</script>

<p class="mb-1 text-[15px] font-bold text-black">{project.name}</p>
<p class="text-mac-muted mb-3 font-mono text-[12px]">
  {project.localPath}
</p>
<hr
  class="border-mac-border-light mb-3 border-t border-none shadow-[0_1px_0_#fff]"
/>
