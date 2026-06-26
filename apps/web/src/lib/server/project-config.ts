import { join } from "node:path";

export type AppConfig = {
  dockerfile_path: string;
  port: number;
};

export type ServiceConfig = {
  mode: "shared" | "dedicated";
  data: "fork" | "seed";
  inject_as: string;
};

export type AgentConfig = {
  command: string;
};

export type ProjectConfig = {
  apps: AppConfig[];
  services: ServiceConfig[];
  auto_deploy: boolean;
  agent?: AgentConfig;
};

export type ParseResult =
  | { ok: true; config: ProjectConfig }
  | { ok: false; errors: string[] };

export type ReadResult =
  | { ok: true; config: ProjectConfig }
  | { ok: false; missing: true; errors: string[] }
  | { ok: false; missing: false; errors: string[] };

export function parseProjectConfig(raw: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = Bun.YAML.parse(raw);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, errors: [`YAML parse error: ${message}`] };
  }

  const errors: string[] = [];

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, errors: ["Config must be a YAML mapping."] };
  }

  const doc = parsed as Record<string, unknown>;

  // Validate apps
  if (!("apps" in doc)) {
    errors.push("apps: required field is missing.");
  } else if (!Array.isArray(doc.apps)) {
    errors.push("apps: must be a list.");
  } else if (doc.apps.length === 0) {
    errors.push("apps: must declare at least one app.");
  }

  const apps: AppConfig[] = [];
  if (Array.isArray(doc.apps)) {
    for (let i = 0; i < doc.apps.length; i++) {
      const app = doc.apps[i] as Record<string, unknown> | null;
      if (!app || typeof app !== "object") {
        errors.push(`apps[${i}]: must be a mapping.`);
        continue;
      }
      if (!("dockerfile_path" in app) || typeof app.dockerfile_path !== "string" || !app.dockerfile_path.trim()) {
        errors.push(`apps[${i}].dockerfile_path: required string field is missing or empty.`);
      }
      if (!("port" in app)) {
        errors.push(`apps[${i}].port: required field is missing.`);
      } else if (typeof app.port !== "number" || !Number.isInteger(app.port) || app.port < 1) {
        errors.push(`apps[${i}].port: must be a positive integer.`);
      }
      if (
        typeof app.dockerfile_path === "string" &&
        app.dockerfile_path.trim() &&
        typeof app.port === "number" &&
        Number.isInteger(app.port) &&
        app.port >= 1
      ) {
        apps.push({ dockerfile_path: app.dockerfile_path, port: app.port });
      }
    }
  }

  // Validate services (optional, defaults to [])
  const services: ServiceConfig[] = [];
  if ("services" in doc) {
    if (!Array.isArray(doc.services)) {
      errors.push("services: must be a list.");
    } else {
      for (let i = 0; i < doc.services.length; i++) {
        const svc = doc.services[i] as Record<string, unknown> | null;
        if (!svc || typeof svc !== "object") {
          errors.push(`services[${i}]: must be a mapping.`);
          continue;
        }
        let svcOk = true;
        if (svc.mode !== "shared" && svc.mode !== "dedicated") {
          errors.push(`services[${i}].mode: must be "shared" or "dedicated", got "${svc.mode}".`);
          svcOk = false;
        }
        if (svc.data !== "fork" && svc.data !== "seed") {
          errors.push(`services[${i}].data: must be "fork" or "seed", got "${svc.data}".`);
          svcOk = false;
        }
        if (!("inject_as" in svc) || typeof svc.inject_as !== "string" || !svc.inject_as.trim()) {
          errors.push(`services[${i}].inject_as: required string field is missing or empty.`);
          svcOk = false;
        }
        if (svcOk) {
          services.push({
            mode: svc.mode as "shared" | "dedicated",
            data: svc.data as "fork" | "seed",
            inject_as: svc.inject_as as string,
          });
        }
      }
    }
  }

  // Validate auto_deploy (optional, defaults to false)
  let auto_deploy = false;
  if ("auto_deploy" in doc) {
    if (typeof doc.auto_deploy !== "boolean") {
      errors.push(`auto_deploy: must be a boolean (true or false).`);
    } else {
      auto_deploy = doc.auto_deploy;
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  // Validate agent (optional)
  let agent: AgentConfig | undefined;
  if ("agent" in doc) {
    const agentRaw = doc.agent;
    if (agentRaw === null || typeof agentRaw !== "object" || Array.isArray(agentRaw)) {
      errors.push("agent: must be a mapping.");
    } else {
      const agentDoc = agentRaw as Record<string, unknown>;
      if (!("command" in agentDoc) || typeof agentDoc.command !== "string" || !agentDoc.command.trim()) {
        errors.push("agent.command: required string field is missing or empty.");
      } else {
        agent = { command: agentDoc.command };
      }
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, config: { apps, services, auto_deploy, agent } };
}

const CONFIG_RELATIVE_PATH = join(".sandfactory", "config.yaml");

export async function readProjectConfig(localPath: string): Promise<ReadResult> {
  const configPath = join(localPath, CONFIG_RELATIVE_PATH);
  let raw: string;
  try {
    raw = await Bun.file(configPath).text();
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return { ok: false, missing: true, errors: [`.sandfactory/config.yaml not found in project.`] };
    }
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, missing: false, errors: [`Could not read config: ${message}`] };
  }

  const result = parseProjectConfig(raw);
  if (!result.ok) {
    return { ok: false, missing: false, errors: result.errors };
  }
  return { ok: true, config: result.config };
}
