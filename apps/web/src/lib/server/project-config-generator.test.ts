import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { readProjectConfig } from "./project-config";
import { detectDockerfiles, generateProjectConfig } from "./project-config-generator";

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) rmSync(dir, { force: true, recursive: true });
  }
});

function makeTempDir(label: string) {
  const dir = mkdtempSync(join(tmpdir(), `sandfactory-cfg-gen-${label}-`));
  tempDirs.push(dir);
  return dir;
}

// ---------------------------------------------------------------------------
// generateProjectConfig
// ---------------------------------------------------------------------------

describe("generateProjectConfig", () => {
  test("writes a config.yaml that can be read back with the correct app and agent command", async () => {
    const projectDir = makeTempDir("project");

    const result = await generateProjectConfig({
      localPath: projectDir,
      dockerfilePath: "apps/web/Dockerfile",
      port: 3000,
      agentCommand: "npx tsx .sandcastle/main.ts",
    });

    expect(result.ok).toBe(true);

    // Verify by reading it back through the real parser
    const readResult = await readProjectConfig(projectDir);
    expect(readResult.ok).toBe(true);
    if (!readResult.ok) throw new Error("expected ok");

    expect(readResult.config.apps).toEqual([
      { dockerfile_path: "apps/web/Dockerfile", port: 3000 },
    ]);
    expect(readResult.config.agent?.command).toBe("npx tsx .sandcastle/main.ts");
  });

  test("creates the .sandfactory/ directory when it does not already exist", async () => {
    const projectDir = makeTempDir("project");

    // No .sandfactory/ directory yet
    const result = await generateProjectConfig({
      localPath: projectDir,
      dockerfilePath: "Dockerfile",
      port: 8080,
    });

    expect(result.ok).toBe(true);

    const readResult = await readProjectConfig(projectDir);
    expect(readResult.ok).toBe(true);
    if (!readResult.ok) throw new Error("expected ok");
    expect(readResult.config.apps[0]?.port).toBe(8080);
  });

  test("returns an error when the project localPath does not exist on disk", async () => {
    const result = await generateProjectConfig({
      localPath: "/this/path/does/not/exist",
      dockerfilePath: "Dockerfile",
      port: 3000,
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.error).toMatch(/not found|does not exist/i);
  });
});

// ---------------------------------------------------------------------------
// detectDockerfiles
// ---------------------------------------------------------------------------

describe("detectDockerfiles", () => {
  test("returns relative paths to Dockerfiles found in the project", async () => {
    const projectDir = makeTempDir("project");
    mkdirSync(join(projectDir, "apps", "web"), { recursive: true });
    mkdirSync(join(projectDir, "apps", "admin"), { recursive: true });
    writeFileSync(join(projectDir, "apps", "web", "Dockerfile"), "FROM node:20");
    writeFileSync(join(projectDir, "apps", "admin", "Dockerfile"), "FROM node:20");

    const paths = await detectDockerfiles(projectDir);

    expect(paths).toContain("apps/web/Dockerfile");
    expect(paths).toContain("apps/admin/Dockerfile");
  });

  test("returns an empty array when no Dockerfiles exist", async () => {
    const projectDir = makeTempDir("project");

    const paths = await detectDockerfiles(projectDir);

    expect(paths).toEqual([]);
  });
});
