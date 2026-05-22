import { mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../../../..");
const databaseUrl = "file:.data/e2e.sqlite";

function resolveDatabasePath(url: string) {
  if (url.startsWith("file:")) return resolve(repoRoot, url.slice("file:".length));
  return resolve(repoRoot, url);
}

function resetSqliteDatabase(databasePath: string) {
  for (const path of [databasePath, `${databasePath}-wal`, `${databasePath}-shm`]) {
    rmSync(path, { force: true });
  }
}

export default async function globalSetup() {
  const databasePath = resolveDatabasePath(databaseUrl);
  mkdirSync(dirname(databasePath), { recursive: true });
  resetSqliteDatabase(databasePath);
  console.log(`📊 Prepared SQLite database at ${databasePath}`);
}
