import { test as setup } from "@playwright/test";
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

setup("global setup", async () => {
  const databasePath = resolveDatabasePath(databaseUrl);
  mkdirSync(dirname(databasePath), { recursive: true });
  rmSync(databasePath, { force: true });
  console.log(`📊 Prepared SQLite database at ${databasePath}`);
});
