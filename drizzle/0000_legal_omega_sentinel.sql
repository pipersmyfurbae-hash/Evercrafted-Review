CREATE SCHEMA "evercrafted";
--> statement-breakpoint
CREATE TYPE "evercrafted"."approval_status" AS ENUM('draft', 'awaiting_approval', 'approved', 'superseded');--> statement-breakpoint
CREATE TYPE "evercrafted"."comet_task_kind" AS ENUM('wreath', 'lifestyle');--> statement-breakpoint
CREATE TYPE "evercrafted"."comet_task_status" AS ENUM('queued', 'submitting', 'polling', 'completed', 'failed', 'review_ready');--> statement-breakpoint
CREATE TYPE "evercrafted"."floral_decision" AS ENUM('pending', 'accepted', 'rejected');--> statement-breakpoint
CREATE TYPE "evercrafted"."inventory_batch_status" AS ENUM('importing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "evercrafted"."lookbook_status" AS ENUM('draft', 'published', 'shareable', 'archived');--> statement-breakpoint
CREATE TYPE "evercrafted"."operator_decision" AS ENUM('pending', 'confirmed', 'substituted', 'unresolved');--> statement-breakpoint
CREATE TYPE "evercrafted"."project_status" AS ENUM('intake', 'story', 'selection', 'blueprint', 'render', 'lookbook', 'complete');--> statement-breakpoint
CREATE TYPE "evercrafted"."provenance_decision" AS ENUM('unreviewed', 'verified', 'flagged');--> statement-breakpoint
CREATE TYPE "evercrafted"."render_asset_kind" AS ENUM('wreath', 'lifestyle', 'blueprint_pdf', 'ecrpkg');--> statement-breakpoint
CREATE TYPE "evercrafted"."render_asset_status" AS ENUM('uploaded', 'review', 'approved', 'rejected', 'published');--> statement-breakpoint
CREATE TYPE "evercrafted"."reverse_engineering_job_status" AS ENUM('uploaded', 'analyzing', 'review', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "evercrafted"."signature_wreath_asset_kind" AS ENUM('hero', 'lifestyle', 'blueprint', 'recipe');--> statement-breakpoint
CREATE TYPE "evercrafted"."signature_wreath_status" AS ENUM('draft', 'review', 'approved', 'published', 'archived', 'rejected');--> statement-breakpoint
CREATE TYPE "evercrafted"."subscription_status" AS ENUM('trialing', 'active', 'past_due', 'canceled');--> statement-breakpoint
CREATE TYPE "evercrafted"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "evercrafted"."blueprints" (
	"id" serial PRIMARY KEY NOT NULL,
	"projectId" integer NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"status" "evercrafted"."approval_status" DEFAULT 'draft' NOT NULL,
	"seed" integer NOT NULL,
	"blueprint" json NOT NULL,
	"validation" json NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evercrafted"."cometRenderTasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"projectId" integer NOT NULL,
	"providerTaskId" varchar(240) NOT NULL,
	"renderAssetId" integer,
	"kind" "evercrafted"."comet_task_kind" NOT NULL,
	"operation" varchar(40) NOT NULL,
	"model" varchar(160),
	"status" "evercrafted"."comet_task_status" DEFAULT 'queued' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"message" text,
	"sceneIndex" integer,
	"sceneTitle" varchar(180),
	"metadata" json,
	"errorMessage" text,
	"startedAt" timestamp,
	"completedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evercrafted"."emotionalProfiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"projectId" integer NOT NULL,
	"intakeId" integer NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"status" "evercrafted"."approval_status" DEFAULT 'draft' NOT NULL,
	"atmosphere" varchar(120) NOT NULL,
	"summary" text NOT NULL,
	"profile" json NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evercrafted"."entitlements" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"projectId" integer,
	"feature" varchar(100) NOT NULL,
	"source" varchar(80) NOT NULL,
	"expiresAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evercrafted"."floralSelections" (
	"id" serial PRIMARY KEY NOT NULL,
	"projectId" integer NOT NULL,
	"itemId" varchar(80) NOT NULL,
	"seed" integer NOT NULL,
	"role" varchar(40) NOT NULL,
	"decision" "evercrafted"."floral_decision" DEFAULT 'pending' NOT NULL,
	"explanation" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evercrafted"."inventoryBatches" (
	"id" serial PRIMARY KEY NOT NULL,
	"filename" varchar(180) NOT NULL,
	"itemCount" integer DEFAULT 0 NOT NULL,
	"processedCount" integer DEFAULT 0 NOT NULL,
	"status" "evercrafted"."inventory_batch_status" DEFAULT 'importing' NOT NULL,
	"errorMessage" text,
	"validationReport" json NOT NULL,
	"sourcePayload" json NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evercrafted"."inventoryItems" (
	"id" serial PRIMARY KEY NOT NULL,
	"itemId" varchar(80) NOT NULL,
	"sourceSku" varchar(80) NOT NULL,
	"name" varchar(180) NOT NULL,
	"productUrl" text,
	"imageUrl" text,
	"colorHex" varchar(16),
	"colorName" varchar(80),
	"colorFamily" varchar(80),
	"status" varchar(40) DEFAULT 'active' NOT NULL,
	"replacementItemId" varchar(80),
	"provenanceDecision" "evercrafted"."provenance_decision" DEFAULT 'unreviewed' NOT NULL,
	"costPerStemUsd" numeric(8, 2),
	"structuralRole" varchar(80),
	"formFactor" varchar(80),
	"stemLengthIn" numeric(6, 2),
	"emotionTags" json NOT NULL,
	"evsProfile" json,
	"reviewFlags" json,
	"approved" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "inventoryItems_itemId_unique" UNIQUE("itemId")
);
--> statement-breakpoint
CREATE TABLE "evercrafted"."lookbooks" (
	"id" serial PRIMARY KEY NOT NULL,
	"projectId" integer NOT NULL,
	"slug" varchar(180) NOT NULL,
	"shareToken" varchar(96),
	"title" varchar(180) NOT NULL,
	"status" "evercrafted"."lookbook_status" DEFAULT 'draft' NOT NULL,
	"content" json NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lookbooks_slug_unique" UNIQUE("slug"),
	CONSTRAINT "lookbooks_shareToken_unique" UNIQUE("shareToken")
);
--> statement-breakpoint
CREATE TABLE "evercrafted"."memoryIntakes" (
	"id" serial PRIMARY KEY NOT NULL,
	"projectId" integer NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"memory" text NOT NULL,
	"occasion" varchar(160) NOT NULL,
	"honoree" varchar(160),
	"location" varchar(240),
	"whoWasThere" varchar(240),
	"timeOfDay" varchar(80),
	"guided" boolean DEFAULT false NOT NULL,
	"consentToProcess" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evercrafted"."plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(32) NOT NULL,
	"name" varchar(80) NOT NULL,
	"description" text,
	"monthlyPriceCents" integer DEFAULT 0 NOT NULL,
	"generationLimit" integer DEFAULT 1 NOT NULL,
	"canDownloadBlueprint" boolean DEFAULT false NOT NULL,
	"canPackageEcr" boolean DEFAULT false NOT NULL,
	"canPublishLookbook" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plans_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "evercrafted"."projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" varchar(160) NOT NULL,
	"status" "evercrafted"."project_status" DEFAULT 'intake' NOT NULL,
	"wreathSizeIn" numeric(6, 2) DEFAULT '24' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evercrafted"."renderAssets" (
	"id" serial PRIMARY KEY NOT NULL,
	"projectId" integer NOT NULL,
	"kind" "evercrafted"."render_asset_kind" NOT NULL,
	"status" "evercrafted"."render_asset_status" DEFAULT 'uploaded' NOT NULL,
	"fileKey" varchar(400) NOT NULL,
	"url" text NOT NULL,
	"thumbnailUrl" text,
	"provenance" json NOT NULL,
	"rejectionReason" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evercrafted"."reverseEngineeringElements" (
	"id" serial PRIMARY KEY NOT NULL,
	"jobId" integer NOT NULL,
	"role" varchar(40) NOT NULL,
	"identifiedAs" varchar(160) NOT NULL,
	"confidence" varchar(20) NOT NULL,
	"color" varchar(100),
	"estimatedStemCount" integer,
	"skuMatch" varchar(80),
	"skuNeeded" boolean DEFAULT true NOT NULL,
	"placementZones" json NOT NULL,
	"flag" text,
	"operatorDecision" "evercrafted"."operator_decision" DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evercrafted"."reverseEngineeringJobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"ownerId" integer NOT NULL,
	"title" varchar(180) NOT NULL,
	"sourceFileKey" varchar(400) NOT NULL,
	"sourceUrl" text,
	"sourceHash" varchar(128) NOT NULL,
	"status" "evercrafted"."reverse_engineering_job_status" DEFAULT 'uploaded' NOT NULL,
	"analysis" json NOT NULL,
	"confidence" varchar(20) DEFAULT 'low' NOT NULL,
	"flags" json NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evercrafted"."signatureWreathAssets" (
	"id" serial PRIMARY KEY NOT NULL,
	"signatureWreathId" integer NOT NULL,
	"renderAssetId" integer,
	"fileKey" varchar(400) NOT NULL,
	"url" text NOT NULL,
	"kind" "evercrafted"."signature_wreath_asset_kind" NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"approved" boolean DEFAULT false NOT NULL,
	"provenance" json NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evercrafted"."signatureWreaths" (
	"id" serial PRIMARY KEY NOT NULL,
	"ownerId" integer NOT NULL,
	"reverseEngineeringJobId" integer NOT NULL,
	"slug" varchar(180) NOT NULL,
	"title" varchar(180) NOT NULL,
	"collection" varchar(120),
	"status" "evercrafted"."signature_wreath_status" DEFAULT 'draft' NOT NULL,
	"story" json NOT NULL,
	"recipe" json NOT NULL,
	"blueprint" json NOT NULL,
	"ecrPackage" json NOT NULL,
	"priceCents" integer DEFAULT 0 NOT NULL,
	"metadata" json NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "signatureWreaths_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "evercrafted"."stories" (
	"id" serial PRIMARY KEY NOT NULL,
	"projectId" integer NOT NULL,
	"emotionalProfileId" integer NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"status" "evercrafted"."approval_status" DEFAULT 'draft' NOT NULL,
	"title" varchar(180) NOT NULL,
	"body" text NOT NULL,
	"metadata" json NOT NULL,
	"beats" json NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evercrafted"."subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"planId" integer NOT NULL,
	"status" "evercrafted"."subscription_status" DEFAULT 'trialing' NOT NULL,
	"externalCustomerId" varchar(160),
	"externalSubscriptionId" varchar(160),
	"currentPeriodEnd" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evercrafted"."users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "evercrafted"."user_role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
