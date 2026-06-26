import { form, getRequestEvent, query } from "$app/server";
import { error } from "@sveltejs/kit";
import * as v from "valibot";

import {
  type AgentRun,
  type ExecuteFn,
  type ExecuteResult,
  listAgentRuns,
  startAgentRun,
} from "$lib/server/agent-runs";
import {
  type ReadResult,
  readProjectConfig,
} from "$lib/server/project-config";
import {
  detectDockerfiles,
  generateProjectConfig,
} from "$lib/server/project-config-generator";
import { type Project, listProjects } from "$lib/server/projects";

// ---------------------------------------------------------------------------
// Shared data query
// ---------------------------------------------------------------------------

export type ProjectDetail = {
  project: Project;
  config: ReadResult;
  runs: AgentRun[];
  detectedDockerfiles: string[];
};

export const getProjectDetail = query(
  v.string(),
  async (projectId: string): Promise<ProjectDetail> => {
    const event = getRequestEvent();
    const { db } = event.locals;

    const project = listProjects(db).find((p) => p.id === projectId);
    if (!project) throw error(404, "Project not found.");

    const [config, runs, detectedDockerfiles] = await Promise.all([
      readProjectConfig(project.localPath),
      listAgentRuns(db, project.id),
      detectDockerfiles(project.localPath),
    ]);

    return { project, config, runs, detectedDockerfiles };
  }
);

// ---------------------------------------------------------------------------
// Trigger Agent Run
// ---------------------------------------------------------------------------

/**
 * Real executor: runs the agent command as a subprocess, then reads git state
 * to capture the branch and any commits produced during the run.
 */
async function realExecute({
  command: cmd,
  cwd,
  onOutput,
}: {
  command: string;
  cwd: string;
  onOutput?: (output: {
    stream: "stdout" | "stderr";
    text: string;
  }) => Promise<void>;
}): Promise<ExecuteResult> {
  const headBefore = await getGitHead(cwd);

  const proc = Bun.spawn(["sh", "-c", cmd], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env },
  });

  const [, stderr, exitCode] = await Promise.all([
    readAgentRunStream(proc.stdout, "stdout", onOutput),
    readAgentRunStream(proc.stderr, "stderr", onOutput),
    proc.exited,
  ]);

  if (exitCode !== 0) {
    throw new Error(
      stderr.trim() || `Agent command exited with code ${exitCode}`
    );
  }

  const branch = await getGitBranch(cwd);
  const commits = await getNewCommits(cwd, headBefore);

  return { branch, commits };
}

async function readAgentRunStream(
  stream: ReadableStream<Uint8Array> | null,
  streamName: "stdout" | "stderr",
  onOutput?: (output: {
    stream: "stdout" | "stderr";
    text: string;
  }) => Promise<void>
) {
  if (!stream) return "";

  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let fullText = "";

  try {
    while (true) {
      const chunk = await reader.read();

      if (chunk.done) {
        fullText += decoder.decode();
        break;
      }

      const text = decoder.decode(chunk.value, { stream: true });
      fullText += text;

      if (text && onOutput) {
        await onOutput({ stream: streamName, text });
      }
    }
  } finally {
    reader.releaseLock();
  }

  return fullText;
}

async function getGitHead(cwd: string): Promise<string | null> {
  try {
    const proc = Bun.spawn(["git", "rev-parse", "HEAD"], {
      cwd,
      stdout: "pipe",
      stderr: "pipe",
    });
    await proc.exited;
    const out = await new Response(proc.stdout).text();
    return out.trim() || null;
  } catch {
    return null;
  }
}

async function getGitBranch(cwd: string): Promise<string | null> {
  try {
    const proc = Bun.spawn(["git", "rev-parse", "--abbrev-ref", "HEAD"], {
      cwd,
      stdout: "pipe",
      stderr: "pipe",
    });
    await proc.exited;
    const out = await new Response(proc.stdout).text();
    const branch = out.trim();
    return branch && branch !== "HEAD" ? branch : null;
  } catch {
    return null;
  }
}

async function getNewCommits(
  cwd: string,
  headBefore: string | null
): Promise<string[]> {
  if (!headBefore) return [];
  try {
    const proc = Bun.spawn(
      ["git", "log", `${headBefore}..HEAD`, "--oneline"],
      { cwd, stdout: "pipe", stderr: "pipe" }
    );
    await proc.exited;
    const out = await new Response(proc.stdout).text();
    return out
      .trim()
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

const triggerSchema = v.object({
  projectId: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, "Project ID is required.")
  ),
});

export type TriggerRunResult =
  | { ok: true; run: AgentRun }
  | { ok: false; conflict: true }
  | { ok: false; conflict: false; error: string };

export const triggerAgentRun = form(
  triggerSchema,
  async ({ projectId }): Promise<TriggerRunResult> => {
    const { db } = getRequestEvent().locals;

    const project = listProjects(db).find((p) => p.id === projectId);
    if (!project) {
      return { ok: false, conflict: false, error: "Project not found." };
    }

    const configResult = await readProjectConfig(project.localPath);
    if (!configResult.ok) {
      return {
        ok: false,
        conflict: false,
        error: configResult.missing
          ? "No .sandfactory/config.yaml found — cannot trigger an Agent Run."
          : `Project Config is invalid: ${configResult.errors.join("; ")}`,
      };
    }

    if (!configResult.config.agent?.command) {
      return {
        ok: false,
        conflict: false,
        error:
          "No agent.command declared in .sandfactory/config.yaml — cannot trigger an Agent Run.",
      };
    }

    const result = await startAgentRun({
      db,
      projectId: project.id,
      agentCommand: configResult.config.agent.command,
      projectPath: project.localPath,
      execute: realExecute as ExecuteFn,
    });

    if (!result.ok) {
      return result;
    }

    // Fire and forget — execution updates DB in background
    result.execution.catch((err: unknown) => {
      console.error("[agent-run] background execution error:", err);
    });

    // Refresh the page query so the new run appears immediately
    await getProjectDetail(project.id).refresh();

    return { ok: true, run: result.run };
  }
);

// ---------------------------------------------------------------------------
// Generate Project Config
// ---------------------------------------------------------------------------

const generateSchema = v.object({
  projectId: v.pipe(v.string(), v.trim(), v.minLength(1)),
  dockerfilePath: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, "Enter a Dockerfile path.")
  ),
  port: v.pipe(
    v.string(),
    v.trim(),
    v.transform((v) => Number(v)),
    v.integer("Port must be a whole number."),
    v.minValue(1, "Port must be at least 1."),
    v.maxValue(65535, "Port must be at most 65535.")
  ),
  agentCommand: v.optional(v.pipe(v.string(), v.trim())),
});

export type GenerateFormResult =
  | { ok: true }
  | { ok: false; error: string };

export const generateProjectConfigForm = form(
  generateSchema,
  async ({
    projectId,
    dockerfilePath,
    port,
    agentCommand,
  }): Promise<GenerateFormResult> => {
    const { db } = getRequestEvent().locals;

    const project = listProjects(db).find((p) => p.id === projectId);
    if (!project) {
      return { ok: false, error: "Project not found." };
    }

    const result = await generateProjectConfig({
      localPath: project.localPath,
      dockerfilePath,
      port,
      agentCommand: agentCommand || undefined,
    });

    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    // Refresh the page query so the new config is shown immediately
    await getProjectDetail(project.id).refresh();

    return { ok: true };
  }
);
