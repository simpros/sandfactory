import { afterEach, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createDb, projects } from "@sandfactory/db";

import { recordAgentRunOutput } from "$lib/server/agent-run-events";
import { startAgentRun } from "$lib/server/agent-runs";

import { load } from "./+page.server";

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) rmSync(dir, { force: true, recursive: true });
  }
});

function makeTempDir(label: string) {
  const dir = mkdtempSync(join(tmpdir(), `sandfactory-${label}-`));
  tempDirs.push(dir);
  return dir;
}

function setupHarness() {
  const dbDir = makeTempDir("run-detail-db");
  const database = createDb(join(dbDir, "sandfactory.sqlite"));
  tempDirs.push(database.databaseFilePath);
  return { db: database.db, close: () => database.close() };
}

function insertTestProject(db: ReturnType<typeof setupHarness>["db"]) {
  const project = {
    id: "proj-1",
    name: "test-project",
    remoteUrl: null,
    localPath: "/tmp/test-project",
    createdAt: new Date().toISOString(),
  };
  db.insert(projects).values(project).run();
  return project;
}

test("run detail load replays buffered Agent Run output from the beginning", async () => {
  const { db, close } = setupHarness();

  try {
    const project = insertTestProject(db);

    const result = await startAgentRun({
      db,
      projectId: project.id,
      agentCommand: "npx tsx .sandcastle/main.ts",
      projectPath: project.localPath,
      execute: async () => new Promise(() => {}),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");

    await recordAgentRunOutput(db, {
      runId: result.run.id,
      stream: "stdout",
      text: "starting run",
    });
    await recordAgentRunOutput(db, {
      runId: result.run.id,
      stream: "stderr",
      text: "warning line",
    });

    const data = await load({
      locals: { db },
      params: { id: project.id, runId: result.run.id },
    } as never);

    expect(data.run.id).toBe(result.run.id);
    expect(
      data.events.map((event) => {
        if (event.type === "output") {
          return `${event.stream}:${event.text}`;
        }
        return `terminal:${event.status}`;
      })
    ).toEqual(["stdout:starting run", "stderr:warning line"]);
  } finally {
    close();
  }
});
