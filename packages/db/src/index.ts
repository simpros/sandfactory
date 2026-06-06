import { Database } from "bun:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

import * as dbSchema from "./schema";

function resolveRepoRoot() {
  for (const startPath of [process.cwd(), import.meta.dirname]) {
    let currentPath = resolve(startPath);

    while (true) {
      if (existsSync(resolve(currentPath, "packages/db/drizzle"))) {
        return currentPath;
      }

      const parentPath = dirname(currentPath);

      if (parentPath === currentPath) {
        break;
      }

      currentPath = parentPath;
    }
  }

  return resolve(import.meta.dirname, "../../..");
}

const REPO_ROOT = resolveRepoRoot();
const DEFAULT_DATABASE_URL = "file:.data/sandfactory.sqlite";
const MIGRATIONS_FOLDER = resolve(REPO_ROOT, "packages/db/drizzle");

// Track which DB files have had migrations applied this process lifetime.
const migratedDbs = new Set<string>();

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

  const db = drizzle<typeof dbSchema.schema, typeof dbSchema.relations>({
    client: sqlite,
    schema: dbSchema.schema,
    relations: dbSchema.relations,
  });

  if (!migratedDbs.has(databaseFilePath)) {
    migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
    migratedDbs.add(databaseFilePath);
  }

  return {
    db,
    databaseFilePath,
    sqlite,
    close() {
      sqlite.close();
    },
  };
}

export type Db = ReturnType<typeof createDb>;

export { dbSchema as schema };
export * from "./schema";
