ALTER TABLE `lookbooks` ADD `shareToken` varchar(96);--> statement-breakpoint
ALTER TABLE `lookbooks` ADD CONSTRAINT `lookbooks_shareToken_unique` UNIQUE(`shareToken`);