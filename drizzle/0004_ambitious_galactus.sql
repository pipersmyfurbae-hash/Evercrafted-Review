CREATE TABLE `reverseEngineeringElements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`role` varchar(40) NOT NULL,
	`identifiedAs` varchar(160) NOT NULL,
	`confidence` varchar(20) NOT NULL,
	`color` varchar(100),
	`estimatedStemCount` int,
	`skuMatch` varchar(80),
	`skuNeeded` boolean NOT NULL DEFAULT true,
	`placementZones` json NOT NULL,
	`flag` text,
	`operatorDecision` enum('pending','confirmed','substituted','unresolved') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reverseEngineeringElements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reverseEngineeringJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`sourceFileKey` varchar(400) NOT NULL,
	`sourceUrl` text,
	`sourceHash` varchar(128) NOT NULL,
	`status` enum('uploaded','analyzing','review','approved','rejected') NOT NULL DEFAULT 'uploaded',
	`analysis` json NOT NULL,
	`confidence` varchar(20) NOT NULL DEFAULT 'low',
	`flags` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reverseEngineeringJobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `signatureWreathAssets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`signatureWreathId` int NOT NULL,
	`renderAssetId` int,
	`fileKey` varchar(400) NOT NULL,
	`url` text NOT NULL,
	`kind` enum('hero','lifestyle','blueprint','recipe') NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`approved` boolean NOT NULL DEFAULT false,
	`provenance` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `signatureWreathAssets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `signatureWreaths` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`reverseEngineeringJobId` int NOT NULL,
	`slug` varchar(180) NOT NULL,
	`title` varchar(180) NOT NULL,
	`collection` varchar(120),
	`status` enum('draft','review','approved','published','archived','rejected') NOT NULL DEFAULT 'draft',
	`story` json NOT NULL,
	`recipe` json NOT NULL,
	`blueprint` json NOT NULL,
	`ecrPackage` json NOT NULL,
	`priceCents` int NOT NULL DEFAULT 0,
	`metadata` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `signatureWreaths_id` PRIMARY KEY(`id`),
	CONSTRAINT `signatureWreaths_slug_unique` UNIQUE(`slug`)
);
