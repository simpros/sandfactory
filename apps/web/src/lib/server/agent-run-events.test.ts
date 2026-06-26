import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createDb, projects } from "@sandfactory/db";

import { listAgentRunEvents } from "./agent-run-events";
import { startAgentRun, type ExecuteFn } from "./agent-runs";

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
  const dbDir = makeTempDir("agent-run-events-db");
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

describe("startAgentRun terminal events", () => {
  test("records a terminal event when an Agent Run finishes", async () => {
    const { db, close } = setupHarness();

    try {
      const project = insertTestProject(db);

      const execute: ExecuteFn = async () => ({
        branch: "feature/run-detail",
        commits: ["abc123 Add run detail"],
      });

      const result = await startAgentRun({
        db,
        projectId: project.id,
        agentCommand: "npx tsx .sandcastle/main.ts",
        projectPath: project.localPath,
        execute,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error("expected ok");

      await result.execution;

      const events = listAgentRunEvents(db, result.run.id);
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        runId: result.run.id,
        type: "terminal",
        status: "succeeded",
      });
    } finally {
      close();
    }
  });
});
