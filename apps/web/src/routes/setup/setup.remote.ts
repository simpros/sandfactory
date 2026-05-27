import { invalid } from "@sveltejs/kit";
import { command, form, getRequestEvent, query } from "$app/server";
import { auth } from "$lib/server/auth";
import { SETUP_TOKEN_COOKIE } from "$lib/setup";
import { mapSetupStatus, readSetupStatus } from "$lib/server/setup";
import { getSingleUserEmail, getSingleUserName } from "@sandfactory/auth";
import { settings } from "@sandfactory/db";
import * as v from "valibot";

const setupSchema = v.object({
  baseUrl: v.pipe(v.string(), v.trim(), v.url("Enter a valid URL.")),
  loginPassword: v.pipe(v.string(), v.minLength(8, "Enter a password with at least 8 characters.")),
  repoRoot: v.pipe(v.string(), v.trim(), v.minLength(1, "Enter a repo root path.")),
});

export const getSetupStatus = query(() => {
  const { db } = getRequestEvent().locals;
  const setupStatus = readSetupStatus(db);
  return { settings: setupStatus.settings, setupComplete: setupStatus.setupComplete };
});

export const saveSetup = form(setupSchema, async ({ baseUrl, loginPassword, repoRoot }) => {
  const event = getRequestEvent();
  const { db } = event.locals;
  const updatedAt = new Date().toISOString();
  const currentStatus = readSetupStatus(db);

  const settingsResult = db.transaction((tx) => {
    const rows = tx
      .select({ key: settings.key, value: settings.value })
      .from(settings)
      .all();

    if (mapSetupStatus(rows, currentStatus.authConfigured).setupComplete) {
      return null;
    }

    tx.insert(settings)
      .values({ key: "base_url", value: baseUrl, updatedAt })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: baseUrl, updatedAt },
      })
      .run();

    tx.insert(settings)
      .values({ key: "repo_root", value: repoRoot, updatedAt })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: repoRoot, updatedAt },
      })
      .run();

    return { settings: { baseUrl, repoRoot } };
  });

  if (settingsResult === null) {
    invalid("Sandfactory has already been configured.");
  }

  // Create user account if not yet configured
  let userId: string;

  if (!currentStatus.authConfigured) {
    const signUpResult = await auth.api.signUpEmail({
      body: {
        name: getSingleUserName(),
        email: getSingleUserEmail(),
        password: loginPassword,
      },
      headers: event.request.headers,
    });

    userId = signUpResult.user.id;
  } else {
    // User already exists — look up their ID
    const existingSession = await auth.api.getSession({
      headers: event.request.headers,
    });
    userId = existingSession!.user.id;
  }

  // Create API key via better-auth
  const apiKeyResult = await auth.api.createApiKey({
    body: {
      name: "default",
      userId,
    },
  });

  event.cookies.set(SETUP_TOKEN_COOKIE, "1", {
    httpOnly: true,
    maxAge: 60,
    path: "/",
    sameSite: "lax",
  });

  return { apiToken: apiKeyResult.key, settings: settingsResult!.settings };
});

export const regenerateApiToken = command(async () => {
  const event = getRequestEvent();

  // Get the current user's session
  const session = await auth.api.getSession({
    headers: event.request.headers,
  });

  if (!session) {
    return null;
  }

  // List existing keys and delete them
  const existingKeys = await auth.api.listApiKeys({
    headers: event.request.headers,
  });

  for (const key of existingKeys.apiKeys) {
    await auth.api.deleteApiKey({
      body: { keyId: key.id },
      headers: event.request.headers,
    });
  }

  // Create a new key
  const apiKeyResult = await auth.api.createApiKey({
    body: {
      name: "default",
      userId: session.user.id,
    },
  });

  return { apiToken: apiKeyResult.key };
});
