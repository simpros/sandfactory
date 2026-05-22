import { redirect } from "@sveltejs/kit";

import { SETUP_TOKEN_COOKIE } from "$lib/setup";
import { settings } from "@sandfactory/db";

export function load({ cookies, locals, url }) {
  const rows = locals.db
    .select({ key: settings.key, value: settings.value })
    .from(settings)
    .all();

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

  if (setupStatus.setupComplete && isSetupRoute) {
    const canShowSetupToken = cookies.get(SETUP_TOKEN_COOKIE) === "1";

    if (!canShowSetupToken) {
      throw redirect(307, "/");
    }

    cookies.delete(SETUP_TOKEN_COOKIE, { path: "/" });
  }

  return setupStatus;
}
