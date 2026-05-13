import { redirect } from "@sveltejs/kit";

import { createDb, settings } from "@sandfactory/db";

export function load({ url }) {
  const database = createDb();
  const rows = database.db
    .select({ key: settings.key, value: settings.value })
    .from(settings)
    .all();
  database.close();

  const values = new Map(rows.map((row) => [row.key, row.value]));
  const setupStatus = {
    settings:
      values.get("base_url") && values.get("repo_root")
        ? {
            baseUrl: values.get("base_url")!,
            repoRoot: values.get("repo_root")!,
          }
        : null,
    setupComplete: Boolean(values.get("base_url") && values.get("repo_root")),
  };
  const isSetupRoute = url.pathname === "/setup";

  if (!setupStatus.setupComplete && !isSetupRoute) {
    throw redirect(307, "/setup");
  }

  // Do NOT redirect away from /setup when complete — the setup page needs
  // to show the generated API token. The "Finish" button handles navigation.

  return setupStatus;
}
