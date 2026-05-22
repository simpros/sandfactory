import { createDb } from "@sandfactory/db";
import type { Handle } from "@sveltejs/kit";

let db: ReturnType<typeof createDb>["db"] | null = null;

export const handle: Handle = ({ event, resolve }) => {
  if (db === null) {
    db = createDb().db;
  }

  event.locals.db = db;
  return resolve(event);
};
