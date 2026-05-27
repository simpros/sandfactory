import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export { account, apikey, session, user, verification } from "./schema/auth";

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
});
