import { test as teardown } from "@playwright/test";
import { rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const databasePath = join(__dirname, "../../../../.data/e2e.sqlite");

/**
 * Project-based teardown removes the throwaway SQLite database.
 */
teardown("global teardown", async () => {
  rmSync(databasePath, { force: true });
  console.log("\n🧹 E2E test teardown complete.\n");
});
