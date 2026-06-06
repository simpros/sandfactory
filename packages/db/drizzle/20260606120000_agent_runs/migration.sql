CREATE TABLE `agent_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL REFERENCES `projects`(`id`),
	`status` text NOT NULL,
	`started_at` text NOT NULL,
	`finished_at` text,
	`branch` text,
	`failure_message` text,
	`commits` text
);
--> statement-breakpoint
CREATE INDEX `agent_runs_project_id_idx` ON `agent_runs` (`project_id`);
