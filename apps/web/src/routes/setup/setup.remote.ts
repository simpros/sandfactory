import { createHash, randomBytes } from "node:crypto";
import { invalid } from "@sveltejs/kit";
import { command, form, query } from "$app/server";
import { desc } from "drizzle-orm";
import { createDb, apiTokens, settings } from "@sandfactory/db";
import * as v from "valibot";

const setupSchema = v.object({
  baseUrl: v.pipe(v.string(), v.trim(), v.url("Enter a valid URL.")),
  repoRoot: v.pipe(v.string(), v.trim(), v.minLength(1, "Enter a repo root path.")),
});

type SetupSettings = {
  baseUrl: string;
  repoRoot: string;
};

function mapSettings(rows: Array<{ key: string; value: string }>): SetupSettings | null {
  const values = new Map(rows.map((row) => [row.key, row.value]));
  const baseUrl = values.get("base_url");
  const repoRoot = values.get("repo_root");

  if (!baseUrl || !repoRoot) {
    return null;
  }

  return { baseUrl, repoRoot };
}

function getSetupStatusSnapshot() {
  const database = createDb();

  try {
    const rows = database.db
      .select({ key: settings.key, value: settings.value })
      .from(settings)
      .all();

    const currentSettings = mapSettings(rows);

    return {
      settings: currentSettings,
      setupComplete: currentSettings !== null,
    };
  } finally {
    database.close();
  }
}

function generateApiToken() {
  return `sf_${randomBytes(24).toString("base64url")}`;
}

function hashApiToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export const getSetupStatus = query(() => {
  return getSetupStatusSnapshot();
});

export const saveSetup = form(setupSchema, async ({ baseUrl, repoRoot }) => {
  const currentStatus = getSetupStatusSnapshot();

  if (currentStatus.setupComplete) {
    invalid("Sandfactory has already been configured.");
  }

  const database = createDb();
  const updatedAt = new Date().toISOString();
  const apiToken = generateApiToken();

  try {
    database.db.insert(settings)
      .values({ key: "base_url", value: baseUrl, updatedAt })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: baseUrl, updatedAt },
      })
      .run();

    database.db.insert(settings)
      .values({ key: "repo_root", value: repoRoot, updatedAt })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: repoRoot, updatedAt },
      })
      .run();

    database.db.delete(apiTokens).run();
    database.db.insert(apiTokens)
      .values({
        tokenHash: hashApiToken(apiToken),
        createdAt: updatedAt,
        lastUsedAt: null,
      })
      .run();

    return {
      apiToken,
      settings: {
        baseUrl,
        repoRoot,
      },
    };
  } finally {
    database.close();
  }
});

export const regenerateApiToken = command(async () => {
  const database = createDb();
  const updatedAt = new Date().toISOString();
  const apiToken = generateApiToken();

  try {
    database.db.delete(apiTokens).run();
    database.db.insert(apiTokens)
      .values({
        tokenHash: hashApiToken(apiToken),
        createdAt: updatedAt,
        lastUsedAt: null,
      })
      .run();

    const storedToken = database.db
      .select({
        tokenHash: apiTokens.tokenHash,
        createdAt: apiTokens.createdAt,
        lastUsedAt: apiTokens.lastUsedAt,
      })
      .from(apiTokens)
      .orderBy(desc(apiTokens.createdAt))
      .all()[0];

    return {
      apiToken,
      storedToken,
    };
  } finally {
    database.close();
  }
});
