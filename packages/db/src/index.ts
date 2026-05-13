import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

import * as schema from "./schema";

const REPO_ROOT = resolve(import.meta.dirname, "../../..");
const DEFAULT_DATABASE_URL = "file:.data/sandfactory.sqlite";
const MIGRATIONS_FOLDER = resolve(REPO_ROOT, "packages/db/drizzle");

function resolveDatabasePath(databaseUrl = DEFAULT_DATABASE_URL) {
  if (databaseUrl.startsWith("file:")) {
    return resolve(REPO_ROOT, databaseUrl.slice("file:".length));
  }

  if (databaseUrl.startsWith("sqlite:")) {
    return resolve(REPO_ROOT, databaseUrl.slice("sqlite:".length));
  }

  return resolve(REPO_ROOT, databaseUrl);
}

export function createDb(
  databaseUrl = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL
) {
  const databaseFilePath = resolveDatabasePath(databaseUrl);
  mkdirSync(dirname(databaseFilePath), { recursive: true });

  const sqlite = new Database(databaseFilePath);
  sqlite.run("PRAGMA journal_mode = WAL;");

  const db = drizzle({
    client: sqlite,
    schema,
  });

  migrate(db, {
    migrationsFolder: MIGRATIONS_FOLDER,
  });

  return {
    db,
    databaseFilePath,
    sqlite,
    close() {
      sqlite.close();
    },
  };
}

export { schema };
export * from "./schema";
