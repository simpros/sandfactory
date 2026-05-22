import { afterEach, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { createDb, settings } from "./index";

const createdDirectories: string[] = [];

afterEach(() => {
  while (createdDirectories.length > 0) {
    const directory = createdDirectories.pop();

    if (directory) {
      rmSync(directory, { force: true, recursive: true });
    }
  }
});

test("db setup runs migrations and exposes a usable Drizzle client", () => {
  const directory = mkdtempSync(join(tmpdir(), "sandfactory-db-"));
  createdDirectories.push(directory);

  const database = createDb(join(directory, "sandfactory.sqlite"));

  database.db.insert(settings)
    .values({
      key: "base_url",
      value: "https://sandfactory.test",
      updatedAt: new Date().toISOString(),
    })
    .run();

  const row = database.db
    .select({ key: settings.key, value: settings.value })
    .from(settings)
    .all();

  expect(row).toEqual([
    {
      key: "base_url",
      value: "https://sandfactory.test",
    },
  ]);

  database.close();
});

test("db setup still finds migrations when called from a nested app directory", () => {
  const originalCwd = process.cwd();
  const directory = mkdtempSync(join(tmpdir(), "sandfactory-db-nested-"));
  createdDirectories.push(directory);

  process.chdir(join(originalCwd, "apps/web"));

  try {
    const database = createDb(join(directory, "sandfactory.sqlite"));

    const tables = database.sqlite
      .query("select name from sqlite_master where type = 'table' and name = 'settings'")
      .all();

    expect(tables).toEqual([{ name: "settings" }]);

    database.close();
  } finally {
    process.chdir(originalCwd);
  }
});
