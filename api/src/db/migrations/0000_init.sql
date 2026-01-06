CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(120) NOT NULL,
	`birthday` text NOT NULL,
	`gender` text NOT NULL,
	`country` text(120) NOT NULL
);
