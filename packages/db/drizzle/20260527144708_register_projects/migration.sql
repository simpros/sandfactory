CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`remote_url` text,
	`local_path` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_name_unique` ON `projects` (`name`);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_local_path_unique` ON `projects` (`local_path`);
