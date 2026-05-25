import { mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "../../../..");

function resolveDatabasePath(databaseUrl: string) {
  if (databaseUrl.startsWith("file:")) {
    return resolve(repoRoot, databaseUrl.slice("file:".length));
  }

  return resolve(repoRoot, databaseUrl);
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for e2e setup.");
}

const databasePath = resolveDatabasePath(databaseUrl);

mkdirSync(dirname(databasePath), { recursive: true });

for (const path of [databasePath, `${databasePath}-wal`, `${databasePath}-shm`]) {
  rmSync(path, { force: true });
}

console.log(`📊 Prepared SQLite database at ${databasePath}`);
console.log("✅ Setup complete\n");
