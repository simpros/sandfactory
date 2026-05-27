import { redirect } from "@sveltejs/kit";

import { SETUP_TOKEN_COOKIE } from "$lib/setup";
import { readSetupStatus } from "$lib/server/setup";

export function load({ cookies, locals, url }) {
  const setupStatus = readSetupStatus(locals.db);
  const isSetupRoute = url.pathname === "/setup";
  const isLoginRoute = url.pathname === "/login";
  const isAuthenticated = locals.session !== null;

  if (!setupStatus.setupComplete && !isSetupRoute) {
    throw redirect(307, "/setup");
  }

  if (setupStatus.setupComplete && isSetupRoute) {
    const canShowSetupToken = cookies.get(SETUP_TOKEN_COOKIE) === "1";

    if (!canShowSetupToken) {
      throw redirect(307, isAuthenticated ? "/" : "/login");
    }

    cookies.delete(SETUP_TOKEN_COOKIE, { path: "/" });
  }

  if (setupStatus.setupComplete && !isSetupRoute && !isLoginRoute && !isAuthenticated) {
    throw redirect(307, "/login");
  }

  if (setupStatus.setupComplete && isLoginRoute && isAuthenticated) {
    throw redirect(307, "/");
  }

  return {
    ...setupStatus,
    authenticated: isAuthenticated,
  };
}
