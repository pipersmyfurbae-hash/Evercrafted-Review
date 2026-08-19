CREATE TABLE `floralSelections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`itemId` varchar(80) NOT NULL,
	`seed` int NOT NULL,
	`role` varchar(40) NOT NULL,
	`decision` enum('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
	`explanation` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `floralSelections_id` PRIMARY KEY(`id`)
);
