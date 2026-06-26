import { existsSync } from "node:fs";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type { AppConfig } from "./project-config";
import { parseProjectConfig } from "./project-config";

export type WriteProjectConfigInput = {
  localPath: string;
  apps: AppConfig[];
  agentCommand?: string;
};

export type WriteProjectConfigResult =
  | { ok: true }
  | { ok: false; error: string };

const SANDFACTORY_DIR = ".sandfactory";
const SANDCASTLE_DIR = ".sandcastle";
const CONFIG_FILE = "config.yaml";
const EXCLUDED_DIRECTORIES = new Set([".git", "node_modules", ".sandcastle", ".sandfactory"]);

function buildProjectConfigYaml({ apps, agentCommand }: WriteProjectConfigInput): string {
  const lines = ["apps:"];

  for (const app of apps) {
    lines.push(`  - dockerfile_path: ${app.dockerfile_path}`);
    lines.push(`    port: ${app.port}`);
  }

  if (agentCommand) {
    lines.push("agent:");
    lines.push(`  command: ${agentCommand}`);
  }

  return lines.join("\n") + "\n";
}

export async function writeProjectConfig(
  input: WriteProjectConfigInput
): Promise<WriteProjectConfigResult> {
  if (!existsSync(input.localPath)) {
    return {
      ok: false,
      error: `Project directory does not exist: ${input.localPath}`,
    };
  }

  const configDir = join(input.localPath, SANDFACTORY_DIR);
  await mkdir(configDir, { recursive: true });

  const yaml = buildProjectConfigYaml(input);
  const parseResult = parseProjectConfig(yaml);
  if (!parseResult.ok) {
    return {
      ok: false,
      error: `Generated config is invalid: ${parseResult.errors.join("; ")}`,
    };
  }

  await writeFile(join(configDir, CONFIG_FILE), yaml, "utf-8");
  return { ok: true };
}

export async function detectDockerfiles(localPath: string): Promise<string[]> {
  const glob = new Bun.Glob("**/Dockerfile");
  const results: string[] = [];

  for await (const file of glob.scan({ cwd: localPath, dot: false })) {
    const parts = file.split("/");
    if (parts.some((part) => EXCLUDED_DIRECTORIES.has(part))) {
      continue;
    }

    results.push(file);
  }

  return results.sort();
}

export async function checkSandcastleInitialized(
  localPath: string
): Promise<{ initialized: boolean }> {
  const sandcastlePath = join(localPath, SANDCASTLE_DIR);

  if (!existsSync(sandcastlePath)) {
    return { initialized: false };
  }

  const entries = await readdir(sandcastlePath);
  return { initialized: entries.length > 0 };
}
