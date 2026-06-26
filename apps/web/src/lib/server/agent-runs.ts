import { randomUUID } from "node:crypto";

import { type Db, agentRuns } from "@sandfactory/db";
import { and, desc, eq } from "drizzle-orm";

import { recordAgentRunOutput, recordAgentRunTerminal } from "./agent-run-events";

export type AgentRunStatus = "running" | "succeeded" | "failed";

export type AgentRun = {
  id: string;
  projectId: string;
  status: AgentRunStatus;
  startedAt: string;
  finishedAt: string | null;
  branch: string | null;
  failureMessage: string | null;
  commits: string[] | null;
};

export type ExecuteResult = {
  branch: string | null;
  commits: string[];
};

export type ExecuteFn = (input: {
  command: string;
  cwd: string;
  onOutput?: (output: { stream: "stdout" | "stderr"; text: string }) => Promise<void>;
}) => Promise<ExecuteResult>;

export type StartRunInput = {
  db: Db["db"];
  projectId: string;
  agentCommand: string;
  projectPath: string;
  execute: ExecuteFn;
};

export type StartRunResult =
  | { ok: true; run: AgentRun; execution: Promise<void> }
  | { ok: false; conflict: true }
  | { ok: false; conflict: false; error: string };

export async function startAgentRun({
  db,
  projectId,
  agentCommand,
  projectPath,
  execute,
}: StartRunInput): Promise<StartRunResult> {
  // Reject if another run is already active for this project
  const activeRun = db
    .select({ id: agentRuns.id })
    .from(agentRuns)
    .where(
      and(
        eq(agentRuns.projectId, projectId),
        eq(agentRuns.status, "running")
      )
    )
    .get();

  if (activeRun) {
    return { ok: false, conflict: true };
  }

  const run: AgentRun = {
    id: randomUUID(),
    projectId,
    status: "running",
    startedAt: new Date().toISOString(),
    finishedAt: null,
    branch: null,
    failureMessage: null,
    commits: null,
  };

  db.insert(agentRuns)
    .values({
      id: run.id,
      projectId: run.projectId,
      status: run.status,
      startedAt: run.startedAt,
      finishedAt: null,
      branch: null,
      failureMessage: null,
      commits: null,
    })
    .run();

  const execution = execute({
    command: agentCommand,
    cwd: projectPath,
    onOutput: ({ stream, text }) =>
      recordAgentRunOutput(db, {
        runId: run.id,
        stream,
        text,
      }).then(() => undefined),
  })
    .then(async (result) => {
      const finishedAt = new Date().toISOString();

      db.update(agentRuns)
        .set({
          status: "succeeded",
          finishedAt,
          branch: result.branch,
          commits:
            result.commits.length > 0 ? JSON.stringify(result.commits) : null,
        })
        .where(eq(agentRuns.id, run.id))
        .run();

      await recordAgentRunTerminal(db, {
        runId: run.id,
        status: "succeeded",
        finishedAt,
      });
    })
    .catch(async (error: unknown) => {
      const failureMessage =
        error instanceof Error ? error.message : "Agent run failed.";
      const finishedAt = new Date().toISOString();

      db.update(agentRuns)
        .set({
          status: "failed",
          finishedAt,
          failureMessage,
        })
        .where(eq(agentRuns.id, run.id))
        .run();

      await recordAgentRunTerminal(db, {
        runId: run.id,
        status: "failed",
        finishedAt,
        failureMessage,
      });
    });

  return { ok: true, run, execution };
}

export function listAgentRuns(
  db: Db["db"],
  projectId: string
): AgentRun[] {
  return db
    .select({
      id: agentRuns.id,
      projectId: agentRuns.projectId,
      status: agentRuns.status,
      startedAt: agentRuns.startedAt,
      finishedAt: agentRuns.finishedAt,
      branch: agentRuns.branch,
      failureMessage: agentRuns.failureMessage,
      commits: agentRuns.commits,
    })
    .from(agentRuns)
    .where(eq(agentRuns.projectId, projectId))
    .orderBy(desc(agentRuns.startedAt))
    .all()
    .map((row) => ({
      ...row,
      status: row.status as AgentRunStatus,
      commits: row.commits
        ? (JSON.parse(row.commits) as string[])
        : null,
    }));
}

export function getAgentRun(
  db: Db["db"],
  projectId: string,
  runId: string
): AgentRun | null {
  const row = db
    .select({
      id: agentRuns.id,
      projectId: agentRuns.projectId,
      status: agentRuns.status,
      startedAt: agentRuns.startedAt,
      finishedAt: agentRuns.finishedAt,
      branch: agentRuns.branch,
      failureMessage: agentRuns.failureMessage,
      commits: agentRuns.commits,
    })
    .from(agentRuns)
    .where(and(eq(agentRuns.projectId, projectId), eq(agentRuns.id, runId)))
    .get();

  if (!row) {
    return null;
  }

  return {
    ...row,
    status: row.status as AgentRunStatus,
    commits: row.commits ? (JSON.parse(row.commits) as string[]) : null,
  };
}
