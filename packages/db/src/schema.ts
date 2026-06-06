import { defineRelations } from "drizzle-orm";
import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";

import {
  account,
  apikey,
  session,
  user,
  verification,
} from "./schema/auth";

export {
  account,
  apikey,
  session,
  user,
  verification,
} from "./schema/auth";

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

export const agentRuns = sqliteTable(
  "agent_runs",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id),
    status: text("status").notNull(), // 'running' | 'succeeded' | 'failed'
    startedAt: text("started_at").notNull(),
    finishedAt: text("finished_at"),
    branch: text("branch"),
    failureMessage: text("failure_message"),
    commits: text("commits"), // JSON array of commit strings
  },
  (table) => [index("agent_runs_project_id_idx").on(table.projectId)]
);

export const schema = {
  account,
  agentRuns,
  apikey,
  projects,
  session,
  settings,
  user,
  verification,
};

export const relations = defineRelations(schema, (r) => ({
  user: {
    accounts: r.many.account(),
    sessions: r.many.session(),
  },
  account: {
    user: r.one.user({
      from: r.account.userId,
      to: r.user.id,
    }),
  },
  session: {
    user: r.one.user({
      from: r.session.userId,
      to: r.user.id,
    }),
  },
  projects: {
    agentRuns: r.many.agentRuns(),
  },
  agentRuns: {
    project: r.one.projects({
      from: r.agentRuns.projectId,
      to: r.projects.id,
    }),
  },
}));
