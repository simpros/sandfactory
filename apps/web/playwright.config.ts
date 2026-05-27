import { defineConfig, devices } from "@playwright/test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3000);
const BASE_URL = `http://localhost:${PORT}`;
const HEALTHCHECK_URL = `${BASE_URL}/api/healthz`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  globalTeardown: "./tests/config/global-teardown.ts",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    contextOptions: {
      reducedMotion: "reduce",
    },
  },
  projects: [
    {
      name: "chromium",
      testMatch: /-e2e\.ts$/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `bun ./tests/config/setup-db.ts && bun run ${join(__dirname, "build/index.js")}`,
    url: HEALTHCHECK_URL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: "file:.data/e2e.sqlite",
      PORT: String(PORT),
      ORIGIN: BASE_URL,
    },
  },
});
