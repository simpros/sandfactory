import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { parseProjectConfig, readProjectConfig } from "./project-config";

// ---------------------------------------------------------------------------
// parseProjectConfig — pure parsing/validation
// ---------------------------------------------------------------------------

describe("parseProjectConfig", () => {
  test("parses a valid config with apps, services, and auto_deploy", () => {
    const yaml = `
apps:
  - dockerfile_path: apps/web/Dockerfile
    port: 3000
  - dockerfile_path: apps/admin/Dockerfile
    port: 4000
services:
  - mode: shared
    data: fork
    inject_as: DATABASE_URL
  - mode: dedicated
    data: seed
    inject_as: REDIS_URL
auto_deploy: true
`;
    const result = parseProjectConfig(yaml);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");

    expect(result.config.apps).toEqual([
      { dockerfile_path: "apps/web/Dockerfile", port: 3000 },
      { dockerfile_path: "apps/admin/Dockerfile", port: 4000 },
    ]);
    expect(result.config.services).toEqual([
      { mode: "shared", data: "fork", inject_as: "DATABASE_URL" },
      { mode: "dedicated", data: "seed", inject_as: "REDIS_URL" },
    ]);
    expect(result.config.auto_deploy).toBe(true);
  });

  test("parses a minimal valid config with one app and no services", () => {
    const yaml = `
apps:
  - dockerfile_path: Dockerfile
    port: 8080
`;
    const result = parseProjectConfig(yaml);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.config.apps).toHaveLength(1);
    expect(result.config.services).toEqual([]);
    expect(result.config.auto_deploy).toBe(false);
  });

  test("returns an error when apps is missing", () => {
    const yaml = `
services:
  - mode: shared
    data: fork
    inject_as: DATABASE_URL
`;
    const result = parseProjectConfig(yaml);

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.errors.some((e: string) => /apps/i.test(e))).toBe(true);
  });

  test("returns an error when an app is missing dockerfile_path", () => {
    const yaml = `
apps:
  - port: 3000
`;
    const result = parseProjectConfig(yaml);

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.errors.some((e: string) => /dockerfile_path/i.test(e))).toBe(true);
  });

  test("returns an error when an app is missing port", () => {
    const yaml = `
apps:
  - dockerfile_path: Dockerfile
`;
    const result = parseProjectConfig(yaml);

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.errors.some((e: string) => /port/i.test(e))).toBe(true);
  });

  test("returns an error when a service has an invalid mode", () => {
    const yaml = `
apps:
  - dockerfile_path: Dockerfile
    port: 3000
services:
  - mode: exclusive
    data: fork
    inject_as: DATABASE_URL
`;
    const result = parseProjectConfig(yaml);

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.errors.some((e: string) => /mode/i.test(e))).toBe(true);
  });

  test("returns an error when a service has an invalid data strategy", () => {
    const yaml = `
apps:
  - dockerfile_path: Dockerfile
    port: 3000
services:
  - mode: shared
    data: copy
    inject_as: DATABASE_URL
`;
    const result = parseProjectConfig(yaml);

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.errors.some((e: string) => /data/i.test(e))).toBe(true);
  });

  test("returns an error when apps list is empty", () => {
    const yaml = `
apps: []
`;
    const result = parseProjectConfig(yaml);

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.errors.some((e: string) => /apps/i.test(e))).toBe(true);
  });

  test("returns an error for invalid YAML", () => {
    const result = parseProjectConfig("{ bad yaml: [}");

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// readProjectConfig — file I/O
// ---------------------------------------------------------------------------

describe("readProjectConfig", () => {
  test("reads and parses the config from <localPath>/.sandcastle/config.yaml", async () => {
    const dir = mkdtempSync(join(tmpdir(), "sandfactory-cfg-"));
    try {
      mkdirSync(join(dir, ".sandcastle"));
      writeFileSync(
        join(dir, ".sandcastle", "config.yaml"),
        `apps:\n  - dockerfile_path: Dockerfile\n    port: 3000\n`,
      );

      const result = await readProjectConfig(dir);

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error("expected ok");
      expect(result.config.apps[0]?.dockerfile_path).toBe("Dockerfile");
    } finally {
      rmSync(dir, { force: true, recursive: true });
    }
  });

  test("returns a missing-file error when .sandcastle/config.yaml does not exist", async () => {
    const dir = mkdtempSync(join(tmpdir(), "sandfactory-cfg-"));
    try {
      const result = await readProjectConfig(dir);

      expect(result.ok).toBe(false);
      if (result.ok) throw new Error("expected error");
      expect(result.missing).toBe(true);
    } finally {
      rmSync(dir, { force: true, recursive: true });
    }
  });
});
