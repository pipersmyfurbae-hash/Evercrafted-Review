CREATE TABLE `blueprints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`status` enum('draft','awaiting_approval','approved','superseded') NOT NULL DEFAULT 'draft',
	`seed` int NOT NULL,
	`blueprint` json NOT NULL,
	`validation` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `blueprints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emotionalProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`intakeId` int NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`status` enum('draft','awaiting_approval','approved','superseded') NOT NULL DEFAULT 'draft',
	`atmosphere` varchar(120) NOT NULL,
	`summary` text NOT NULL,
	`profile` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emotionalProfiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `entitlements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int,
	`feature` varchar(100) NOT NULL,
	`source` varchar(80) NOT NULL,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `entitlements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventoryBatches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`filename` varchar(180) NOT NULL,
	`itemCount` int NOT NULL DEFAULT 0,
	`validationReport` json NOT NULL,
	`sourcePayload` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventoryBatches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventoryItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`itemId` varchar(80) NOT NULL,
	`sourceSku` varchar(80) NOT NULL,
	`name` varchar(180) NOT NULL,
	`productUrl` text,
	`imageUrl` text,
	`colorHex` varchar(16),
	`colorName` varchar(80),
	`colorFamily` varchar(80),
	`status` varchar(40) NOT NULL DEFAULT 'active',
	`costPerStemUsd` decimal(8,2),
	`structuralRole` varchar(80),
	`formFactor` varchar(80),
	`stemLengthIn` decimal(6,2),
	`emotionTags` json NOT NULL,
	`evsProfile` json,
	`reviewFlags` json,
	`approved` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventoryItems_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventoryItems_itemId_unique` UNIQUE(`itemId`)
);
--> statement-breakpoint
CREATE TABLE `lookbooks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`slug` varchar(180) NOT NULL,
	`title` varchar(180) NOT NULL,
	`status` enum('draft','published','shareable','archived') NOT NULL DEFAULT 'draft',
	`content` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lookbooks_id` PRIMARY KEY(`id`),
	CONSTRAINT `lookbooks_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `memoryIntakes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`memory` text NOT NULL,
	`occasion` varchar(160) NOT NULL,
	`honoree` varchar(160),
	`location` varchar(240),
	`whoWasThere` varchar(240),
	`timeOfDay` varchar(80),
	`guided` boolean NOT NULL DEFAULT false,
	`consentToProcess` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `memoryIntakes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`name` varchar(80) NOT NULL,
	`description` text,
	`monthlyPriceCents` int NOT NULL DEFAULT 0,
	`generationLimit` int NOT NULL DEFAULT 1,
	`canDownloadBlueprint` boolean NOT NULL DEFAULT false,
	`canPackageEcr` boolean NOT NULL DEFAULT false,
	`canPublishLookbook` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `plans_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`status` enum('intake','story','selection','blueprint','render','lookbook','complete') NOT NULL DEFAULT 'intake',
	`wreathSizeIn` decimal(6,2) NOT NULL DEFAULT '24',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `renderAssets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`kind` enum('wreath','lifestyle','blueprint_pdf','ecrpkg') NOT NULL,
	`status` enum('uploaded','review','approved','rejected','published') NOT NULL DEFAULT 'uploaded',
	`fileKey` varchar(400) NOT NULL,
	`url` text NOT NULL,
	`thumbnailUrl` text,
	`provenance` json NOT NULL,
	`rejectionReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `renderAssets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`emotionalProfileId` int NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`status` enum('draft','awaiting_approval','approved','superseded') NOT NULL DEFAULT 'draft',
	`title` varchar(180) NOT NULL,
	`body` text NOT NULL,
	`metadata` json NOT NULL,
	`beats` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planId` int NOT NULL,
	`status` enum('trialing','active','past_due','canceled') NOT NULL DEFAULT 'trialing',
	`externalCustomerId` varchar(160),
	`externalSubscriptionId` varchar(160),
	`currentPeriodEnd` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
