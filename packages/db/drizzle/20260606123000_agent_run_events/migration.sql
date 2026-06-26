CREATE TABLE `agent_run_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`run_id` text NOT NULL REFERENCES `agent_runs`(`id`),
	`type` text NOT NULL,
	`stream` text,
	`text` text,
	`status` text,
	`finished_at` text,
	`failure_message` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `agent_run_events_run_id_idx` ON `agent_run_events` (`run_id`);
--> statement-breakpoint
CREATE INDEX `agent_run_events_run_id_id_idx` ON `agent_run_events` (`run_id`,`id`);
