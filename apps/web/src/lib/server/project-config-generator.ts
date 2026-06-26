import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export { detectDockerfiles } from "./project-onboarding";

export type GenerateConfigInput = {
  localPath: string;
  dockerfilePath: string;
  port: number;
  agentCommand?: string;
};

export type GenerateConfigResult =
  | { ok: true }
  | { ok: false; error: string };

const SANDFACTORY_DIR = ".sandfactory";
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

  const sandfactoryDir = join(input.localPath, SANDFACTORY_DIR);
  await mkdir(sandfactoryDir, { recursive: true });

  const configPath = join(sandfactoryDir, CONFIG_FILE);
  await writeFile(configPath, buildConfigYaml(input), "utf-8");

  return { ok: true };
}
