import { getSingleUserEmail } from "@sandfactory/auth";
import type { Db } from "@sandfactory/db";
import { account, settings, user } from "@sandfactory/db";
import { eq } from "drizzle-orm";

type SettingRows = Array<{ key: string; value: string }>;

export type SetupSettings = {
  baseUrl: string;
  repoRoot: string;
};

export type SetupStatus = {
  authConfigured: boolean;
  settings: SetupSettings | null;
  setupComplete: boolean;
};

export function mapSetupStatus(rows: SettingRows, authConfigured = false): SetupStatus {
  const values = new Map(rows.map((row) => [row.key, row.value]));
  const baseUrl = values.get("base_url");
  const repoRoot = values.get("repo_root");

  return {
    authConfigured,
    settings:
      baseUrl && repoRoot
        ? {
            baseUrl,
            repoRoot,
          }
        : null,
    setupComplete: Boolean(baseUrl && repoRoot && authConfigured),
  };
}

export function readSetupStatus(db: Db["db"]) {
  const rows = db
    .select({ key: settings.key, value: settings.value })
    .from(settings)
    .all();

  const singleUser = db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, getSingleUserEmail()))
    .get();

  const authConfigured =
    singleUser !== null &&
    singleUser !== undefined &&
    db
      .select({ id: account.id })
      .from(account)
      .where(eq(account.userId, singleUser.id))
      .get() !==
      undefined;

  return mapSetupStatus(rows, authConfigured);
}
