import { createDb } from "@sandfactory/db";
import type { Handle } from "@sveltejs/kit";

const { db, sqlite } = createDb();

export const handle: Handle = ({ event, resolve }) => {
  event.locals.db = db;
  event.locals.sqlite = sqlite;
  return resolve(event);
};
