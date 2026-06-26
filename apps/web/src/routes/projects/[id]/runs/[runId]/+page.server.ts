import { error } from "@sveltejs/kit";

import { listProjects } from "$lib/server/projects";
import { getAgentRun } from "$lib/server/agent-runs";
import { listAgentRunEvents } from "$lib/server/agent-run-events";

export async function load({
  locals,
  params,
}: {
  locals: App.Locals;
  params: { id: string; runId: string };
}) {
  const project = listProjects(locals.db).find((candidate) => candidate.id === params.id);

  if (!project) {
    throw error(404, "Project not found.");
  }

  const run = getAgentRun(locals.db, project.id, params.runId);

  if (!run) {
    throw error(404, "Agent Run not found.");
  }

  return {
    project,
    run,
    events: listAgentRunEvents(locals.db, run.id),
  };
}
