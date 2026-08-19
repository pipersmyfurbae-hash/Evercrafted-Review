ALTER TABLE `inventoryBatches` ADD `processedCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `inventoryBatches` ADD `status` enum('importing','completed','failed') DEFAULT 'importing' NOT NULL;--> statement-breakpoint
ALTER TABLE `inventoryBatches` ADD `errorMessage` text;