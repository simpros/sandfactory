import { getRequestEvent } from "$app/server";
import { createAuth } from "@sandfactory/auth/server";
import { sveltekitCookies } from "@sandfactory/auth/svelte-kit";
import { createDb, schema } from "@sandfactory/db";

const database = createDb();

export const auth = createAuth({
  db: database.db,
  schema,
  plugins: [sveltekitCookies(getRequestEvent)],
});
