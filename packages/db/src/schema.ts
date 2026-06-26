import { defineRelations } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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

export const agentRunEvents = sqliteTable(
  "agent_run_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    runId: text("run_id")
      .notNull()
      .references(() => agentRuns.id),
    type: text("type").notNull(),
    stream: text("stream"),
    text: text("text"),
    status: text("status"),
    finishedAt: text("finished_at"),
    failureMessage: text("failure_message"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("agent_run_events_run_id_idx").on(table.runId),
    index("agent_run_events_run_id_id_idx").on(table.runId, table.id),
  ]
);

export const schema = {
  account,
  agentRunEvents,
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
    events: r.many.agentRunEvents(),
  },
  agentRunEvents: {
    run: r.one.agentRuns({
      from: r.agentRunEvents.runId,
      to: r.agentRuns.id,
    }),
  },
}));
