import { integer, json, pgEnum, pgTable, text, timestamp, varchar, numeric, boolean, serial } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["trialing", "active", "past_due", "canceled"]);
export const projectStatusEnum = pgEnum("project_status", ["intake", "story", "selection", "blueprint", "render", "lookbook", "complete"]);
export const approvalStatusEnum = pgEnum("approval_status", ["draft", "awaiting_approval", "approved", "superseded"]);
export const inventoryBatchStatusEnum = pgEnum("inventory_batch_status", ["importing", "completed", "failed"]);
export const provenanceDecisionEnum = pgEnum("provenance_decision", ["unreviewed", "verified", "flagged"]);
export const floralDecisionEnum = pgEnum("floral_decision", ["pending", "accepted", "rejected"]);
export const renderAssetKindEnum = pgEnum("render_asset_kind", ["wreath", "lifestyle", "blueprint_pdf", "ecrpkg"]);
export const renderAssetStatusEnum = pgEnum("render_asset_status", ["uploaded", "review", "approved", "rejected", "published"]);
export const cometTaskKindEnum = pgEnum("comet_task_kind", ["wreath", "lifestyle"]);
export const cometTaskStatusEnum = pgEnum("comet_task_status", ["queued", "submitting", "polling", "completed", "failed", "review_ready"]);
export const lookbookStatusEnum = pgEnum("lookbook_status", ["draft", "published", "shareable", "archived"]);
export const reverseEngineeringJobStatusEnum = pgEnum("reverse_engineering_job_status", ["uploaded", "analyzing", "review", "approved", "rejected"]);
export const operatorDecisionEnum = pgEnum("operator_decision", ["pending", "confirmed", "substituted", "unresolved"]);
export const signatureWreathStatusEnum = pgEnum("signature_wreath_status", ["draft", "review", "approved", "published", "archived", "rejected"]);
export const signatureWreathAssetKindEnum = pgEnum("signature_wreath_asset_kind", ["hero", "lifestyle", "blueprint", "recipe"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 80 }).notNull(),
  description: text("description"),
  monthlyPriceCents: integer("monthlyPriceCents").default(0).notNull(),
  generationLimit: integer("generationLimit").default(1).notNull(),
  canDownloadBlueprint: boolean("canDownloadBlueprint").default(false).notNull(),
  canPackageEcr: boolean("canPackageEcr").default(false).notNull(),
  canPublishLookbook: boolean("canPublishLookbook").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  planId: integer("planId").notNull(),
  status: subscriptionStatusEnum("status").default("trialing").notNull(),
  externalCustomerId: varchar("externalCustomerId", { length: 160 }),
  externalSubscriptionId: varchar("externalSubscriptionId", { length: 160 }),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  status: projectStatusEnum("status").default("intake").notNull(),
  wreathSizeIn: numeric("wreathSizeIn", { precision: 6, scale: 2 }).default("24").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const memoryIntakes = pgTable("memoryIntakes", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull(),
  version: integer("version").default(1).notNull(),
  memory: text("memory").notNull(),
  occasion: varchar("occasion", { length: 160 }).notNull(),
  honoree: varchar("honoree", { length: 160 }),
  location: varchar("location", { length: 240 }),
  whoWasThere: varchar("whoWasThere", { length: 240 }),
  timeOfDay: varchar("timeOfDay", { length: 80 }),
  guided: boolean("guided").default(false).notNull(),
  consentToProcess: boolean("consentToProcess").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const emotionalProfiles = pgTable("emotionalProfiles", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull(),
  intakeId: integer("intakeId").notNull(),
  version: integer("version").default(1).notNull(),
  status: approvalStatusEnum("status").default("draft").notNull(),
  atmosphere: varchar("atmosphere", { length: 120 }).notNull(),
  summary: text("summary").notNull(),
  profile: json("profile").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull(),
  emotionalProfileId: integer("emotionalProfileId").notNull(),
  version: integer("version").default(1).notNull(),
  status: approvalStatusEnum("status").default("draft").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  body: text("body").notNull(),
  metadata: json("metadata").notNull(),
  beats: json("beats").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const inventoryBatches = pgTable("inventoryBatches", {
  id: serial("id").primaryKey(),
  filename: varchar("filename", { length: 180 }).notNull(),
  itemCount: integer("itemCount").default(0).notNull(),
  processedCount: integer("processedCount").default(0).notNull(),
  status: inventoryBatchStatusEnum("status").default("importing").notNull(),
  errorMessage: text("errorMessage"),
  validationReport: json("validationReport").notNull(),
  sourcePayload: json("sourcePayload").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const inventoryItems = pgTable("inventoryItems", {
  id: serial("id").primaryKey(),
  itemId: varchar("itemId", { length: 80 }).notNull().unique(),
  sourceSku: varchar("sourceSku", { length: 80 }).notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  productUrl: text("productUrl"),
  imageUrl: text("imageUrl"),
  colorHex: varchar("colorHex", { length: 16 }),
  colorName: varchar("colorName", { length: 80 }),
  colorFamily: varchar("colorFamily", { length: 80 }),
  status: varchar("status", { length: 40 }).default("active").notNull(),
  replacementItemId: varchar("replacementItemId", { length: 80 }),
  provenanceDecision: provenanceDecisionEnum("provenanceDecision").default("unreviewed").notNull(),
  costPerStemUsd: numeric("costPerStemUsd", { precision: 8, scale: 2 }),
  structuralRole: varchar("structuralRole", { length: 80 }),
  formFactor: varchar("formFactor", { length: 80 }),
  stemLengthIn: numeric("stemLengthIn", { precision: 6, scale: 2 }),
  emotionTags: json("emotionTags").notNull(),
  evsProfile: json("evsProfile"),
  reviewFlags: json("reviewFlags"),
  approved: boolean("approved").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const floralSelections = pgTable("floralSelections", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull(),
  itemId: varchar("itemId", { length: 80 }).notNull(),
  seed: integer("seed").notNull(),
  role: varchar("role", { length: 40 }).notNull(),
  decision: floralDecisionEnum("decision").default("pending").notNull(),
  explanation: text("explanation").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const blueprints = pgTable("blueprints", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull(),
  version: integer("version").default(1).notNull(),
  status: approvalStatusEnum("status").default("draft").notNull(),
  seed: integer("seed").notNull(),
  blueprint: json("blueprint").notNull(),
  validation: json("validation").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const renderAssets = pgTable("renderAssets", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull(),
  kind: renderAssetKindEnum("kind").notNull(),
  status: renderAssetStatusEnum("status").default("uploaded").notNull(),
  fileKey: varchar("fileKey", { length: 400 }).notNull(),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  provenance: json("provenance").notNull(),
  rejectionReason: text("rejectionReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const cometRenderTasks = pgTable("cometRenderTasks", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull(),
  providerTaskId: varchar("providerTaskId", { length: 240 }).notNull(),
  renderAssetId: integer("renderAssetId"),
  kind: cometTaskKindEnum("kind").notNull(),
  operation: varchar("operation", { length: 40 }).notNull(),
  model: varchar("model", { length: 160 }),
  status: cometTaskStatusEnum("status").default("queued").notNull(),
  progress: integer("progress").default(0).notNull(),
  message: text("message"),
  sceneIndex: integer("sceneIndex"),
  sceneTitle: varchar("sceneTitle", { length: 180 }),
  metadata: json("metadata"),
  errorMessage: text("errorMessage"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const lookbooks = pgTable("lookbooks", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  shareToken: varchar("shareToken", { length: 96 }).unique(),
  title: varchar("title", { length: 180 }).notNull(),
  status: lookbookStatusEnum("status").default("draft").notNull(),
  content: json("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const entitlements = pgTable("entitlements", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  projectId: integer("projectId"),
  feature: varchar("feature", { length: 100 }).notNull(),
  source: varchar("source", { length: 80 }).notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const reverseEngineeringJobs = pgTable("reverseEngineeringJobs", {
  id: serial("id").primaryKey(),
  ownerId: integer("ownerId").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  sourceFileKey: varchar("sourceFileKey", { length: 400 }).notNull(),
  sourceUrl: text("sourceUrl"),
  sourceHash: varchar("sourceHash", { length: 128 }).notNull(),
  status: reverseEngineeringJobStatusEnum("status").default("uploaded").notNull(),
  analysis: json("analysis").notNull(),
  confidence: varchar("confidence", { length: 20 }).default("low").notNull(),
  flags: json("flags").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const reverseEngineeringElements = pgTable("reverseEngineeringElements", {
  id: serial("id").primaryKey(),
  jobId: integer("jobId").notNull(),
  role: varchar("role", { length: 40 }).notNull(),
  identifiedAs: varchar("identifiedAs", { length: 160 }).notNull(),
  confidence: varchar("confidence", { length: 20 }).notNull(),
  color: varchar("color", { length: 100 }),
  estimatedStemCount: integer("estimatedStemCount"),
  skuMatch: varchar("skuMatch", { length: 80 }),
  skuNeeded: boolean("skuNeeded").default(true).notNull(),
  placementZones: json("placementZones").notNull(),
  flag: text("flag"),
  operatorDecision: operatorDecisionEnum("operatorDecision").default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const signatureWreaths = pgTable("signatureWreaths", {
  id: serial("id").primaryKey(),
  ownerId: integer("ownerId").notNull(),
  reverseEngineeringJobId: integer("reverseEngineeringJobId").notNull(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  title: varchar("title", { length: 180 }).notNull(),
  collection: varchar("collection", { length: 120 }),
  status: signatureWreathStatusEnum("status").default("draft").notNull(),
  story: json("story").notNull(),
  recipe: json("recipe").notNull(),
  blueprint: json("blueprint").notNull(),
  ecrPackage: json("ecrPackage").notNull(),
  priceCents: integer("priceCents").default(0).notNull(),
  metadata: json("metadata").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const signatureWreathAssets = pgTable("signatureWreathAssets", {
  id: serial("id").primaryKey(),
  signatureWreathId: integer("signatureWreathId").notNull(),
  renderAssetId: integer("renderAssetId"),
  fileKey: varchar("fileKey", { length: 400 }).notNull(),
  url: text("url").notNull(),
  kind: signatureWreathAssetKindEnum("kind").notNull(),
  sortOrder: integer("sortOrder").default(0).notNull(),
  approved: boolean("approved").default(false).notNull(),
  provenance: json("provenance").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
