import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";

import { createDb } from "@sandfactory/db";

import { listProjects, registerProjectFromRemoteUrl } from "./projects";

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
  const dbDir = makeTempDir("projects-db");
  const repoRoot = makeTempDir("projects-root");
  const database = createDb(join(dbDir, "sandfactory.sqlite"));
  tempDirs.push(database.databaseFilePath);
  return { db: database.db, repoRoot, close: () => database.close() };
}

describe("registerProjectFromRemoteUrl", () => {
  test("clones into <repo-root>/<repo-name> and lists the project on the dashboard", async () => {
    const { db, repoRoot, close } = setupHarness();

    try {
      const cloneCalls: Array<{ remoteUrl: string; targetPath: string }> = [];
      const clone = async ({
        remoteUrl,
        targetPath,
      }: {
        remoteUrl: string;
        targetPath: string;
      }) => {
        cloneCalls.push({ remoteUrl, targetPath });
      };

      const result = await registerProjectFromRemoteUrl({
        clone,
        db,
        remoteUrl: "git@github.com:simpros/sandfactory.git",
        repoRoot,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error("expected ok");

      expect(result.project.name).toBe("sandfactory");
      expect(result.project.remoteUrl).toBe(
        "git@github.com:simpros/sandfactory.git",
      );
      expect(result.project.localPath).toBe(join(repoRoot, "sandfactory"));

      expect(cloneCalls).toEqual([
        {
          remoteUrl: "git@github.com:simpros/sandfactory.git",
          targetPath: join(repoRoot, "sandfactory"),
        },
      ]);

      const projects = listProjects(db);
      expect(projects).toHaveLength(1);
      expect(projects[0]?.name).toBe("sandfactory");
      expect(projects[0]?.remoteUrl).toBe(
        "git@github.com:simpros/sandfactory.git",
      );
      expect(projects[0]?.localPath).toBe(join(repoRoot, "sandfactory"));
    } finally {
      close();
    }
  });

  test("returns an error and persists nothing when the clone fails", async () => {
    const { db, repoRoot, close } = setupHarness();

    try {
      const clone = async () => {
        throw new Error("authentication failed");
      };

      const result = await registerProjectFromRemoteUrl({
        clone,
        db,
        remoteUrl: "git@github.com:simpros/sandfactory.git",
        repoRoot,
      });

      expect(result.ok).toBe(false);
      if (result.ok) throw new Error("expected failure");
      if (result.conflict) throw new Error("expected non-conflict error");
      expect(result.error).toContain("authentication failed");

      expect(listProjects(db)).toEqual([]);
    } finally {
      close();
    }
  });

  test("rejects URLs from which no usable repo name can be derived", async () => {
    const { db, repoRoot, close } = setupHarness();

    try {
      const clone = async () => {
        throw new Error("clone should not be called");
      };

      const result = await registerProjectFromRemoteUrl({
        clone,
        db,
        remoteUrl: "not a url",
        repoRoot,
      });

      expect(result.ok).toBe(false);
      if (result.ok) throw new Error("expected failure");
      if (result.conflict) throw new Error("expected non-conflict error");
      expect(result.error).toMatch(/repo name/i);
      expect(listProjects(db)).toEqual([]);
    } finally {
      close();
    }
  });

  test("expands a leading ~ in the repo root to the user's home directory", async () => {
    const { db, close } = setupHarness();

    try {
      const cloneCalls: Array<{ targetPath: string }> = [];
      const clone = async ({ targetPath }: { targetPath: string }) => {
        cloneCalls.push({ targetPath });
      };

      const result = await registerProjectFromRemoteUrl({
        clone,
        db,
        remoteUrl: "git@github.com:simpros/sandfactory.git",
        repoRoot: "~/projects",
      });

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error("expected ok");

      const expected = join(homedir(), "projects", "sandfactory");
      expect(cloneCalls).toEqual([{ targetPath: expected }]);
      expect(result.project.localPath).toBe(expected);
    } finally {
      close();
    }
  });

  test("reports a conflict when the target directory already exists on disk", async () => {
    const { db, repoRoot, close } = setupHarness();

    try {
      mkdirSync(join(repoRoot, "sandfactory"));

      let cloneCalled = false;
      const clone = async () => {
        cloneCalled = true;
      };

      const result = await registerProjectFromRemoteUrl({
        clone,
        db,
        remoteUrl: "git@github.com:simpros/sandfactory.git",
        repoRoot,
      });

      expect(result.ok).toBe(false);
      if (result.ok) throw new Error("expected failure");
      if (!result.conflict) throw new Error("expected conflict");
      expect(result.conflict).toBe(true);
      expect(result.reason).toBe("directory-exists");
      expect(cloneCalled).toBe(false);
      expect(listProjects(db)).toEqual([]);
    } finally {
      close();
    }
  });

  test("reports a conflict when a project with that name is already registered", async () => {
    const { db, repoRoot, close } = setupHarness();

    try {
      const clone = async () => {};
      const first = await registerProjectFromRemoteUrl({
        clone,
        db,
        remoteUrl: "git@github.com:simpros/sandfactory.git",
        repoRoot,
      });
      expect(first.ok).toBe(true);

      // Remove the directory so the disk check passes; only the DB row remains.
      rmSync(join(repoRoot, "sandfactory"), { force: true, recursive: true });

      let cloneCalls = 0;
      const cloneAgain = async () => {
        cloneCalls += 1;
      };

      const result = await registerProjectFromRemoteUrl({
        clone: cloneAgain,
        db,
        remoteUrl: "git@github.com:simpros/sandfactory.git",
        repoRoot,
      });

      expect(result.ok).toBe(false);
      if (result.ok) throw new Error("expected failure");
      if (!result.conflict) throw new Error("expected conflict");
      expect(result.conflict).toBe(true);
      expect(result.reason).toBe("already-registered");
      expect(cloneCalls).toBe(0);
      expect(listProjects(db)).toHaveLength(1);
    } finally {
      close();
    }
  });

  test("overwrite=true deletes the existing directory and replaces the registered project", async () => {
    const { db, repoRoot, close } = setupHarness();

    try {
      const targetPath = join(repoRoot, "sandfactory");

      // First registration: create the directory + the DB row honestly.
      const first = await registerProjectFromRemoteUrl({
        clone: async ({ targetPath: tp }) => {
          mkdirSync(tp, { recursive: true });
          writeFileSync(join(tp, "stale.txt"), "old content");
        },
        db,
        remoteUrl: "git@github.com:simpros/sandfactory.git",
        repoRoot,
      });
      expect(first.ok).toBe(true);
      expect(existsSync(join(targetPath, "stale.txt"))).toBe(true);
      expect(listProjects(db)).toHaveLength(1);

      // Second registration with overwrite=true.
      const cloneCalls: Array<{ targetPath: string }> = [];
      const clone = async ({ targetPath: tp }: { targetPath: string }) => {
        cloneCalls.push({ targetPath: tp });
        mkdirSync(tp, { recursive: true });
        writeFileSync(join(tp, "fresh.txt"), "fresh content");
      };

      const result = await registerProjectFromRemoteUrl({
        clone,
        db,
        remoteUrl: "git@github.com:simpros/sandfactory.git",
        repoRoot,
        overwrite: true,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error("expected ok");

      expect(cloneCalls).toEqual([{ targetPath }]);
      expect(existsSync(join(targetPath, "stale.txt"))).toBe(false);
      expect(existsSync(join(targetPath, "fresh.txt"))).toBe(true);

      const rows = listProjects(db);
      expect(rows).toHaveLength(1);
      expect(rows[0]?.localPath).toBe(targetPath);
    } finally {
      close();
    }
  });
});
