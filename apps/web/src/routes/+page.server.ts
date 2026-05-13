import { createDb, settings } from "@sandfactory/db";

export function load() {
  const database = createDb();

  try {
    const rows = database.db
      .select({ key: settings.key, value: settings.value })
      .from(settings)
      .all();

    const values = new Map(rows.map((row) => [row.key, row.value]));

    return {
      settings:
        values.get("base_url") && values.get("repo_root")
          ? {
              baseUrl: values.get("base_url")!,
              repoRoot: values.get("repo_root")!,
            }
          : null,
      setupComplete: Boolean(values.get("base_url") && values.get("repo_root")),
    };
  } finally {
    database.close();
  }
}
