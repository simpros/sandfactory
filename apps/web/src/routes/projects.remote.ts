import { mkdir } from "node:fs/promises";

import { form, getRequestEvent, query } from "$app/server";
import * as v from "valibot";

import { readProjectConfig, type ReadResult } from "$lib/server/project-config";
import { readSetupStatus } from "$lib/server/setup";
import {
  listProjects,
  registerProjectFromRemoteUrl,
  type CloneFn,
  type Project,
} from "$lib/server/projects";

const registerSchema = v.object({
  remoteUrl: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, "Enter a Git URL.")
  ),
  overwrite: v.optional(
    v.pipe(
      v.string(),
      v.transform((value) => value === "true" || value === "on")
    ),
    "false"
  ),
});

async function realGitClone({
  remoteUrl,
  targetPath,
}: {
  remoteUrl: string;
  targetPath: string;
}) {
  const proc = Bun.spawn(["git", "clone", "--", remoteUrl, targetPath], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stderr, exitCode] = await Promise.all([
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  if (exitCode !== 0) {
    throw new Error(
      stderr.trim() || `git clone exited with code ${exitCode}`
    );
  }
}

async function fakeClone({
  targetPath,
}: {
  remoteUrl: string;
  targetPath: string;
}) {
  await mkdir(targetPath, { recursive: true });
}

function selectCloner(): CloneFn {
  if (process.env.SANDFACTORY_FAKE_CLONE === "1") return fakeClone;
  return realGitClone;
}

export type ProjectWithConfig = Project & { config: ReadResult };

export const listRegisteredProjects = query(async (): Promise<ProjectWithConfig[]> => {
  const { db } = getRequestEvent().locals;
  return Promise.all(
    listProjects(db).map(async (project) => ({
      ...project,
      config: await readProjectConfig(project.localPath),
    }))
  );
});

export const registerRemoteProject = form(
  registerSchema,
  async ({ remoteUrl, overwrite }) => {
    const { db } = getRequestEvent().locals;
    const status = readSetupStatus(db);

    if (!status.settings) {
      return {
        ok: false as const,
        error: "Sandfactory is not configured.",
      };
    }

    const result = await registerProjectFromRemoteUrl({
      clone: selectCloner(),
      db,
      remoteUrl,
      repoRoot: status.settings.repoRoot,
      overwrite: overwrite === true,
    });

    if (!result.ok) {
      if (result.conflict) {
        return {
          ok: false as const,
          conflict: true as const,
          reason: result.reason,
          name: result.name,
          localPath: result.localPath,
          remoteUrl,
        };
      }
      return {
        ok: false as const,
        conflict: false as const,
        error: result.error,
      };
    }

    await listRegisteredProjects().refresh();
    return { ok: true as const, project: result.project };
  }
);
