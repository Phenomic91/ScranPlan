CREATE TABLE `timers` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`duration_ms` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`paused_at` integer,
	`notification_id` text,
	`activity_id` text,
	`created_at` integer NOT NULL
);
