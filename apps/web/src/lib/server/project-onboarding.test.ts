import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { parseProjectConfig } from "./project-config";
import {
  checkSandcastleInitialized,
  detectDockerfiles,
  writeProjectConfig,
} from "./project-onboarding";

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) rmSync(dir, { force: true, recursive: true });
  }
});

function makeTempDir(label: string) {
  const dir = mkdtempSync(join(tmpdir(), `sandfactory-onboarding-${label}-`));
  tempDirs.push(dir);
  return dir;
}

describe("detectDockerfiles", () => {
  test("returns multiple relative Dockerfile paths", async () => {
    const projectDir = makeTempDir("dockerfiles-many");
    mkdirSync(join(projectDir, "apps", "web"), { recursive: true });
    mkdirSync(join(projectDir, "apps", "api"), { recursive: true });
    writeFileSync(join(projectDir, "Dockerfile"), "FROM node:20");
    writeFileSync(join(projectDir, "apps", "web", "Dockerfile"), "FROM node:20");
    writeFileSync(join(projectDir, "apps", "api", "Dockerfile"), "FROM node:20");

    const paths = await detectDockerfiles(projectDir);

    expect(paths).toEqual([
      "Dockerfile",
      "apps/api/Dockerfile",
      "apps/web/Dockerfile",
    ]);
  });

  test("returns a single relative Dockerfile path", async () => {
    const projectDir = makeTempDir("dockerfiles-one");
    mkdirSync(join(projectDir, "apps", "web"), { recursive: true });
    writeFileSync(join(projectDir, "apps", "web", "Dockerfile"), "FROM node:20");

    const paths = await detectDockerfiles(projectDir);

    expect(paths).toEqual(["apps/web/Dockerfile"]);
  });

  test("returns an empty array when no Dockerfiles exist", async () => {
    const projectDir = makeTempDir("dockerfiles-none");

    const paths = await detectDockerfiles(projectDir);

    expect(paths).toEqual([]);
  });
});

describe("writeProjectConfig", () => {
  test("creates a new .sandfactory/config.yaml that parses cleanly", async () => {
    const projectDir = makeTempDir("config-create");

    const result = await writeProjectConfig({
      localPath: projectDir,
      apps: [
        { dockerfile_path: "apps/web/Dockerfile", port: 3000 },
        { dockerfile_path: "apps/api/Dockerfile", port: 4000 },
      ],
      agentCommand: "npx tsx .sandcastle/main.ts",
    });

    expect(result.ok).toBe(true);

    const raw = await Bun.file(join(projectDir, ".sandfactory", "config.yaml")).text();
    const parseResult = parseProjectConfig(raw);

    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) throw new Error("expected config to parse");

    expect(parseResult.config.apps).toEqual([
      { dockerfile_path: "apps/web/Dockerfile", port: 3000 },
      { dockerfile_path: "apps/api/Dockerfile", port: 4000 },
    ]);
    expect(parseResult.config.agent?.command).toBe("npx tsx .sandcastle/main.ts");
  });

  test("overwrites an existing .sandfactory/config.yaml", async () => {
    const projectDir = makeTempDir("config-overwrite");
    mkdirSync(join(projectDir, ".sandfactory"), { recursive: true });
    writeFileSync(
      join(projectDir, ".sandfactory", "config.yaml"),
      "apps:\n  - dockerfile_path: old/Dockerfile\n    port: 1234\n",
    );

    const result = await writeProjectConfig({
      localPath: projectDir,
      apps: [{ dockerfile_path: "Dockerfile", port: 8080 }],
    });

    expect(result.ok).toBe(true);

    const raw = await Bun.file(join(projectDir, ".sandfactory", "config.yaml")).text();
    const parseResult = parseProjectConfig(raw);

    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) throw new Error("expected config to parse");

    expect(parseResult.config.apps).toEqual([
      { dockerfile_path: "Dockerfile", port: 8080 },
    ]);
  });
});

describe("checkSandcastleInitialized", () => {
  test("returns initialized true when .sandcastle contains files", async () => {
    const projectDir = makeTempDir("sandcastle-ready");
    mkdirSync(join(projectDir, ".sandcastle"), { recursive: true });
    writeFileSync(join(projectDir, ".sandcastle", "main.ts"), "export {};\n");

    const result = await checkSandcastleInitialized(projectDir);

    expect(result).toEqual({ initialized: true });
  });

  test("returns initialized false when .sandcastle is missing", async () => {
    const projectDir = makeTempDir("sandcastle-missing");

    const result = await checkSandcastleInitialized(projectDir);

    expect(result).toEqual({ initialized: false });
  });

  test("returns initialized false when .sandcastle exists but is empty", async () => {
    const projectDir = makeTempDir("sandcastle-empty");
    mkdirSync(join(projectDir, ".sandcastle"), { recursive: true });

    const result = await checkSandcastleInitialized(projectDir);

    expect(result).toEqual({ initialized: false });
  });
});
