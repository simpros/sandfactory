import { afterEach, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createDb, projects } from "@sandfactory/db";

import {
  recordAgentRunOutput,
  recordAgentRunTerminal,
} from "$lib/server/agent-run-events";
import { startAgentRun } from "$lib/server/agent-runs";

import { GET } from "./+server";

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
  const dbDir = makeTempDir("run-stream-db");
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

async function readNextChunk(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const result = await reader.read();
  reader.releaseLock();

  if (result.done || !result.value) {
    throw new Error("expected stream chunk");
  }

  return new TextDecoder().decode(result.value);
}

test("Agent Run event stream continues with live output and a terminal event", async () => {
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

    const buffered = await recordAgentRunOutput(db, {
      runId: result.run.id,
      stream: "stdout",
      text: "already buffered",
    });

    const response = await GET({
      locals: { db, session: { id: "session-1" } },
      params: { id: project.id, runId: result.run.id },
      request: new Request(
        `http://localhost/projects/${project.id}/runs/${result.run.id}/events?after=${buffered.id}`
      ),
      url: new URL(
        `http://localhost/projects/${project.id}/runs/${result.run.id}/events?after=${buffered.id}`
      ),
    } as never);

    expect(response.headers.get("content-type")).toContain("text/event-stream");
    if (!response.body) throw new Error("expected stream body");

    const liveOutputPromise = readNextChunk(response.body);
    await recordAgentRunOutput(db, {
      runId: result.run.id,
      stream: "stderr",
      text: "live warning",
    });
    const liveOutputChunk = await liveOutputPromise;

    expect(liveOutputChunk).toContain("event: agent-run-event");
    expect(liveOutputChunk).toContain('"type":"output"');
    expect(liveOutputChunk).toContain('"stream":"stderr"');
    expect(liveOutputChunk).toContain('"text":"live warning"');

    const terminalPromise = readNextChunk(response.body);
    await recordAgentRunTerminal(db, {
      runId: result.run.id,
      status: "failed",
    });
    const terminalChunk = await terminalPromise;

    expect(terminalChunk).toContain("event: agent-run-event");
    expect(terminalChunk).toContain('"type":"terminal"');
    expect(terminalChunk).toContain('"status":"failed"');
  } finally {
    close();
  }
});
