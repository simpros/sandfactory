import { defineConfig } from "drizzle-kit";
import { resolve } from "node:path";

const REPO_ROOT = resolve(import.meta.dirname, "../..");

const databaseUrl =
  process.env.DATABASE_URL ?? "file:.data/sandfactory.sqlite";

function resolveDatabasePath(url: string) {
  if (url.startsWith("file:")) {
    return resolve(REPO_ROOT, url.slice("file:".length));
  }

  if (url.startsWith("sqlite:")) {
    return resolve(REPO_ROOT, url.slice("sqlite:".length));
  }

  return resolve(REPO_ROOT, url);
}

export default defineConfig({
  schema: ["./src/schema.ts"],
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: resolveDatabasePath(databaseUrl),
  },
});
