import { randomUUID } from "node:crypto";
import { existsSync, rmSync } from "node:fs";
import { homedir } from "node:os";

import type { Db } from "@sandfactory/db";
import { projects } from "@sandfactory/db";
import { eq, or } from "drizzle-orm";

export type Project = {
  id: string;
  name: string;
  remoteUrl: string | null;
  localPath: string;
  createdAt: string;
};

export type CloneFn = (input: {
  remoteUrl: string;
  targetPath: string;
}) => Promise<void>;

export type RegisterRemoteInput = {
  clone: CloneFn;
  db: Db["db"];
  remoteUrl: string;
  repoRoot: string;
  overwrite?: boolean;
};

export type RegisterResult =
  | { ok: true; project: Project }
  | { ok: false; conflict: false; error: string }
  | {
      ok: false;
      conflict: true;
      reason: "directory-exists" | "already-registered";
      name: string;
      localPath: string;
    };

const REPO_NAME_PATTERN = /([^/:]+?)(?:\.git)?\/?$/;

export function deriveRepoName(remoteUrl: string): string | null {
  const trimmed = remoteUrl.trim();
  if (trimmed.length === 0) return null;
  const match = REPO_NAME_PATTERN.exec(trimmed);
  const name = match?.[1]?.trim();
  if (!name) return null;
  if (!/^[A-Za-z0-9._-]+$/.test(name)) return null;
  return name;
}

function joinPath(base: string, segment: string): string {
  const trimmedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${trimmedBase}/${segment}`;
}

function expandHome(path: string): string {
  if (path === "~") return homedir();
  if (path.startsWith("~/")) return `${homedir()}/${path.slice(2)}`;
  return path;
}

export async function registerProjectFromRemoteUrl({
  clone,
  db,
  remoteUrl,
  repoRoot,
  overwrite = false,
}: RegisterRemoteInput): Promise<RegisterResult> {
  const name = deriveRepoName(remoteUrl);
  if (!name) {
    return { ok: false, conflict: false as const, error: "Could not derive a repo name from the URL." };
  }

  const localPath = joinPath(expandHome(repoRoot), name);

  const existingRow = db
    .select({ id: projects.id })
    .from(projects)
    .where(or(eq(projects.name, name), eq(projects.localPath, localPath)))
    .get();

  if (existingRow && !overwrite) {
    return {
      ok: false,
      conflict: true,
      reason: "already-registered",
      name,
      localPath,
    };
  }

  if (existsSync(localPath) && !overwrite) {
    return {
      ok: false,
      conflict: true,
      reason: "directory-exists",
      name,
      localPath,
    };
  }

  if (overwrite) {
    if (existsSync(localPath)) {
      rmSync(localPath, { force: true, recursive: true });
    }
    if (existingRow) {
      db.delete(projects).where(eq(projects.id, existingRow.id)).run();
    }
  }

  try {
    await clone({ remoteUrl, targetPath: localPath });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    return { ok: false, conflict: false as const, error: `Clone failed: ${message}` };
  }

  const project: Project = {
    id: randomUUID(),
    name,
    remoteUrl,
    localPath,
    createdAt: new Date().toISOString(),
  };

  try {
    db.insert(projects).values(project).run();
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    return { ok: false, conflict: false as const, error: `Could not save project: ${message}` };
  }

  return { ok: true, project };
}

export function listProjects(db: Db["db"]): Project[] {
  return db
    .select({
      id: projects.id,
      name: projects.name,
      remoteUrl: projects.remoteUrl,
      localPath: projects.localPath,
      createdAt: projects.createdAt,
    })
    .from(projects)
    .all();
}
