import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export type GenerateConfigInput = {
  localPath: string;
  dockerfilePath: string;
  port: number;
  agentCommand?: string;
};

export type GenerateConfigResult =
  | { ok: true }
  | { ok: false; error: string };

const SANDCASTLE_DIR = ".sandcastle";
const CONFIG_FILE = "config.yaml";

function buildConfigYaml(input: GenerateConfigInput): string {
  const lines: string[] = [
    "apps:",
    `  - dockerfile_path: ${input.dockerfilePath}`,
    `    port: ${input.port}`,
  ];

  if (input.agentCommand) {
    lines.push("agent:");
    lines.push(`  command: ${input.agentCommand}`);
  }

  return lines.join("\n") + "\n";
}

export async function generateProjectConfig(
  input: GenerateConfigInput
): Promise<GenerateConfigResult> {
  if (!existsSync(input.localPath)) {
    return {
      ok: false,
      error: `Project directory does not exist: ${input.localPath}`,
    };
  }

  const sandcastleDir = join(input.localPath, SANDCASTLE_DIR);
  await mkdir(sandcastleDir, { recursive: true });

  const configPath = join(sandcastleDir, CONFIG_FILE);
  await writeFile(configPath, buildConfigYaml(input), "utf-8");

  return { ok: true };
}

/**
 * Scans the project directory for Dockerfiles (up to depth 3, skipping
 * .sandcastle/, node_modules/, and .git/) and returns their paths relative
 * to `localPath`.
 */
export async function detectDockerfiles(localPath: string): Promise<string[]> {
  const glob = new Bun.Glob("**/{Dockerfile,Containerfile}");

  const results: string[] = [];

  for await (const file of glob.scan({ cwd: localPath, dot: false })) {
    // Exclude anything inside .sandcastle/, node_modules/, or .git/
    const parts = file.split("/");
    const excluded = [".sandcastle", "node_modules", ".git"];
    if (parts.some((p) => excluded.includes(p))) continue;

    // Honour the depth limit (max 3 directory levels deep)
    if (parts.length > 4) continue; // e.g. a/b/c/Dockerfile = 4 parts

    results.push(file);
  }

  return results.sort();
}
