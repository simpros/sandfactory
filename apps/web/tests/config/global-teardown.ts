import { rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const databasePath = join(__dirname, "../../../../.data/e2e.sqlite");

export default async function globalTeardown() {
  for (const path of [databasePath, `${databasePath}-wal`, `${databasePath}-shm`]) {
    rmSync(path, { force: true });
  }

  console.log("\n🧹 E2E test teardown complete.\n");
}
