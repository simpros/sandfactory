import { createDb, schema } from "@sandfactory/db";

import { createAuth } from "./auth-server";

const { db } = createDb();

export const auth = createAuth({ db, schema });
