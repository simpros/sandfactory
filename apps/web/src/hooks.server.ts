import { building } from "$app/environment";
import { auth } from "$lib/server/auth";
import { createDb } from "@sandfactory/db";
import { svelteKitHandler } from "@sandfactory/auth/svelte-kit";
import { sequence } from "@sveltejs/kit/hooks";
import type { Handle } from "@sveltejs/kit";

let db: ReturnType<typeof createDb>["db"] | null = null;

function getDb() {
  if (db === null) {
    db = createDb().db;
  }
  return db;
}

function readBearerToken(headers: Headers) {
  const authorization = headers.get("authorization");
  if (!authorization) return null;

  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;

  return token;
}

function isPublicApiRoute(pathname: string) {
  return pathname.startsWith("/api/auth/") || pathname === "/api/healthz";
}

/** Initialises the singleton DB and attaches it to locals. */
const dbHandle: Handle = async ({ event, resolve }) => {
  event.locals.db = getDb();
  return resolve(event);
};

/** Delegates /api/auth/* requests to better-auth's SvelteKit handler. */
const authHandle: Handle = async ({ event, resolve }) => {
  return svelteKitHandler({ event, resolve, auth, building });
};

/** Verifies bearer tokens on protected API routes via better-auth api-key plugin. */
const apiKeyHandle: Handle = async ({ event, resolve }) => {
  if (!event.url.pathname.startsWith("/api/") || isPublicApiRoute(event.url.pathname)) {
    return resolve(event);
  }

  const key = readBearerToken(event.request.headers);

  if (!key) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const result = await auth.api.verifyApiKey({ body: { key } });

  if (!result.valid) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  return resolve(event);
};

/** Resolves the auth session for UI (non-API) routes. */
const sessionHandle: Handle = async ({ event, resolve }) => {
  if (event.url.pathname.startsWith("/api/")) {
    return resolve(event);
  }

  const session = await auth.api.getSession({
    headers: event.request.headers,
  });

  event.locals.session = session?.session ?? null;
  event.locals.user = session?.user ?? null;

  return resolve(event);
};

export const handle = sequence(dbHandle, authHandle, apiKeyHandle, sessionHandle);
