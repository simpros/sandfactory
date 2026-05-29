import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export { account, apikey, session, user, verification } from "./schema/auth";

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  remoteUrl: text("remote_url"),
  localPath: text("local_path").notNull().unique(),
  createdAt: text("created_at").notNull(),
});
