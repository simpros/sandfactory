import { error } from "@sveltejs/kit";

import {
  listAgentRunEvents,
  subscribeToAgentRunEvents,
  type AgentRunEvent,
} from "$lib/server/agent-run-events";
import { getAgentRun } from "$lib/server/agent-runs";
import { listProjects } from "$lib/server/projects";

function encodeSseEvent(event: AgentRunEvent) {
  return `event: agent-run-event\ndata: ${JSON.stringify(event)}\n\n`;
}

export async function GET({
  locals,
  params,
  request,
  url,
}: {
  locals: App.Locals;
  params: { id: string; runId: string };
  request: Request;
  url: URL;
}) {
  if (!locals.session) {
    throw error(401, "Unauthorized");
  }

  const project = listProjects(locals.db).find((candidate) => candidate.id === params.id);

  if (!project) {
    throw error(404, "Project not found.");
  }

  const run = getAgentRun(locals.db, project.id, params.runId);

  if (!run) {
    throw error(404, "Agent Run not found.");
  }

  const after = Number(url.searchParams.get("after") ?? "0");
  const replay = listAgentRunEvents(locals.db, run.id, Number.isFinite(after) ? after : 0);

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();

      for (const event of replay) {
        controller.enqueue(encoder.encode(encodeSseEvent(event)));

        if (event.type === "terminal") {
          controller.close();
          return;
        }
      }

      const unsubscribe = subscribeToAgentRunEvents(run.id, (event) => {
        controller.enqueue(encoder.encode(encodeSseEvent(event)));

        if (event.type === "terminal") {
          unsubscribe();
          controller.close();
        }
      });

      const abortListener = () => {
        unsubscribe();
        controller.close();
      };

      request.signal.addEventListener("abort", abortListener, { once: true });
    },
  });

  return new Response(stream, {
    headers: {
      "cache-control": "no-cache",
      connection: "keep-alive",
      "content-type": "text/event-stream; charset=utf-8",
    },
  });
}
