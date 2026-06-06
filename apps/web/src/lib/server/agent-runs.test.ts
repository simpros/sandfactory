import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createDb } from "@sandfactory/db";

import { listAgentRuns, startAgentRun, type ExecuteFn } from "./agent-runs";

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
  const dbDir = makeTempDir("agent-runs-db");
  const database = createDb(join(dbDir, "sandfactory.sqlite"));
  tempDirs.push(database.databaseFilePath);
  return { db: database.db, close: () => database.close() };
}

function insertTestProject(db: ReturnType<typeof setupHarness>["db"]) {
  const { projects } = require("@sandfactory/db");
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

// ---------------------------------------------------------------------------
// startAgentRun
// ---------------------------------------------------------------------------

describe("startAgentRun", () => {
  test("creates a running record and marks it succeeded with branch and commits after execution", async () => {
    const { db, close } = setupHarness();

    try {
      const project = insertTestProject(db);

      const execute: ExecuteFn = async () => ({
        branch: "feature/my-feature",
        commits: ["abc123 Add feature", "def456 Write tests"],
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

      // Immediately after startAgentRun: the run record should exist with running status
      expect(result.run.status).toBe("running");
      expect(result.run.projectId).toBe(project.id);
      expect(result.run.finishedAt).toBeNull();

      // Await the background execution
      await result.execution;

      // After execution: the run should be succeeded with branch and commits
      const runs = listAgentRuns(db, project.id);
      expect(runs).toHaveLength(1);
      expect(runs[0]?.status).toBe("succeeded");
      expect(runs[0]?.branch).toBe("feature/my-feature");
      expect(runs[0]?.failureMessage).toBeNull();
      expect(runs[0]?.commits).toEqual(["abc123 Add feature", "def456 Write tests"]);
      expect(runs[0]?.finishedAt).not.toBeNull();
    } finally {
      close();
    }
  });

  test("rejects a second Agent Run for the same project while one is already running", async () => {
    const { db, close } = setupHarness();

    try {
      const project = insertTestProject(db);

      // First run that will not resolve until we control it
      let resolveFirst!: (result: { branch: string | null; commits: string[] }) => void;
      const firstExecute: ExecuteFn = () =>
        new Promise((resolve) => {
          resolveFirst = resolve;
        });

      const first = await startAgentRun({
        db,
        projectId: project.id,
        agentCommand: "npx tsx .sandcastle/main.ts",
        projectPath: project.localPath,
        execute: firstExecute,
      });
      expect(first.ok).toBe(true);

      // Second run while first is still running
      const second = await startAgentRun({
        db,
        projectId: project.id,
        agentCommand: "npx tsx .sandcastle/main.ts",
        projectPath: project.localPath,
        execute: async () => ({ branch: null, commits: [] }),
      });

      expect(second.ok).toBe(false);
      if (second.ok) throw new Error("expected conflict");
      expect(second.conflict).toBe(true);

      // Clean up: let the first run finish
      resolveFirst({ branch: null, commits: [] });
      if (first.ok) await first.execution;
    } finally {
      close();
    }
  });

  test("marks the run as failed when execution throws", async () => {
    const { db, close } = setupHarness();

    try {
      const project = insertTestProject(db);

      const execute: ExecuteFn = async () => {
        throw new Error("sandcastle exited with code 1");
      };

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

      const runs = listAgentRuns(db, project.id);
      expect(runs).toHaveLength(1);
      expect(runs[0]?.status).toBe("failed");
      expect(runs[0]?.failureMessage).toBe("sandcastle exited with code 1");
      expect(runs[0]?.finishedAt).not.toBeNull();
    } finally {
      close();
    }
  });
});

// ---------------------------------------------------------------------------
// listAgentRuns
// ---------------------------------------------------------------------------

describe("listAgentRuns", () => {
  test("returns runs for a project newest-first, empty array when none exist", async () => {
    const { db, close } = setupHarness();

    try {
      const project = insertTestProject(db);

      const empty = listAgentRuns(db, project.id);
      expect(empty).toEqual([]);

      // Create two runs with controlled timing
      const first = await startAgentRun({
        db,
        projectId: project.id,
        agentCommand: "npx tsx .sandcastle/main.ts",
        projectPath: project.localPath,
        execute: async () => ({ branch: "main", commits: [] }),
      });
      expect(first.ok).toBe(true);
      if (first.ok) await first.execution;

      // Small pause to ensure a distinct startedAt timestamp for the second run
      await Bun.sleep(2);

      const second = await startAgentRun({
        db,
        projectId: project.id,
        agentCommand: "npx tsx .sandcastle/main.ts",
        projectPath: project.localPath,
        execute: async () => ({ branch: "feature/b", commits: [] }),
      });
      expect(second.ok).toBe(true);
      if (second.ok) await second.execution;

      const runs = listAgentRuns(db, project.id);
      expect(runs).toHaveLength(2);
      // Newest first: second run started after first
      expect(runs[0]?.branch).toBe("feature/b");
      expect(runs[1]?.branch).toBe("main");
    } finally {
      close();
    }
  });
});
