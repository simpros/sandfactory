import { test as setup } from "@playwright/test";
import { execSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const databaseUrl = "file:.data/e2e.sqlite";

/**
 * Project-based setup: create a clean SQLite database before tests.
 */
setup("global setup", async () => {
  console.log("\n🚀 Running E2E setup...\n");

  const setupScript = join(__dirname, "setup-db.ts");
  execSync(`bun run ${setupScript}`, {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });

  console.log("🎉 E2E test setup complete!\n");
});
