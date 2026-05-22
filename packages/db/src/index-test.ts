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
