import { agentRunEvents, type Db } from "@sandfactory/db";
import { and, asc, eq, gt } from "drizzle-orm";

import type { AgentRunStatus } from "./agent-runs";

export type AgentRunOutputStream = "stdout" | "stderr";

export type AgentRunOutputEvent = {
  id: number;
  runId: string;
  type: "output";
  stream: AgentRunOutputStream;
  text: string;
  createdAt: string;
};

export type AgentRunTerminalEvent = {
  id: number;
  runId: string;
  type: "terminal";
  status: AgentRunStatus;
  finishedAt: string | null;
  failureMessage: string | null;
  createdAt: string;
};

export type AgentRunEvent = AgentRunOutputEvent | AgentRunTerminalEvent;

const eventSubscribers = new Map<
  string,
  Set<(event: AgentRunEvent) => void>
>();

function publishAgentRunEvent(event: AgentRunEvent) {
  eventSubscribers.get(event.runId)?.forEach((subscriber) => {
    subscriber(event);
  });
}

export function subscribeToAgentRunEvents(
  runId: string,
  subscriber: (event: AgentRunEvent) => void
) {
  const subscribers = eventSubscribers.get(runId) ?? new Set();
  subscribers.add(subscriber);
  eventSubscribers.set(runId, subscribers);

  return () => {
    const currentSubscribers = eventSubscribers.get(runId);
    if (!currentSubscribers) return;

    currentSubscribers.delete(subscriber);

    if (currentSubscribers.size === 0) {
      eventSubscribers.delete(runId);
    }
  };
}

export async function recordAgentRunOutput(
  db: Db["db"],
  input: {
    runId: string;
    stream: AgentRunOutputStream;
    text: string;
  }
): Promise<AgentRunOutputEvent> {
  const createdAt = new Date().toISOString();

  const result = db.insert(agentRunEvents)
    .values({
      runId: input.runId,
      type: "output",
      stream: input.stream,
      text: input.text,
      status: null,
      finishedAt: null,
      failureMessage: null,
      createdAt,
    })
    .returning({ id: agentRunEvents.id })
    .get();

  const event = {
    id: result.id,
    runId: input.runId,
    type: "output",
    stream: input.stream,
    text: input.text,
    createdAt,
  } satisfies AgentRunOutputEvent;

  publishAgentRunEvent(event);

  return event;
}

export async function recordAgentRunTerminal(
  db: Db["db"],
  input: {
    runId: string;
    status: AgentRunStatus;
    finishedAt?: string | null;
    failureMessage?: string | null;
  }
): Promise<AgentRunTerminalEvent> {
  const createdAt = new Date().toISOString();
  const finishedAt = input.finishedAt ?? null;
  const failureMessage = input.failureMessage ?? null;

  const result = db.insert(agentRunEvents)
    .values({
      runId: input.runId,
      type: "terminal",
      stream: null,
      text: null,
      status: input.status,
      finishedAt,
      failureMessage,
      createdAt,
    })
    .returning({ id: agentRunEvents.id })
    .get();

  const event = {
    id: result.id,
    runId: input.runId,
    type: "terminal",
    status: input.status,
    finishedAt,
    failureMessage,
    createdAt,
  } satisfies AgentRunTerminalEvent;

  publishAgentRunEvent(event);

  return event;
}

export function listAgentRunEvents(
  db: Db["db"],
  runId: string,
  afterId = 0
): AgentRunEvent[] {
  return db
    .select({
      id: agentRunEvents.id,
      runId: agentRunEvents.runId,
      type: agentRunEvents.type,
      stream: agentRunEvents.stream,
      text: agentRunEvents.text,
      status: agentRunEvents.status,
      finishedAt: agentRunEvents.finishedAt,
      failureMessage: agentRunEvents.failureMessage,
      createdAt: agentRunEvents.createdAt,
    })
    .from(agentRunEvents)
    .where(and(eq(agentRunEvents.runId, runId), gt(agentRunEvents.id, afterId)))
    .orderBy(asc(agentRunEvents.id))
    .all()
    .map((row) => {
      if (row.type === "output") {
        return {
          id: row.id,
          runId: row.runId,
          type: "output",
          stream: row.stream as AgentRunOutputStream,
          text: row.text ?? "",
          createdAt: row.createdAt,
        } satisfies AgentRunOutputEvent;
      }

      return {
        id: row.id,
        runId: row.runId,
        type: "terminal",
        status: row.status as AgentRunStatus,
        finishedAt: row.finishedAt,
        failureMessage: row.failureMessage,
        createdAt: row.createdAt,
      } satisfies AgentRunTerminalEvent;
    });
}
