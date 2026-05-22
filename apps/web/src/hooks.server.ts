import { createDb } from "@sandfactory/db";
import type { Handle } from "@sveltejs/kit";

const { db } = createDb();

export const handle: Handle = ({ event, resolve }) => {
  event.locals.db = db;
  return resolve(event);
};
