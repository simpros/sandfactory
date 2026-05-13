import { createHash, randomBytes } from "node:crypto";
import { invalid } from "@sveltejs/kit";
import { command, form, getRequestEvent, query } from "$app/server";
import { apiTokens, settings } from "@sandfactory/db";
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

function generateApiToken() {
  return `sf_${randomBytes(24).toString("base64url")}`;
}

function hashApiToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export const getSetupStatus = query(() => {
  const { db } = getRequestEvent().locals;
  const rows = db
    .select({ key: settings.key, value: settings.value })
    .from(settings)
    .all();
  const currentSettings = mapSettings(rows);
  return { settings: currentSettings, setupComplete: currentSettings !== null };
});

export const saveSetup = form(setupSchema, async ({ baseUrl, repoRoot }) => {
  const { db, sqlite } = getRequestEvent().locals;
  const updatedAt = new Date().toISOString();
  const apiToken = generateApiToken();

  const result = sqlite.transaction(() => {
    const rows = db
      .select({ key: settings.key, value: settings.value })
      .from(settings)
      .all();

    if (mapSettings(rows) !== null) {
      return null;
    }

    db.insert(settings)
      .values({ key: "base_url", value: baseUrl, updatedAt })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: baseUrl, updatedAt },
      })
      .run();

    db.insert(settings)
      .values({ key: "repo_root", value: repoRoot, updatedAt })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: repoRoot, updatedAt },
      })
      .run();

    db.delete(apiTokens).run();
    db.insert(apiTokens)
      .values({
        tokenHash: hashApiToken(apiToken),
        createdAt: updatedAt,
        lastUsedAt: null,
      })
      .run();

    return { apiToken, settings: { baseUrl, repoRoot } };
  })();

  if (result === null) {
    invalid("Sandfactory has already been configured.");
  }

  return result;
});

export const regenerateApiToken = command(async () => {
  const { db, sqlite } = getRequestEvent().locals;
  const updatedAt = new Date().toISOString();
  const apiToken = generateApiToken();

  sqlite.transaction(() => {
    db.delete(apiTokens).run();
    db.insert(apiTokens)
      .values({
        tokenHash: hashApiToken(apiToken),
        createdAt: updatedAt,
        lastUsedAt: null,
      })
      .run();
  })();

  return { apiToken };
});
