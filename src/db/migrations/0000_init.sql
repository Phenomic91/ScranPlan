CREATE TABLE `recipes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`short_name` text NOT NULL,
	`minutes` integer NOT NULL,
	`serves` integer NOT NULL,
	`vegetarian` integer NOT NULL,
	`blurb` text NOT NULL,
	`oven` text,
	`ingredients` text NOT NULL,
	`steps` text NOT NULL,
	`note` text NOT NULL,
	`created_at` text NOT NULL,
	`client_updated_at` text NOT NULL,
	`deleted_at` text,
	`dirty` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sync_state` (
	`table_name` text PRIMARY KEY NOT NULL,
	`last_pulled_at` text NOT NULL
);
