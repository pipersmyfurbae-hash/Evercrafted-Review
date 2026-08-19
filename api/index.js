// server/_core/vercelEntry.ts
import "dotenv/config";

// server/_core/app.ts
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// server/_core/env.ts
var ENV = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  // Supabase auth user id (uuid) of the account that should be auto-promoted to admin on first sign-in.
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/_core/storageProxy.ts
function registerStorageProxy(app) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = req.params[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }
    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = await forgeResp.json();
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}

// server/routers.ts
import { TRPCError as TRPCError3 } from "@trpc/server";
import { z as z3 } from "zod";
import { createHash, randomUUID } from "node:crypto";

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// shared/const.ts
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/_core/llm.ts
var ensureArray = (value) => Array.isArray(value) ? value : [value];
var normalizeContentPart = (part) => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }
  if (part.type === "text") {
    return part;
  }
  if (part.type === "image_url") {
    return part;
  }
  if (part.type === "file_url") {
    return part;
  }
  throw new Error("Unsupported message content part");
};
var normalizeMessage = (message) => {
  const { role, name, tool_call_id } = message;
  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content).map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n");
    return {
      role,
      name,
      tool_call_id,
      content
    };
  }
  const contentParts = ensureArray(message.content).map(normalizeContentPart);
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text
    };
  }
  return {
    role,
    name,
    content: contentParts
  };
};
var normalizeToolChoice = (toolChoice, tools) => {
  if (!toolChoice) return void 0;
  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }
  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }
    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }
    return {
      type: "function",
      function: { name: tools[0].function.name }
    };
  }
  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name }
    };
  }
  return toolChoice;
};
var resolveApiUrl = () => ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0 ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions` : "https://forge.manus.im/v1/chat/completions";
var assertApiKey = () => {
  if (!ENV.forgeApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
};
var normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema
}) => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }
  const schema = outputSchema || output_schema;
  if (!schema) return void 0;
  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }
  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...typeof schema.strict === "boolean" ? { strict: schema.strict } : {}
    }
  };
};
var RETRY_MAX_RETRIES = 4;
var RETRY_BASE_DELAY_MS = 500;
var RETRY_MAX_DELAY_MS = 3e4;
var sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
var parseRetryAfter = (value) => {
  if (!value) return void 0;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1e3);
  const at = Date.parse(value);
  return Number.isNaN(at) ? void 0 : Math.max(0, at - Date.now());
};
var computeBackoffDelay = (attempt, retryAfterMs) => {
  const cap = Math.min(RETRY_BASE_DELAY_MS * 2 ** attempt, RETRY_MAX_DELAY_MS);
  const jittered = cap / 2 + Math.random() * (cap / 2);
  return Math.min(Math.max(jittered, retryAfterMs ?? 0), RETRY_MAX_DELAY_MS);
};
var fetchWithBackoff = async (url, init) => {
  let lastError;
  for (let attempt = 0; attempt <= RETRY_MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, init);
      if (response.ok || attempt === RETRY_MAX_RETRIES) {
        return response;
      }
      const retryAfterMs = parseRetryAfter(
        response.headers.get("retry-after")
      );
      try {
        await response.body?.cancel();
      } catch {
      }
      console.warn(
        `LLM request retry ${attempt + 1}/${RETRY_MAX_RETRIES} after status ${response.status}`
      );
      await sleep(computeBackoffDelay(attempt, retryAfterMs));
    } catch (error) {
      lastError = error;
      if (attempt === RETRY_MAX_RETRIES) throw error;
      console.warn(
        `LLM request retry ${attempt + 1}/${RETRY_MAX_RETRIES} after network error`
      );
      await sleep(computeBackoffDelay(attempt));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("LLM request failed after exhausting retries");
};
async function invokeLLM(params) {
  assertApiKey();
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
    model,
    thinking,
    reasoning,
    maxTokens,
    max_tokens
  } = params;
  const payload = {
    messages: messages.map(normalizeMessage)
  };
  if (model) {
    payload.model = model;
  }
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }
  const resolvedMaxTokens = max_tokens ?? maxTokens;
  if (typeof resolvedMaxTokens === "number") {
    payload.max_tokens = resolvedMaxTokens;
  }
  if (thinking) {
    payload.thinking = thinking;
  }
  if (reasoning) {
    payload.reasoning = reasoning;
  }
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema
  });
  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }
  const response = await fetchWithBackoff(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} \u2013 ${errorText}`
    );
  }
  return await response.json();
}

// server/cometClaude.ts
var COMETAPI_BASE_URL = "https://api.cometapi.com";
var DEFAULT_MODEL = "claude-sonnet-5";
var systemPrompt = `You are Evercrafted's Story Genesis Engine running on Claude Sonnet 5. Follow the Story Genesis Engine doctrine exactly: get lost in the world first, perform invisible emotional archaeology, then write the story and derive the cinematic render prompts from what the story reveals. Return ONLY valid JSON matching the requested schema.

Write a 600\u2013800 word literary narrative in five movements: The World, The Character Enters, The Gathering, The Making / The Hanging, and The After. Use present tense where natural, gender-neutral they/them/their pronouns, specific sensory detail, and no product copy. Avoid generic adjectives and cliches. Never describe the wreath as a product. The wreath should arrive naturally as a presence in the world. The ending must land through one small concrete detail rather than explanation.

Return 7\u20139 distinct cinematic render beats for a wreath-only story. Every beat must be a narrative moment, not a repeated wreath prompt. Across the set include establishing world, character/presence, gathering, completed wreath in situ, detail/texture, and the after. Each beat must include full camera direction with position, lens, distance, and depth of field; full light direction with quality, direction, time, and temperature; a cinematic color grade; an emotional atmosphere; and a paste-ready FULL PROMPT that includes camera, lens, light, color grade, mood, Evercrafted Style DNA, aspect ratio, and negative prompts. No two beats may share the same camera position + lens + time combination. Include at least one wide establishing shot and one macro detail shot. Show the wreath in-frame selectively in 2\u20134 beats, not every beat.

Locked rules: never include cherry blossoms, pussy willow, dried wheat, or sunflowers; integrate warm LED lights when the setting is interior, dusk, or evening; do not use faux, silk, or grapevine as product descriptors; keep collection direction after the story; and preserve the emotional world rather than forcing a commercial scene.`;
var storySchema = {
  title: "string",
  body: "string",
  metadata: {
    atmosphere: "string",
    collectionName: "string",
    movement: "string",
    silenceArc: ["number", "number"]
  },
  beats: [
    {
      name: "string",
      role: "string",
      setting: "string",
      camera: "string",
      light: "string",
      prompt: "string"
    }
  ]
};
var parseJson = (value) => {
  const trimmed = value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  return JSON.parse(trimmed);
};
var validateStory = (value) => {
  if (!value || typeof value !== "object") throw new Error("Claude returned a non-object Story Genesis response.");
  const story = value;
  if (typeof story.title !== "string" || typeof story.body !== "string" || !story.metadata || !Array.isArray(story.beats)) {
    throw new Error("Claude Story Genesis response is missing title, body, metadata, or beats.");
  }
  if (story.beats.length < 7 || story.beats.length > 9) throw new Error(`Claude returned ${story.beats.length} beats; Story Genesis requires 7\u20139.`);
  for (let index = 0; index < story.beats.length; index += 1) {
    const beat = story.beats[index];
    if (!beat || typeof beat !== "object" || ["name", "role", "setting", "camera", "light", "prompt"].some((key) => typeof beat[key] !== "string")) {
      throw new Error(`Claude beat ${index + 1} is missing required cinematic fields.`);
    }
  }
  return story;
};
async function generateClaudeStory(input) {
  const apiKey = process.env.COMETAPI_API_KEY;
  if (!apiKey) throw new Error("COMETAPI_API_KEY is not configured for Claude Story Genesis.");
  const model = process.env.COMETAPI_STORY_MODEL || DEFAULT_MODEL;
  const response = await fetch(`${COMETAPI_BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0.8,
      max_tokens: 9e3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: `${systemPrompt}

JSON shape to return: ${JSON.stringify(storySchema)}` },
        { role: "user", content: JSON.stringify(input) }
      ]
    })
  });
  if (!response.ok) throw new Error(`CometAPI Claude Story Genesis failed: ${response.status} ${await response.text()}`);
  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;
  const text2 = Array.isArray(content) ? content.map((part) => part.text ?? "").join("") : content;
  if (!text2) throw new Error("CometAPI Claude returned no Story Genesis content.");
  return validateStory(parseJson(text2));
}
var storyGenesisProvider = { provider: "cometapi", model: DEFAULT_MODEL, endpoint: `${COMETAPI_BASE_URL}/v1/chat/completions` };
async function generateClaudeJson(messages, maxTokens = 5e3) {
  const apiKey = process.env.COMETAPI_API_KEY;
  if (!apiKey) throw new Error("COMETAPI_API_KEY is not configured for Claude Emotional Design Translator.");
  const model = process.env.COMETAPI_STORY_MODEL || DEFAULT_MODEL;
  const response = await fetch(`${COMETAPI_BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, temperature: 0.45, max_tokens: maxTokens, response_format: { type: "json_object" }, messages })
  });
  if (!response.ok) throw new Error(`CometAPI Claude JSON generation failed: ${response.status} ${await response.text()}`);
  return await response.json();
}

// server/db.ts
import { eq, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// drizzle/schema.ts
import { integer, json, pgSchema, text, timestamp, varchar, numeric, boolean, serial } from "drizzle-orm/pg-core";
var evercrafted = pgSchema("evercrafted");
var userRoleEnum = evercrafted.enum("user_role", ["user", "admin"]);
var subscriptionStatusEnum = evercrafted.enum("subscription_status", ["trialing", "active", "past_due", "canceled"]);
var projectStatusEnum = evercrafted.enum("project_status", ["intake", "story", "selection", "blueprint", "render", "lookbook", "complete"]);
var approvalStatusEnum = evercrafted.enum("approval_status", ["draft", "awaiting_approval", "approved", "superseded"]);
var inventoryBatchStatusEnum = evercrafted.enum("inventory_batch_status", ["importing", "completed", "failed"]);
var provenanceDecisionEnum = evercrafted.enum("provenance_decision", ["unreviewed", "verified", "flagged"]);
var floralDecisionEnum = evercrafted.enum("floral_decision", ["pending", "accepted", "rejected"]);
var renderAssetKindEnum = evercrafted.enum("render_asset_kind", ["wreath", "lifestyle", "blueprint_pdf", "ecrpkg"]);
var renderAssetStatusEnum = evercrafted.enum("render_asset_status", ["uploaded", "review", "approved", "rejected", "published"]);
var cometTaskKindEnum = evercrafted.enum("comet_task_kind", ["wreath", "lifestyle"]);
var cometTaskStatusEnum = evercrafted.enum("comet_task_status", ["queued", "submitting", "polling", "completed", "failed", "review_ready"]);
var lookbookStatusEnum = evercrafted.enum("lookbook_status", ["draft", "published", "shareable", "archived"]);
var reverseEngineeringJobStatusEnum = evercrafted.enum("reverse_engineering_job_status", ["uploaded", "analyzing", "review", "approved", "rejected"]);
var operatorDecisionEnum = evercrafted.enum("operator_decision", ["pending", "confirmed", "substituted", "unresolved"]);
var signatureWreathStatusEnum = evercrafted.enum("signature_wreath_status", ["draft", "review", "approved", "published", "archived", "rejected"]);
var signatureWreathAssetKindEnum = evercrafted.enum("signature_wreath_asset_kind", ["hero", "lifestyle", "blueprint", "recipe"]);
var users = evercrafted.table("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date()),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var plans = evercrafted.table("plans", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 80 }).notNull(),
  description: text("description"),
  monthlyPriceCents: integer("monthlyPriceCents").default(0).notNull(),
  generationLimit: integer("generationLimit").default(1).notNull(),
  canDownloadBlueprint: boolean("canDownloadBlueprint").default(false).notNull(),
  canPackageEcr: boolean("canPackageEcr").default(false).notNull(),
  canPublishLookbook: boolean("canPublishLookbook").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var subscriptions = evercrafted.table("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  planId: integer("planId").notNull(),
  status: subscriptionStatusEnum("status").default("trialing").notNull(),
  externalCustomerId: varchar("externalCustomerId", { length: 160 }),
  externalSubscriptionId: varchar("externalSubscriptionId", { length: 160 }),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var projects = evercrafted.table("projects", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  status: projectStatusEnum("status").default("intake").notNull(),
  wreathSizeIn: numeric("wreathSizeIn", { precision: 6, scale: 2 }).default("24").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var memoryIntakes = evercrafted.table("memoryIntakes", {
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
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var emotionalProfiles = evercrafted.table("emotionalProfiles", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull(),
  intakeId: integer("intakeId").notNull(),
  version: integer("version").default(1).notNull(),
  status: approvalStatusEnum("status").default("draft").notNull(),
  atmosphere: varchar("atmosphere", { length: 120 }).notNull(),
  summary: text("summary").notNull(),
  profile: json("profile").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var stories = evercrafted.table("stories", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull(),
  emotionalProfileId: integer("emotionalProfileId").notNull(),
  version: integer("version").default(1).notNull(),
  status: approvalStatusEnum("status").default("draft").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  body: text("body").notNull(),
  metadata: json("metadata").notNull(),
  beats: json("beats").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var inventoryBatches = evercrafted.table("inventoryBatches", {
  id: serial("id").primaryKey(),
  filename: varchar("filename", { length: 180 }).notNull(),
  itemCount: integer("itemCount").default(0).notNull(),
  processedCount: integer("processedCount").default(0).notNull(),
  status: inventoryBatchStatusEnum("status").default("importing").notNull(),
  errorMessage: text("errorMessage"),
  validationReport: json("validationReport").notNull(),
  sourcePayload: json("sourcePayload").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var inventoryItems = evercrafted.table("inventoryItems", {
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var floralSelections = evercrafted.table("floralSelections", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull(),
  itemId: varchar("itemId", { length: 80 }).notNull(),
  seed: integer("seed").notNull(),
  role: varchar("role", { length: 40 }).notNull(),
  decision: floralDecisionEnum("decision").default("pending").notNull(),
  explanation: text("explanation").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var blueprints = evercrafted.table("blueprints", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull(),
  version: integer("version").default(1).notNull(),
  status: approvalStatusEnum("status").default("draft").notNull(),
  seed: integer("seed").notNull(),
  blueprint: json("blueprint").notNull(),
  validation: json("validation").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var renderAssets = evercrafted.table("renderAssets", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull(),
  kind: renderAssetKindEnum("kind").notNull(),
  status: renderAssetStatusEnum("status").default("uploaded").notNull(),
  fileKey: varchar("fileKey", { length: 400 }).notNull(),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  provenance: json("provenance").notNull(),
  rejectionReason: text("rejectionReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var cometRenderTasks = evercrafted.table("cometRenderTasks", {
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var lookbooks = evercrafted.table("lookbooks", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  shareToken: varchar("shareToken", { length: 96 }).unique(),
  title: varchar("title", { length: 180 }).notNull(),
  status: lookbookStatusEnum("status").default("draft").notNull(),
  content: json("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var entitlements = evercrafted.table("entitlements", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  projectId: integer("projectId"),
  feature: varchar("feature", { length: 100 }).notNull(),
  source: varchar("source", { length: 80 }).notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var reverseEngineeringJobs = evercrafted.table("reverseEngineeringJobs", {
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var reverseEngineeringElements = evercrafted.table("reverseEngineeringElements", {
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var signatureWreaths = evercrafted.table("signatureWreaths", {
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var signatureWreathAssets = evercrafted.table("signatureWreathAssets", {
  id: serial("id").primaryKey(),
  signatureWreathId: integer("signatureWreathId").notNull(),
  renderAssetId: integer("renderAssetId"),
  fileKey: varchar("fileKey", { length: 400 }).notNull(),
  url: text("url").notNull(),
  kind: signatureWreathAssetKindEnum("kind").notNull(),
  sortOrder: integer("sortOrder").default(0).notNull(),
  approved: boolean("approved").default(false).notNull(),
  provenance: json("provenance").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});

// shared/inventory.ts
function canonicalStructuralRole(item) {
  const rawRoles = Array.isArray(item.structural_roles) ? item.structural_roles : item.structural_roles != null ? [item.structural_roles] : [];
  const explicit = [...rawRoles, item.structural_role, item.preferred_role].filter((value) => typeof value === "string" && value.trim()).map((value) => String(value).trim().toLowerCase());
  const role = explicit.find((value) => /green|foliage|leaf/.test(value));
  if (role) return "greenery";
  const colorFamily = String(item.color_family ?? "").toLowerCase();
  const classification = String(item.classification ?? item.item_type ?? "").toLowerCase();
  if (/greenery|foliage/.test(classification) || /green|olive|sage/.test(colorFamily)) return "greenery";
  return explicit[0] ?? null;
}
function mapEvsFisa(item) {
  const roles = Array.isArray(item.structural_roles) ? item.structural_roles.map(String) : item.structural_roles != null ? [String(item.structural_roles)] : [];
  const canonicalRole = canonicalStructuralRole(item);
  const tags = Array.isArray(item.evs_emotion_tags) ? item.evs_emotion_tags.map(String) : Array.isArray(item.emotion_tags) ? item.emotion_tags.map(String) : [];
  const colorFamily = String(item.color_family ?? "unknown");
  const formFactor = String(item.form_factor ?? "stem");
  const isGreenery = roles.some((role) => /green|foliage|leaf/i.test(role)) || /green|olive|sage/i.test(colorFamily);
  const atmosphere = tags.length ? tags.slice(0, 4) : [isGreenery ? "grounded" : "quiet beauty"];
  return {
    classification: isGreenery ? "GREENERY" : formFactor.toUpperCase().includes("BUNDLE") ? "SPRAY_BUNDLE" : "INDIVIDUAL_STEM",
    physical: { stemLengthIn: item.stem_length_in ?? null, formFactor, colorFamily, colorName: item.color_name ?? null },
    spatial: { preferredRole: canonicalRole ?? roles[0] ?? (isGreenery ? "greenery" : "secondary"), bend: isGreenery ? "supporting_arc" : "upright_or_splay", scale: Number(item.stem_length_in ?? 24) > 30 ? "tall" : "mid" },
    emotion: { tags: atmosphere, intensity: tags.length >= 3 ? "high" : tags.length === 2 ? "medium" : "low", atmosphere: atmosphere[0] },
    pairing: { companions: isGreenery ? ["focal", "secondary"] : ["greenery", "filler"], avoid: colorFamily === "burgundy" ? ["neon", "cool_primary"] : [] },
    provenance: { sourceSku: item.source_sku ?? item.item_id ?? null, sourceBatch: item.source_batch ?? null, mapperVersion: "EVS-FISA-1.1" }
  };
}

// server/db.ts
var _db = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(postgres(process.env.DATABASE_URL, { max: 1 }));
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  const values = { openId: user.openId };
  const updateSet = {};
  const textFields = ["name", "email", "loginMethod"];
  for (const field of textFields) {
    if (user[field] !== void 0) {
      values[field] = user[field] ?? null;
      updateSet[field] = values[field];
    }
  }
  if (user.lastSignedIn !== void 0) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== void 0) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = /* @__PURE__ */ new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = /* @__PURE__ */ new Date();
  await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function listInventoryItems(limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inventoryItems).orderBy(desc(inventoryItems.createdAt)).limit(limit).offset(offset);
}
async function countInventoryItems() {
  const db = await getDb();
  if (!db) return 0;
  const [row] = await db.select({ count: sql`count(*)` }).from(inventoryItems);
  return Number(row?.count ?? 0);
}
async function saveInventoryBatch(filename, items, validationReport) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const batchInsert = await db.insert(inventoryBatches).values({ filename, itemCount: items.length, processedCount: 0, status: "importing", validationReport, sourcePayload: items }).returning({ id: inventoryBatches.id });
  const batchId = batchInsert[0].id;
  const rows = items.map((item) => {
    const itemId = String(item.item_id ?? item.source_sku ?? "");
    return itemId ? {
      itemId,
      sourceSku: String(item.source_sku ?? itemId),
      name: String(item.name ?? "Unnamed botanical"),
      productUrl: item.product_url ? String(item.product_url) : null,
      imageUrl: item.image_url_guess ? String(item.image_url_guess) : null,
      colorHex: item.color_hex ? String(item.color_hex) : null,
      colorName: item.color_name ? String(item.color_name) : null,
      colorFamily: item.color_family ? String(item.color_family) : null,
      status: String(item.status ?? "active"),
      costPerStemUsd: item.cost_per_stem_usd ? String(item.cost_per_stem_usd) : null,
      structuralRole: canonicalStructuralRole(item),
      formFactor: item.form_factor ? String(item.form_factor) : null,
      stemLengthIn: item.stem_length_in ? String(item.stem_length_in) : null,
      emotionTags: item.evs_emotion_tags ?? item.emotion_tags ?? [],
      evsProfile: mapEvsFisa(item),
      reviewFlags: item._needs_review ?? {},
      approved: false
    } : null;
  }).filter((row) => Boolean(row));
  try {
    const chunkSize = 100;
    for (let start = 0; start < rows.length; start += chunkSize) {
      const chunk = rows.slice(start, start + chunkSize);
      await db.insert(inventoryItems).values(chunk).onConflictDoUpdate({
        target: inventoryItems.itemId,
        set: { name: sql`excluded."name"`, imageUrl: sql`excluded."imageUrl"`, reviewFlags: sql`excluded."reviewFlags"` }
      });
      await db.update(inventoryBatches).set({ processedCount: Math.min(start + chunk.length, rows.length) }).where(eq(inventoryBatches.id, batchId));
    }
    await db.update(inventoryBatches).set({ processedCount: rows.length, status: "completed" }).where(eq(inventoryBatches.id, batchId));
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "Inventory batch persistence failed.";
    await db.update(inventoryBatches).set({ status: "failed", errorMessage: message }).where(eq(inventoryBatches.id, batchId));
    throw error;
  }
  return { batchId, inserted: rows.length, status: "completed" };
}
async function saveFloralDecision(input) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(floralSelections).values(input);
  return input;
}
async function listFloralDecisions(projectId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(floralSelections).where(eq(floralSelections.projectId, projectId)).orderBy(desc(floralSelections.createdAt));
}
async function hasEntitlement(userId, feature) {
  const db = await getDb();
  if (!db) return false;
  const rows = await db.select().from(entitlements).where(eq(entitlements.userId, userId)).limit(100);
  return rows.some((row) => row.feature === feature && (!row.expiresAt || row.expiresAt.getTime() > Date.now()));
}
async function getUserPlanCode(userId) {
  const db = await getDb();
  if (!db) return "reader";
  const active = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).orderBy(desc(subscriptions.updatedAt)).limit(5);
  const current = active.find((subscription) => subscription.status === "active" || subscription.status === "trialing");
  if (!current) return "reader";
  const planRows = await db.select().from(plans).where(eq(plans.id, current.planId)).limit(1);
  const code = planRows[0]?.code;
  return code === "studio" ? "studio" : code === "maker" ? "maker" : "reader";
}

// server/routers.ts
import { and, asc, desc as desc2, eq as eq3, inArray, ne } from "drizzle-orm";

// shared/composition.ts
var roleOrder = ["focal", "secondary", "filler", "greenery"];
var selectionOrder = ["greenery", "focal", "secondary", "filler"];
var roleTarget = { focal: 3, secondary: 5, filler: 8, greenery: 10 };
function seeded(seed) {
  let state = Math.abs(seed || 1) % 2147483647;
  return () => (state = state * 16807 % 2147483647) / 2147483647;
}
function matchScore(item, brief, role) {
  const tags = new Set([brief.primary, ...brief.secondary].map((value) => value.toLowerCase()));
  const itemTags = item.emotionTags.map((value) => value.toLowerCase());
  const emotion = itemTags.some((tag) => tags.has(tag)) ? 3 : 0;
  const palette = brief.palette.some((value) => [item.colorFamily, item.colorHex, item.name].filter(Boolean).some((candidate) => String(candidate).toLowerCase().includes(value.toLowerCase()))) ? 2 : 0;
  const structural = (item.structuralRole ?? "").toLowerCase() === role ? 2 : 0;
  const approved = item.approved === false ? -5 : 1;
  const active = item.status === "active" ? 1 : -4;
  return emotion + palette + structural + approved + active;
}
function pickFlorals(items, brief, seed) {
  const random = seeded(seed);
  const used = /* @__PURE__ */ new Set();
  const recipe = Object.fromEntries(roleOrder.map((role) => [role, []]));
  for (const role of selectionOrder) {
    const available = items.filter((item) => !used.has(item.itemId) && item.status !== "inactive");
    const roleCandidates = role === "greenery" ? available.filter((item) => (item.structuralRole ?? "").toLowerCase().includes("green") || (item.colorFamily ?? "").toLowerCase().match(/green|olive|sage|foliage/)) : available;
    const candidates = (roleCandidates.length ? roleCandidates : role === "greenery" ? [] : available).map((item) => {
      const score = matchScore(item, brief, role);
      const tier = score >= 6 ? "A" : score >= 4 ? "B" : "C";
      return { item, score, tier };
    }).sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name));
    const count = role === "focal" ? 1 : role === "greenery" ? 2 : 2;
    for (let index = 0; index < count && candidates.length; index++) {
      const offset = Math.floor(random() * Math.min(3, candidates.length));
      const chosen = candidates.splice(offset, 1)[0];
      if (!chosen) continue;
      used.add(chosen.item.itemId);
      recipe[role].push({ ...chosen.item, tier: chosen.tier, estimatedPieces: Math.max(1, Math.round(roleTarget[role] / count)), selectionReason: `${chosen.tier} match: ${role} role, ${brief.primary} emotional signal, and ${brief.palette.join(" / ")} palette compatibility.` });
    }
  }
  return { seed, recipe };
}
function composeBlueprint(recipe, brief, seed, sizeIn = 24) {
  const objects = [];
  const roleDepth = { greenery: 1, filler: 2, secondary: 3, focal: 4 };
  const roleFunction = { greenery: "rest", filler: "texture", secondary: "transition", focal: "anchor" };
  let index = 0;
  for (const role of roleOrder) {
    const elements = recipe[role] ?? [];
    elements.forEach((item, itemIndex) => {
      const base = role === "focal" ? 180 : role === "secondary" ? 60 + itemIndex * 120 : role === "filler" ? 25 + itemIndex * 55 : 315 + itemIndex * 32;
      const theta = (base + seed % 11 - 5 + 360) % 360;
      const radius = role === "greenery" ? 0.38 : role === "filler" ? 0.62 : role === "secondary" ? 0.72 : 0.78;
      objects.push({ id: `stem_${String(index++).padStart(3, "0")}`, asset: item.itemId, layer: role, theta, radius, scale: role === "focal" ? 1.08 : role === "secondary" ? 0.9 : 0.72, rotation: Math.round((theta + 180) % 360), depth: roleDepth[role], composition: { compositionFunction: roleFunction[role], visualMass: role === "focal" ? 0.86 : role === "secondary" ? 0.58 : 0.28, emotionalWeight: role === "focal" ? 0.92 : role === "secondary" ? 0.64 : 0.34, attentionPriority: role === "focal" ? 1 : 2 } });
    });
  }
  const ringBands = [{ name: "inner", radius: 0.38, role: "greenery" }, { name: "middle", radius: 0.62, role: "filler" }, { name: "outer", radius: 0.72, role: "secondary" }, { name: "anchor", radius: 0.78, role: "focal" }];
  const clusters = objects.reduce((acc, object) => {
    const key = object.layer === "focal" ? "anchor" : object.theta < 180 ? "left" : "right";
    (acc[key] ??= []).push(object.id);
    return acc;
  }, {});
  const placementMap = objects.map((object) => ({ id: object.id, asset: object.asset, layer: object.layer, angle: object.theta, clock: `${Math.round(object.theta / 30) || 12} o'clock`, radius: object.radius, density: object.layer === "focal" ? "high" : object.layer === "secondary" ? "medium" : "low" }));
  const stemCounts = objects.reduce((acc, object) => {
    acc[object.asset] = (acc[object.asset] ?? 0) + 1;
    return acc;
  }, {});
  return { schema: "EC_WR_V2", version: "2.0", sizeIn, formula: brief.formula, seed, silenceArc: brief.silenceArc, emotion: brief.primary, ringBands, layerOrder: ["greenery", "filler", "secondary", "focal"], clusters, placementMap, stemCounts, objects, validation: { oddClusterCount: true, silenceArcProtected: true, deterministic: true } };
}

// shared/rendering.ts
function hash(input) {
  let value = 2166136261;
  for (let i = 0; i < input.length; i++) value = Math.imul(value ^ input.charCodeAt(i), 16777619);
  return (value >>> 0).toString(16).padStart(8, "0");
}
function compileEcr(blueprint, manifestVersion = "2026.08", canonVersion = "2026.08") {
  const blueprintHash = hash(JSON.stringify(blueprint));
  const outerRadius = blueprint.sizeIn * 0.5;
  return {
    ecrVersion: "1.1",
    blueprintHash,
    seed: blueprint.seed,
    sizeIn: blueprint.sizeIn,
    objects: blueprint.objects.map((object) => {
      const radians = object.theta * Math.PI / 180;
      return { ...object, xPx: Number((outerRadius * object.radius * Math.sin(radians)).toFixed(3)), yPx: Number((-outerRadius * object.radius * Math.cos(radians)).toFixed(3)), mirror: false, pivot: "visual_centroid", bend: null };
    }),
    dependencies: { assetManifestVersion: manifestVersion, floralCanonVersion: canonVersion },
    renderProfile: { minimumPx: 3e3, fidelityGate: "proof_only" }
  };
}
function compileMidjourneyPrompt(blueprint, names = {}) {
  const grouped = /* @__PURE__ */ new Map();
  for (const object of blueprint.objects) {
    const list = grouped.get(object.layer) ?? [];
    list.push(`${names[object.asset] ?? object.asset} at ${Math.round(object.theta)}\xB0`);
    grouped.set(object.layer, list);
  }
  const florals = Array.from(grouped.entries()).map(([layer, items]) => `${layer}: ${items.join(", ")}`).join("; ");
  const machineFacing = `[IDENTITY] high-end faux botanical wreath
[FORMULA] ${blueprint.formula}; emotional register ${blueprint.emotion}
[COMPOSITION] 360-degree radial attachment, asymmetrical visual mass, protected silence arc ${blueprint.silenceArc[0]}\u2013${blueprint.silenceArc[1]} degrees
[PLACEMENT] ${florals}
[STYLE_DNA] silk florals, latex-coated petals, wired stems, fabric leaves with visible vein structure, subtle artificial construction details, stems integrated into a grapevine base
[SURFACE] matte petals with slightly uniform edges, semi-gloss foliage with controlled sheen, no fresh-flower translucency
[ENVIRONMENT] neutral luxury interior, plaster wall or paneled entry, editorial catalog setting
[LIGHT] soft directional 12pm daylight simulation, studio-quality shadows
[PHOTOGRAPHY] 85mm editorial lens, shallow but controlled depth of field
[STYLE] luxury editorial, high-end catalog photography, restoration hardware aesthetic, composed and intentional, premium faux botanical
[NEGATIVE] no fresh flowers, dew, water droplets, wild garden, outdoor setting, hyper-natural imperfections, floral field styling, bouquet convergence, perfect symmetry, ribbon
[PARAMS] --style raw --s 150 --q 2 --v 7 --no fresh flowers, dew, water droplets, wild garden, outdoor setting, hyper-natural imperfections, floral field styling`;
  const humanFacing = `Photorealistic ${blueprint.sizeIn}-inch luxury faux botanical wreath in a neutral luxury interior with a plaster wall or paneled entry, composed with ${blueprint.formula.toLowerCase()} movement and deliberately asymmetric visual mass. ${florals}. Silk florals, latex-coated petals, wired stems, fabric leaves with visible vein structure, subtle artificial construction details, stems integrated into a grapevine base, matte petals, semi-gloss foliage, editorial catalog photography, restoration hardware aesthetic, composed and intentional, premium faux botanical. Soft directional 12pm daylight simulation, studio-quality shadows, 85mm editorial lens, shallow but controlled depth of field. --style raw --s 150 --q 2 --v 7 --no fresh flowers, dew, water droplets, wild garden, outdoor setting, hyper-natural imperfections, floral field styling`;
  return { machineFacing, humanFacing };
}

// server/storage.ts
function getForgeConfig() {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;
  if (!forgeUrl || !forgeKey) {
    throw new Error(
      "Storage config missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }
  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function appendHashSuffix(relKey) {
  const hash2 = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash2}`;
  return `${relKey.slice(0, lastDot)}_${hash2}${relKey.slice(lastDot)}`;
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = appendHashSuffix(normalizeKey(relKey));
  const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
  presignUrl.searchParams.set("path", key);
  const presignResp = await fetch(presignUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` }
  });
  if (!presignResp.ok) {
    const msg = await presignResp.text().catch(() => presignResp.statusText);
    throw new Error(`Storage presign failed (${presignResp.status}): ${msg}`);
  }
  const { url: s3Url } = await presignResp.json();
  if (!s3Url) throw new Error("Forge returned empty presign URL");
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
  const uploadResp = await fetch(s3Url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob
  });
  if (!uploadResp.ok) {
    throw new Error(`Storage upload to S3 failed (${uploadResp.status})`);
  }
  return { key, url: `/manus-storage/${key}` };
}
async function storageGetSignedUrl(relKey) {
  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = normalizeKey(relKey);
  const getUrl = new URL("v1/storage/presign/get", forgeUrl + "/");
  getUrl.searchParams.set("path", key);
  const resp = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` }
  });
  if (!resp.ok) {
    const msg = await resp.text().catch(() => resp.statusText);
    throw new Error(`Storage signed URL failed (${resp.status}): ${msg}`);
  }
  const { url } = await resp.json();
  return url;
}

// server/cometapi.ts
var COMETAPI_BASE_URL2 = "https://api.cometapi.com";
var DEFAULT_POLL_INTERVAL_MS = 2e3;
var DEFAULT_MAX_POLLS = 120;
var DEFAULT_MIDJOURNEY_PARAMETERS = "--raw --exp 5 --q 2 --chaos 10 --stylize 125 --v 7";
function assembleMidjourneyPrompt(prompt, parameters = DEFAULT_MIDJOURNEY_PARAMETERS) {
  const trimmed = prompt.trim();
  if (!parameters || trimmed.includes("--v ")) return trimmed;
  return `${trimmed} ${parameters}`.trim();
}
function getApiKey() {
  const apiKey = process.env.COMETAPI_API_KEY;
  if (!apiKey) throw new Error("COMETAPI_API_KEY is not configured.");
  return apiKey;
}
function findString(value, keys) {
  if (!value || typeof value !== "object") return null;
  for (const key of keys) {
    const candidate = value[key];
    if ((typeof candidate === "string" || typeof candidate === "number") && String(candidate).trim()) return String(candidate);
  }
  for (const child of Object.values(value)) {
    const nested = findString(child, keys);
    if (nested) return nested;
  }
  return null;
}
function findStatus(value) {
  if (findImageUrl(value)) return "success";
  const failure = findString(value, ["failReason", "failureReason", "errorMessage"]);
  if (failure) return "failure";
  const raw = findString(value, ["status", "state", "taskStatus"])?.toLowerCase();
  if (raw && ["success", "succeeded", "completed", "done", "finished"].includes(raw)) return "success";
  if (raw && ["failure", "failed", "error", "cancelled", "canceled"].includes(raw)) return "failure";
  const finishTime = Number(findString(value, ["finishTime", "finishedAt"]));
  if (Number.isFinite(finishTime) && finishTime > 0) return "success";
  return "pending";
}
function findImageUrl(value) {
  const direct = findString(value, ["imageUrl", "image_url", "outputUrl", "output_url", "downloadUrl", "download_url", "image", "images", "result", "output", "url", "uri"]);
  if (direct && /^https?:\/\//.test(direct)) return direct;
  if (!value || typeof value !== "object") return null;
  for (const child of Object.values(value)) {
    const nested = findImageUrl(child);
    if (nested) return nested;
  }
  return null;
}
function findTaskId(value) {
  return findString(value, ["task_id", "taskId", "taskID", "job_id", "jobId", "request_id", "requestId", "generation_id", "generationId", "result", "id"]);
}
function summarizePayload(value) {
  try {
    return JSON.stringify(value).slice(0, 1200);
  } catch {
    return "[unserializable provider response]";
  }
}
async function requestJson(path, init) {
  const response = await fetch(`${COMETAPI_BASE_URL2}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
      ...init.headers ?? {}
    }
  });
  const text2 = await response.text();
  let payload = {};
  try {
    payload = text2 ? JSON.parse(text2) : {};
  } catch {
    payload = { raw: text2 };
  }
  if (!response.ok) throw new Error(`CometAPI ${response.status}: ${typeof payload === "object" ? JSON.stringify(payload) : text2}`);
  return payload && typeof payload === "object" ? payload : {};
}
function buildSubmission(request) {
  const mode = request.mode ?? (request.operation === "describe" || request.operation === "action" ? "TURBO" : "FAST");
  if (request.operation === "upscale") {
    if (!request.sourceTaskId) throw new Error("Upscale requires a source task ID.");
    return { path: "/v1/tasks", body: { model: request.model ?? "mj-fast-upscale-subtle", input: { task_id: request.sourceTaskId, index: request.index ?? 1 } }, pollPath: (taskId) => `/mj/task/${encodeURIComponent(taskId)}/fetch` };
  }
  const pathByOperation = { imagine: "/mj/submit/imagine", describe: "/mj/submit/describe", blend: "/mj/submit/blend", action: "/mj/submit/action" };
  const prompt = request.operation === "imagine" && request.model === "mj-fast-imagine" ? assembleMidjourneyPrompt(request.prompt ?? "", request.parameters) : request.prompt ?? "";
  const body = { prompt, botType: "MID_JOURNEY", accountFilter: { modes: [mode] } };
  if (request.sourceTaskId) body.sourceTaskId = request.sourceTaskId;
  if (request.sourceImageUrls?.length) body.imageUrls = request.sourceImageUrls;
  if (request.index !== void 0) body.index = request.index;
  return { path: pathByOperation[request.operation], body, pollPath: (taskId) => `/mj/task/${encodeURIComponent(taskId)}/fetch` };
}
async function downloadCometImage(imageUrl) {
  if (!/^https?:\/\//.test(imageUrl)) throw new Error("CometAPI returned an invalid image URL.");
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error(`Unable to download CometAPI image (${response.status}).`);
  const contentType = response.headers.get("content-type") ?? "image/png";
  return { buffer: Buffer.from(await response.arrayBuffer()), contentType };
}
async function submitCometTask(request) {
  const submission = buildSubmission(request);
  const created = await requestJson(submission.path, { method: "POST", body: JSON.stringify(submission.body) });
  const taskId = findTaskId(created);
  if (!taskId) {
    const imageUrl = findImageUrl(created);
    if (!imageUrl) throw new Error(`CometAPI returned neither a task ID nor an image URL. Response: ${summarizePayload(created)}`);
    return { taskId: "synchronous", pollPath: submission.pollPath, immediate: { taskId: "synchronous", status: "success", imageUrl, raw: created } };
  }
  return { taskId, pollPath: submission.pollPath, immediate: null };
}
async function pollCometTask(task, options = {}) {
  if (task.immediate) return task.immediate;
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const maxPolls = options.maxPolls ?? DEFAULT_MAX_POLLS;
  for (let attempt = 0; attempt < maxPolls; attempt += 1) {
    const result = await requestJson(task.pollPath(task.taskId), { method: "GET" });
    const status = findStatus(result);
    if (status === "success") return { taskId: task.taskId, status, imageUrl: findImageUrl(result), raw: result };
    if (status === "failure") throw new Error(`CometAPI task ${task.taskId} failed: ${JSON.stringify(result)}`);
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
  throw new Error(`CometAPI task ${task.taskId} did not finish within the polling window.`);
}
async function generateCometRender(request, options = {}) {
  return pollCometTask(await submitCometTask(request), options);
}

// server/stripe.ts
import Stripe from "stripe";
import { eq as eq2 } from "drizzle-orm";
var STRIPE_PLANS = {
  reader: { name: "Reader", description: "Read the story and explore the design direction.", amountCents: 0, recurring: false },
  maker: { name: "Maker", description: "Download the blueprint and build the memory wreath by hand.", amountCents: 1900, recurring: true },
  studio: { name: "Studio", description: "Operate the full pipeline with ECR packages, lookbooks, and render review.", amountCents: 7900, recurring: true }
};
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("Stripe is not configured. Claim the project Stripe sandbox or add keys in Settings \u2192 Payment.");
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-07-29.dahlia" });
}
function buildSignatureCheckoutMetadata(input) {
  return { user_id: String(input.userId), signature_wreath_id: String(input.signatureWreathId), product: "signature_wreath_blueprint" };
}
async function createSignatureCheckout(input) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: input.email ?? void 0,
    client_reference_id: String(input.userId),
    allow_promotion_codes: true,
    line_items: [{ price_data: { currency: "usd", unit_amount: input.priceCents, product_data: { name: `Evercrafted Signature Wreath \u2014 ${input.title}`, description: "A finished wreath, recovered story, and hand-buildable blueprint package." } }, quantity: 1 }],
    metadata: buildSignatureCheckoutMetadata(input),
    success_url: `${input.origin}/signature-wreaths?checkout=success`,
    cancel_url: `${input.origin}/signature-wreaths?checkout=cancelled`
  });
  return { url: session.url };
}
async function createPlanCheckout(input) {
  const plan = STRIPE_PLANS[input.plan];
  if (plan.amountCents <= 0) return { url: `${input.origin}/workspace?plan=reader` };
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: plan.recurring ? "subscription" : "payment",
    customer_email: input.email ?? void 0,
    client_reference_id: String(input.userId),
    allow_promotion_codes: true,
    line_items: [{ price_data: { currency: "usd", unit_amount: plan.amountCents, recurring: plan.recurring ? { interval: "month" } : void 0, product_data: { name: `Evercrafted ${plan.name}`, description: plan.description } }, quantity: 1 }],
    metadata: { user_id: String(input.userId), customer_email: input.email ?? "", customer_name: input.name ?? "", plan: input.plan },
    success_url: `${input.origin}/workspace?checkout=success&plan=${input.plan}`,
    cancel_url: `${input.origin}/workspace?checkout=cancelled`
  });
  return { url: session.url };
}

// server/entitlements.ts
var PLAN_CAPABILITIES = {
  reader: { canReadStory: true, canDownloadBlueprint: false, canPackageEcr: false, canPublishLookbook: false, canUploadRender: false },
  maker: { canReadStory: true, canDownloadBlueprint: true, canPackageEcr: false, canPublishLookbook: false, canUploadRender: false },
  studio: { canReadStory: true, canDownloadBlueprint: true, canPackageEcr: true, canPublishLookbook: true, canUploadRender: true }
};
function getPlanCapabilities(plan) {
  return PLAN_CAPABILITIES[plan];
}
function canUse(plan, feature) {
  return PLAN_CAPABILITIES[plan][feature];
}

// shared/reverseEngineering.ts
var reverseEngineeringSchema = {
  type: "object",
  properties: {
    form: { type: "object", properties: { shape: { type: "string" }, sizeIn: { type: "number" }, symmetry: { type: "string" }, density: { type: "string" } }, required: ["shape", "sizeIn", "symmetry", "density"], additionalProperties: false },
    palette: { type: "object", properties: { dominant: { type: "string" }, secondary: { type: "string" }, accent: { type: "string" }, ratio: { type: "string" } }, required: ["dominant", "secondary", "accent", "ratio"], additionalProperties: false },
    emotionProfile: { type: "object", properties: { primary: { type: "string" }, secondary: { type: "string" } }, required: ["primary", "secondary"], additionalProperties: false },
    season: { type: "string" },
    style: { type: "string" },
    confidenceOverall: { type: "string", enum: ["high", "medium", "low"] },
    flags: { type: "array", items: { type: "string" } },
    florals: { type: "array", items: { type: "object", properties: { role: { type: "string", enum: ["focal", "secondary", "filler", "greenery", "accent"] }, identifiedAs: { type: "string" }, confidence: { type: "string", enum: ["high", "medium", "low"] }, color: { type: "string" }, estimatedStemCount: { type: "integer" }, placementZones: { type: "array", items: { type: "string" } }, skuMatch: { type: ["string", "null"] }, skuNeeded: { type: "boolean" }, flag: { type: ["string", "null"] } }, required: ["role", "identifiedAs", "confidence", "color", "estimatedStemCount", "placementZones", "skuMatch", "skuNeeded", "flag"], additionalProperties: false } },
    stemCountTotal: { type: "integer" },
    clusterCount: { type: "integer" },
    notes: { type: "string" }
  },
  required: ["form", "palette", "emotionProfile", "season", "style", "confidenceOverall", "flags", "florals", "stemCountTotal", "clusterCount", "notes"],
  additionalProperties: false
};
function sanitizeReverseEngineering(input) {
  return {
    ...input,
    florals: input.florals.map((floral) => ({ ...floral, skuMatch: null, skuNeeded: true, estimatedStemCount: Math.max(0, Math.round(floral.estimatedStemCount || 0)) })),
    stemCountTotal: Math.max(0, Math.round(input.stemCountTotal || 0)),
    clusterCount: Math.max(1, Math.round(input.clusterCount || 1)),
    flags: Array.from(/* @__PURE__ */ new Set([...input.flags ?? [], "SKU matches require operator confirmation against approved inventory."]))
  };
}

// shared/emotionalDesign.ts
import { z as z2 } from "zod";
var atmosphereArchetypes = ["Quiet Opulence", "Weathered Romance", "Sacred Warmth", "Lingering Autumn", "Velvet Stillness", "Candlelit Gathering", "Garden Memory", "Coastal Melancholy", "Wild Ceremony", "Soft Grandeur", "Inherited Beauty", "Winter Reverence", "Faded Celebration", "Untamed Elegance", "Gilded Silence", "Reverence", "Ceremony", "Stillness", "Tension", "Drift", "Inheritance", "Echo", "Sanctuary"];
var movementArchetypes = ["Still", "Cascade", "Taper Fade", "Drift", "Side Sweep", "Orbit", "Spiral", "Rhythmic", "Restless", "Reaching", "Garden Scatter", "Wild Lift"];
var enumOf = (values) => z2.enum(values);
var color = z2.object({ hex: z2.string().regex(/^#[0-9a-fA-F]{6}$/), name: z2.string().min(2).max(80) });
var emotionalDesignProfileSchema = z2.object({
  emotionalCore: z2.object({ primaryEmotion: z2.string().min(2), secondaryEmotions: z2.array(z2.string().min(2)).min(2).max(4), emotionalTemperature: enumOf(["cool", "neutral", "warm", "hot"]), emotionalWeight: enumOf(["featherlight", "balanced", "grounded", "heavy"]), emotionalPacing: enumOf(["still", "slow", "rhythmic", "restless", "urgent"]), emotionalTension: enumOf(["resolved", "suspended", "building", "aching", "released"]) }),
  paletteSystem: z2.object({ dominantColor: color, supportingColors: z2.array(color).min(2).max(4), accentColor: color, negativeSpaceColor: color, colorTemperature: enumOf(["cool", "warm", "split-toned", "desaturated"]), colorSaturation: enumOf(["muted", "low", "medium", "high", "saturated"]) }),
  textureMaterial: z2.object({ primaryTexture: z2.string().min(2), secondaryTextures: z2.array(z2.string().min(2)).min(2).max(3), materialWeight: enumOf(["delicate", "medium", "substantial", "architectural"]), surfaceQuality: enumOf(["matte", "satin", "luminous", "worn", "patinated"]), organicVsStructured: z2.number().min(0).max(10) }),
  movementEnergy: z2.object({ movementArchetype: z2.array(enumOf(movementArchetypes)).min(1).max(2), directionalEnergy: z2.string().min(2), tensionType: z2.string().min(2), rhythmQuality: enumOf(["even", "syncopated", "sparse", "dense", "erratic"]) }),
  densitySpace: z2.object({ overallDensity: enumOf(["sparse", "open", "balanced", "lush", "saturated"]), focalDensity: z2.string().min(2), negativeSpaceRole: enumOf(["breathing room", "dramatic void", "structural silence", "counterweight"]), layeringDepth: enumOf(["flat", "shallow", "mid", "deep", "dimensional"]) }),
  asymmetryComposition: z2.object({ asymmetryType: enumOf(["balanced asymmetry", "weighted asymmetry", "intentional imbalance", "structural tension"]), dominantQuadrant: enumOf(["top-left", "top-right", "bottom-left", "bottom-right", "center"]), secondaryPull: z2.string().min(2), silenceZone: z2.string().min(2) }),
  lightQuality: z2.object({ lightCharacter: z2.string().min(2), shadowBehavior: enumOf(["soft", "crisp", "long", "absent"]), luminosity: enumOf(["dim", "low", "balanced", "bright", "radiant"]) }),
  atmosphere: z2.object({ atmosphereArchetype: enumOf(atmosphereArchetypes), sensoryAnchors: z2.array(z2.string().min(2)).min(2).max(3), timeOfDayFeeling: enumOf(["dawn", "morning", "afternoon", "golden hour", "dusk", "night"]), seasonalResonance: enumOf(["early spring", "late summer", "peak autumn", "deep winter", "transitional"]) }),
  wreathTranslation: z2.object({ compositionFormula: z2.enum(["Crescent", "Side Sweep", "Bottom Heavy", "Diagonal Flow", "Twin Cluster", "Corner Cluster", "Wild Asymmetry", "Half Ring", "Top Cluster", "Spiral Flow", "Classic Balanced", "Garden Scatter"]), ringBands: z2.array(z2.object({ name: z2.enum(["A", "B", "C", "D"]), role: z2.string().min(2), radius: z2.tuple([z2.number().min(0).max(1), z2.number().min(0).max(1)]) })).length(4), silenceArc: z2.tuple([z2.number().min(0).max(360), z2.number().min(0).max(360)]), clusterBehavior: z2.array(z2.string().min(2)).min(2).max(4), seasonalDriftTags: z2.array(z2.string().min(2)).min(1).max(5), blueprintEmotionTags: z2.array(z2.string().min(2)).min(3).max(12), sourcingNotes: z2.array(z2.string().min(2)).max(8) }),
  provenance: z2.object({ intakeId: z2.number().int().positive().optional(), sourceMemoryHash: z2.string().min(8).optional(), provider: z2.string().min(1).optional(), endpoint: z2.string().url().optional(), modelVersion: z2.string().min(1), schemaVersion: z2.string().min(1), generatedAt: z2.number().int().positive(), overrides: z2.record(z2.string(), z2.unknown()).default({}) })
});
var emotionalProfileOverrideSchema = z2.object({ primaryEmotion: z2.string().min(2).max(80).optional(), atmosphereArchetype: enumOf(atmosphereArchetypes).optional(), emotionalWeight: enumOf(["featherlight", "balanced", "grounded", "heavy"]).optional(), emotionalPacing: enumOf(["still", "slow", "rhythmic", "restless", "urgent"]).optional(), directionalEnergy: z2.string().min(2).max(240).optional(), overallDensity: enumOf(["sparse", "open", "balanced", "lush", "saturated"]).optional(), asymmetryType: enumOf(["balanced asymmetry", "weighted asymmetry", "intentional imbalance", "structural tension"]).optional(), compositionFormula: z2.enum(["Crescent", "Side Sweep", "Bottom Heavy", "Diagonal Flow", "Twin Cluster", "Corner Cluster", "Wild Asymmetry", "Half Ring", "Top Cluster", "Spiral Flow", "Classic Balanced", "Garden Scatter"]).optional(), silenceArc: z2.tuple([z2.number().min(0).max(360), z2.number().min(0).max(360)]).optional() }).strict();
function applyEmotionalOverrides(profile, overrides) {
  const safeOverrides = emotionalProfileOverrideSchema.parse(overrides);
  const next = structuredClone(profile);
  if (safeOverrides.primaryEmotion) next.emotionalCore.primaryEmotion = safeOverrides.primaryEmotion;
  if (safeOverrides.emotionalWeight) next.emotionalCore.emotionalWeight = safeOverrides.emotionalWeight;
  if (safeOverrides.emotionalPacing) next.emotionalCore.emotionalPacing = safeOverrides.emotionalPacing;
  if (safeOverrides.atmosphereArchetype) next.atmosphere.atmosphereArchetype = safeOverrides.atmosphereArchetype;
  if (safeOverrides.directionalEnergy) next.movementEnergy.directionalEnergy = safeOverrides.directionalEnergy;
  if (safeOverrides.overallDensity) next.densitySpace.overallDensity = safeOverrides.overallDensity;
  if (safeOverrides.asymmetryType) next.asymmetryComposition.asymmetryType = safeOverrides.asymmetryType;
  if (safeOverrides.compositionFormula) next.wreathTranslation.compositionFormula = safeOverrides.compositionFormula;
  if (safeOverrides.silenceArc) next.wreathTranslation.silenceArc = safeOverrides.silenceArc;
  return emotionalDesignProfileSchema.parse(next);
}
function deriveCompositionFormula(profile) {
  const { emotionalWeight, emotionalPacing } = profile.emotionalCore;
  const { asymmetryType } = profile.asymmetryComposition;
  if (asymmetryType === "structural tension") return "Diagonal Flow";
  if (emotionalWeight === "heavy" && profile.densitySpace.overallDensity === "lush") return "Bottom Heavy";
  if (emotionalPacing === "restless") return "Side Sweep";
  if (profile.movementEnergy.movementArchetype.includes("Spiral")) return "Spiral Flow";
  if (asymmetryType === "weighted asymmetry") return "Crescent";
  return "Classic Balanced";
}
function deriveRingBands(profile) {
  const coreRole = profile.emotionalCore.emotionalWeight === "heavy" || profile.emotionalCore.emotionalWeight === "grounded" ? "emotional anchor" : "emotional seed";
  return [
    { name: "A", role: coreRole, radius: [0, 0.25] },
    { name: "B", role: "supporting emotional body", radius: [0.25, 0.5] },
    { name: "C", role: "movement and texture", radius: [0.5, 0.75] },
    { name: "D", role: "whisper zone and taper", radius: [0.75, 1] }
  ];
}
function validateEmotionalProfile(value) {
  return emotionalDesignProfileSchema.parse(value);
}

// shared/signaturePipeline.ts
import { gzipSync } from "node:zlib";

// shared/ecrpkg.ts
function buildEcrPackage(scene, manifestSlice, blueprintId) {
  return {
    packageVersion: "1.1",
    files: {
      "scene.ecr.json": scene,
      "assets.manifest": manifestSlice,
      "dependencies.lock": { ecrPackage: "1.1", dependencies: { blueprint: { id: blueprintId, hash: scene.blueprintHash }, assetManifestVersion: scene.dependencies.assetManifestVersion, floralCanonVersion: scene.dependencies.floralCanonVersion } },
      "render.profile": scene.renderProfile
    }
  };
}

// shared/signaturePipeline.ts
function buildEvsFisaReview(input) {
  return { decision: input.decision, note: input.note, overrides: input.overrides, reviewedBy: input.reviewedBy, reviewedAt: input.reviewedAt };
}
function mergeEvsFisaReview(analysis, review) {
  return { ...analysis, evsFisaReview: review };
}
function buildSignatureArtifactMetadata(key) {
  return { key, mimeType: "application/vnd.evercrafted.ecrpkg+gzip", extension: ".ecrpkg", expiresInSeconds: 900 };
}
function profileAssembledWreath(analysis) {
  return {
    classification: "ASSEMBLED_WREATH",
    atmosphere: `${analysis.season} ${analysis.style}`,
    primaryEmotion: analysis.emotionProfile.primary,
    secondaryEmotion: analysis.emotionProfile.secondary,
    palette: [analysis.palette.dominant, analysis.palette.secondary, analysis.palette.accent],
    structure: analysis.form.shape,
    density: analysis.form.density,
    stemCount: analysis.stemCountTotal,
    confidence: analysis.confidenceOverall,
    reviewFlags: analysis.flags
  };
}
function buildReverseRecipe(analysis) {
  return {
    version: "RECIPE_REVERSE_V1",
    items: analysis.florals.map((floral) => ({ name: floral.identifiedAs, role: floral.role, quantity: floral.estimatedStemCount, sku: floral.skuMatch, skuNeeded: floral.skuNeeded, placementZones: floral.placementZones, confidence: floral.confidence })),
    unresolvedCount: analysis.florals.filter((floral) => floral.skuNeeded).length
  };
}
function buildWgsReverseGenome(analysis) {
  const tokens = analysis.florals.map((floral) => `${floral.role}:${floral.identifiedAs.replace(/\\s+/g, "-").toLowerCase()}:${floral.estimatedStemCount}`).join("|");
  return `WGS-RE|${analysis.form.shape}|${analysis.emotionProfile.primary}|${tokens}`;
}
function serializeEcrPackage(pkg) {
  return gzipSync(Buffer.from(JSON.stringify(pkg)));
}
function buildReverseEcrPackage(analysis) {
  const objects = analysis.florals.flatMap((floral, floralIndex) => floral.placementZones.map((zone, zoneIndex) => {
    const match = zone.match(/(\\d{1,3})/);
    const theta = Math.min(359, Math.max(0, Number(match?.[1] ?? (floralIndex * 47 + zoneIndex * 11) % 360)));
    const role = floral.role === "focal" || floral.role === "secondary" ? floral.role : floral.role === "greenery" ? "greenery" : "filler";
    const composition = role === "focal" ? "anchor" : role === "secondary" ? "mass" : role === "greenery" ? "texture" : "transition";
    return { id: `reverse-${floralIndex + 1}-${zoneIndex + 1}`, asset: floral.skuMatch ?? `unresolved-${floral.identifiedAs.toLowerCase().replace(/\\s+/g, "-")}`, layer: role, theta, radius: role === "focal" ? 0.78 : role === "secondary" ? 0.9 : 0.98, scale: 1, rotation: 0, depth: floralIndex + 1, composition: { compositionFunction: composition, visualMass: Math.max(0.1, floral.estimatedStemCount / Math.max(1, analysis.stemCountTotal)), emotionalWeight: floral.confidence === "high" ? 1 : floral.confidence === "medium" ? 0.7 : 0.4, attentionPriority: role === "focal" ? 1 : 0.6 } };
  }));
  const scene = compileEcr({ sizeIn: analysis.form.sizeIn, seed: analysis.stemCountTotal, objects });
  const pkg = buildEcrPackage(scene, analysis.florals.map((floral) => ({ asset: floral.skuMatch, identifiedAs: floral.identifiedAs, skuNeeded: floral.skuNeeded })), `reverse-${analysis.form.shape}-${analysis.stemCountTotal}`);
  return { scene, package: pkg };
}
function buildReverseScoreReport(analysis) {
  const confirmed = analysis.florals.filter((floral) => floral.confidence === "high").length;
  return { version: "SCORE_REVERSE_V1", overall: analysis.confidenceOverall, floralConfidence: analysis.florals.length ? Math.round(confirmed / analysis.florals.length * 100) : 0, unresolvedSkuCount: analysis.florals.filter((floral) => floral.skuNeeded).length, flags: analysis.flags };
}
function buildReverseBlueprint(analysis) {
  return {
    version: "BLUEPRINT_REVERSE_V1",
    formula: analysis.form.shape,
    sizeIn: analysis.form.sizeIn,
    density: analysis.form.density,
    palette: [analysis.palette.dominant, analysis.palette.secondary, analysis.palette.accent],
    clusters: analysis.florals.map((floral, index) => ({ id: `${floral.role}-${index + 1}`, role: floral.role, placementZones: floral.placementZones, stemCount: floral.estimatedStemCount })),
    stemCountTotal: analysis.stemCountTotal,
    clusterCount: analysis.clusterCount,
    silenceArc: analysis.form.symmetry.toLowerCase().includes("asym") ? [300, 30] : [0, 0],
    reviewStatus: "operator_review_required"
  };
}

// shared/lookbookFlow.ts
var buildLookbookSharePath = (token) => `/lookbook/share/${token}`;

// shared/cometPricing.ts
var COMET_REFERENCE_RATES_USD = {
  "mj-fast-imagine": 0.056,
  "mj-fast-upscale-subtle": 0.056,
  "mj-turbo-pic-reader": 0.168,
  "mj-turbo-low-variation": 0.168
};
function estimateCometCost(input) {
  const count = Math.max(0, Math.floor(input.count));
  const unitUsd = COMET_REFERENCE_RATES_USD[input.model] ?? null;
  return {
    model: input.model,
    operation: input.operation,
    count,
    currency: "USD",
    unitUsd,
    totalUsd: unitUsd === null ? null : Number((unitUsd * count).toFixed(3)),
    pricingKnown: unitUsd !== null,
    basis: unitUsd === null ? "unpriced_model" : "public_reference",
    note: unitUsd === null ? "No public reference rate is configured for this model. Confirm pricing in CometAPI before queueing." : "Reference estimate only; CometAPI account pricing and discounts may differ."
  };
}

// server/cometGrid.ts
import sharp from "sharp";
function buildCometPanelProvenance(parent, parentAssetId, panel) {
  return { ...parent, gridSource: false, parentAssetId, panelIndex: panel.panelIndex, panelCount: 4, width: panel.width, height: panel.height, reviewDecision: "pending" };
}
async function splitCometGrid(buffer, enabled) {
  if (!enabled) return [];
  const metadata = await sharp(buffer).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  const aspectRatio = width / Math.max(1, height);
  if (width < 512 || height < 512 || aspectRatio < 0.95 || aspectRatio > 1.05) return [];
  const halfWidth = Math.floor(width / 2);
  const halfHeight = Math.floor(height / 2);
  const rightWidth = width - halfWidth;
  const bottomHeight = height - halfHeight;
  const crops = [
    { panelIndex: 1, left: 0, top: 0, width: halfWidth, height: halfHeight },
    { panelIndex: 2, left: halfWidth, top: 0, width: rightWidth, height: halfHeight },
    { panelIndex: 3, left: 0, top: halfHeight, width: halfWidth, height: bottomHeight },
    { panelIndex: 4, left: halfWidth, top: halfHeight, width: rightWidth, height: bottomHeight }
  ];
  return Promise.all(crops.map(async (crop) => ({
    panelIndex: crop.panelIndex,
    width: crop.width,
    height: crop.height,
    buffer: await sharp(buffer).extract(crop).png().toBuffer()
  })));
}
function isMidjourneyGridOperation(operation) {
  return operation === "imagine";
}

// shared/promptFlow.ts
function buildLifestyleScenePrompts(wreathPrompt, storyBeats = []) {
  const anchor = wreathPrompt ?? "Approved wreath anchor unavailable; preserve the wreath silhouette and open negative-space arc once supplied.";
  const buildPrompt = (title, context, body, camera, light, beatPrompt) => [
    `Lifestyle scene: ${title}.`,
    `Narrative purpose: ${context}.`,
    `Setting and action: ${body}.`,
    `Camera: ${camera}.`,
    `Light and atmosphere: ${light}.`,
    `Story direction: ${beatPrompt}.`,
    `Place the approved wreath naturally within this environment as a lived-in object; preserve its exact floral identity, crescent geometry, scale, asymmetry, and breathing room.`,
    `Wreath anchor reference for continuity only: ${anchor}`,
    "Photorealistic editorial lifestyle photography, tactile materials, believable spatial depth, no isolated product cutout, no redesign of the wreath."
  ].join(" ");
  if (storyBeats.length >= 3) {
    return storyBeats.map((beat, index) => {
      const title = String(beat.name ?? `Story beat ${index + 1}`);
      const context = String(beat.role ?? "Narrative moment");
      const body = String(beat.setting ?? "A lived-in place shaped by the approved emotional profile.");
      const camera = String(beat.camera ?? "Cinematic editorial framing with a clear environmental subject.");
      const light = String(beat.light ?? "Soft atmospheric light shaped by the approved emotional profile.");
      const beatPrompt = String(beat.prompt ?? "Let the scene reveal the next emotional movement of the story.");
      return { number: String(index + 1).padStart(2, "0"), title, context, body, placement: `${camera} \xB7 ${light}`, prompt: typeof beat.prompt === "string" && beat.prompt.trim().length > 0 ? beat.prompt : buildPrompt(title, context, body, camera, light, beatPrompt) };
    });
  }
  return [
    { number: "01", title: "The dock at first light", context: "Threshold", body: "A quiet arrival at a lake-house dock; a hand sets down a woven bag while the morning begins beyond the doorway.", placement: "Wide environmental frame \xB7 soft blue morning light breaking across warm dock wood.", prompt: buildPrompt("The dock at first light", "Threshold", "A quiet arrival at a lake-house dock; a hand sets down a woven bag while the morning begins beyond the doorway", "Wide environmental frame with the doorway and dock leading the eye", "Soft blue morning light breaking across warm dock wood", "The memory begins before the room does, with an arrival that feels familiar rather than staged") },
    { number: "02", title: "Coffee cooling on the rail", context: "Intimate space", body: "A quiet interior after conversation, with coffee cooling on an oak rail and linen catching the last movement of the morning.", placement: "Close environmental portrait \xB7 warm horizontal light with low contrast and tactile shadows.", prompt: buildPrompt("Coffee cooling on the rail", "Intimate space", "A quiet interior after conversation, with coffee cooling on an oak rail and linen catching the last movement of the morning", "Close environmental portrait that keeps the wreath in relationship to the rail and room", "Warm horizontal light with low contrast and tactile shadows", "Let the wreath feel like a witness to the hour after conversation") },
    { number: "03", title: "The entry after the guests leave", context: "Open return", body: "An entry at blue hour, the room holding the traces of company while the open side of the wreath gives the silence somewhere to breathe.", placement: "Balanced architectural frame \xB7 last blue light with a restrained amber practical in the distance.", prompt: buildPrompt("The entry after the guests leave", "Open return", "An entry at blue hour, the room holding the traces of company while the open side of the wreath gives the silence somewhere to breathe", "Balanced architectural frame with generous negative space around the crescent", "Last blue light with a restrained amber practical in the distance", "Allow the story to resolve through absence, spaciousness, and the feeling of return") }
  ];
}

// server/routers.ts
var weaveInput = z3.object({ memory: z3.string().min(25).max(6e3), occasion: z3.string().min(1).max(120), honoree: z3.string().max(160).default(""), location: z3.string().max(240).default(""), whoWasThere: z3.string().max(240).default(""), timeOfDay: z3.string().min(1).max(60), guided: z3.boolean().default(false) });
var weaveSchema = { type: "object", properties: { atmosphere: { type: "string" }, summary: { type: "string" }, story: { type: "string" }, palette: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 } }, required: ["atmosphere", "summary", "story", "palette"], additionalProperties: false };
var inventoryRecord = z3.record(z3.string(), z3.unknown());
var storyInput = z3.object({ memory: z3.string().min(25).max(6e3), atmosphere: z3.string().min(2).max(120), emotionalTags: z3.array(z3.string()).min(1).max(8), palette: z3.array(z3.string()).min(3).max(5), location: z3.string().max(240).default(""), honoree: z3.string().max(160).default("") });
var emotionalProfileInput = z3.object({ projectId: z3.number().int().positive(), intakeId: z3.number().int().positive(), memory: z3.string().min(25).max(6e3), occasion: z3.string().min(1).max(120), location: z3.string().max(240).default(""), timeOfDay: z3.string().min(1).max(60) });
var memoryProjectInput = z3.object({ memory: z3.string().min(25).max(6e3), occasion: z3.string().min(1).max(120), honoree: z3.string().max(160).default(""), location: z3.string().max(240).default(""), whoWasThere: z3.string().max(240).default(""), timeOfDay: z3.string().min(1).max(60), guided: z3.boolean().default(false), name: z3.string().min(1).max(160).default("Memory wreath") });
var deriveMemoryCollectionName = (memory) => {
  const firstThought = memory.trim().split(/[.!?\n]/)[0]?.trim() || "Memory wreath";
  const compact = firstThought.replace(/\s+/g, " ");
  return compact.length > 84 ? `${compact.slice(0, 81).trimEnd()}\u2026` : compact;
};
var storySchema2 = { type: "object", properties: { title: { type: "string" }, body: { type: "string" }, metadata: { type: "object", properties: { atmosphere: { type: "string" }, collectionName: { type: "string" }, movement: { type: "string" }, silenceArc: { type: "array", items: { type: "integer" }, minItems: 2, maxItems: 2 } }, required: ["atmosphere", "collectionName", "movement", "silenceArc"], additionalProperties: false }, beats: { type: "array", minItems: 7, maxItems: 9, items: { type: "object", properties: { name: { type: "string" }, role: { type: "string" }, setting: { type: "string" }, camera: { type: "string" }, light: { type: "string" }, prompt: { type: "string" } }, required: ["name", "role", "setting", "camera", "light", "prompt"], additionalProperties: false } } }, required: ["title", "body", "metadata", "beats"], additionalProperties: false };
var isAdminUser = (user) => user.role === "admin" || user.openId === ENV.ownerOpenId;
async function loadLookbookPresentation(db, lookbook) {
  if (!db) return { ...lookbook, presentation: null };
  const queryResults = await Promise.all([
    db.select().from(stories).where(eq3(stories.projectId, lookbook.projectId)).orderBy(desc2(stories.createdAt)).limit(1),
    db.select().from(blueprints).where(eq3(blueprints.projectId, lookbook.projectId)).orderBy(desc2(blueprints.createdAt)).limit(1),
    db.select().from(floralSelections).where(and(eq3(floralSelections.projectId, lookbook.projectId), eq3(floralSelections.decision, "accepted"))).orderBy(desc2(floralSelections.createdAt)).limit(100),
    db.select().from(renderAssets).where(and(eq3(renderAssets.projectId, lookbook.projectId), eq3(renderAssets.status, "approved"))).orderBy(desc2(renderAssets.createdAt)).limit(100)
  ]);
  const storyRows = queryResults[0] ?? [];
  const blueprintRows = queryResults[1] ?? [];
  const decisionRows = queryResults[2] ?? [];
  const assetRows = queryResults[3] ?? [];
  return { ...lookbook, presentation: { story: storyRows[0] ?? null, blueprint: blueprintRows[0] ?? null, acceptedFlorals: decisionRows, approvedAssets: assetRows } };
}
var adminProcedure2 = protectedProcedure.use(({ ctx, next }) => {
  if (!isAdminUser(ctx.user)) throw new TRPCError3({ code: "FORBIDDEN", message: "Administrator access required." });
  return next();
});
async function processCometTask(taskRowId, request) {
  const db = await getDb();
  if (!db) return;
  const update = (values) => db.update(cometRenderTasks).set(values).where(eq3(cometRenderTasks.id, taskRowId));
  try {
    await update({ status: "submitting", progress: 10, message: "Submitting to CometAPI", startedAt: /* @__PURE__ */ new Date() });
    const submission = await submitCometTask(request);
    await update({ providerTaskId: submission.taskId, status: submission.immediate ? "completed" : "polling", progress: submission.immediate ? 75 : 35, message: submission.immediate ? "Provider returned a result" : "Polling CometAPI task" });
    const result = await pollCometTask(submission);
    if (!result.imageUrl) throw new Error("CometAPI completed without an image URL.");
    const image = await downloadCometImage(result.imageUrl);
    const extension = image.contentType.includes("jpeg") ? "jpg" : image.contentType.includes("webp") ? "webp" : "png";
    const uploaded = await storagePut(`projects/${request.projectId}/cometapi/${request.kind}/${result.taskId}.${extension}`, image.buffer, image.contentType);
    const at = (/* @__PURE__ */ new Date()).toISOString();
    const parentProvenance = { source: "cometapi", provider: "cometapi", operation: request.operation, model: request.model ?? null, mode: request.mode ?? null, taskId: result.taskId, sourceTaskId: request.sourceTaskId ?? null, sourceAssetId: request.parentAssetId ?? null, parentAssetId: request.parentAssetId ?? null, prompt: request.prompt, submittedPrompt: request.operation === "imagine" && request.model === "mj-fast-imagine" ? assembleMidjourneyPrompt(request.prompt, request.parameters) : request.prompt, parameters: request.parameters ?? null, sceneIndex: request.sceneIndex ?? null, sceneTitle: request.sceneTitle ?? null, generatedAt: at, reviewDecision: "pending", gridSource: true, panelCount: 4, estimate: request.estimateMetadata ?? null, estimateConfirmed: Boolean(request.estimateMetadata) };
    const inserted = await db.insert(renderAssets).values({ projectId: request.projectId, kind: request.kind, status: "review", fileKey: uploaded.key, url: uploaded.url, provenance: parentProvenance }).returning({ insertId: renderAssets.id });
    const parentAssetId = Number(inserted[0].insertId);
    const panels = await splitCometGrid(image.buffer, isMidjourneyGridOperation(request.operation));
    for (const panel of panels) {
      const panelUpload = await storagePut(`projects/${request.projectId}/cometapi/${request.kind}/${result.taskId}/panel-${panel.panelIndex}.png`, panel.buffer, "image/png");
      await db.insert(renderAssets).values({ projectId: request.projectId, kind: request.kind, status: "review", fileKey: panelUpload.key, url: panelUpload.url, provenance: buildCometPanelProvenance(parentProvenance, parentAssetId, panel) });
    }
    await update({ renderAssetId: parentAssetId, status: "review_ready", progress: 100, message: panels.length === 4 ? "4-panel grid separated into review assets" : "Render is ready for review", completedAt: /* @__PURE__ */ new Date() });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const timedOut = errorMessage.includes("did not finish within the polling window");
    await update({ status: timedOut ? "polling" : "failed", progress: timedOut ? 60 : 100, message: timedOut ? "Provider is still processing; refresh or resubmit to continue" : "CometAPI task failed", errorMessage: timedOut ? null : errorMessage, completedAt: timedOut ? null : /* @__PURE__ */ new Date() });
  }
}
async function reconcileCometTask(taskRowId) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable.");
  const rows = await db.select().from(cometRenderTasks).where(eq3(cometRenderTasks.id, taskRowId)).limit(1);
  const task = rows[0];
  if (!task || !task.providerTaskId || task.providerTaskId.startsWith("queued-")) throw new Error("This task has not received a provider task ID yet.");
  const result = await pollCometTask({ taskId: task.providerTaskId, pollPath: (id) => `/mj/task/${encodeURIComponent(id)}/fetch`, immediate: null }, { pollIntervalMs: 0, maxPolls: 1 });
  if (!result.imageUrl) throw new Error(`CometAPI task ${task.providerTaskId} completed without an image URL.`);
  const image = await downloadCometImage(result.imageUrl);
  const extension = image.contentType.includes("jpeg") ? "jpg" : image.contentType.includes("webp") ? "webp" : "png";
  const uploaded = await storagePut(`projects/${task.projectId}/cometapi/${task.kind}/${result.taskId}.${extension}`, image.buffer, image.contentType);
  const at = (/* @__PURE__ */ new Date()).toISOString();
  const providerPrompt = typeof result.raw?.prompt === "string" ? String(result.raw.prompt) : "";
  const taskMetadata = task.metadata && typeof task.metadata === "object" ? task.metadata : {};
  const parentProvenance = { source: "cometapi", provider: "cometapi", operation: task.operation, model: task.model, taskId: result.taskId, sourceTaskId: taskMetadata.sourceTaskId ?? null, sourceAssetId: taskMetadata.sourceAssetId ?? null, prompt: providerPrompt, submittedPrompt: providerPrompt, sceneIndex: task.sceneIndex, sceneTitle: task.sceneTitle, generatedAt: at, reviewDecision: "pending", reviewHistory: [{ event: "late_completed", at, taskId: result.taskId }], gridSource: true, panelCount: 4, estimate: taskMetadata.estimate ?? null, estimateConfirmed: Boolean(taskMetadata.estimateConfirmed) };
  const inserted = await db.insert(renderAssets).values({ projectId: task.projectId, kind: task.kind, status: "review", fileKey: uploaded.key, url: uploaded.url, provenance: parentProvenance }).returning({ insertId: renderAssets.id });
  const parentAssetId = Number(inserted[0].insertId);
  const panels = await splitCometGrid(image.buffer, isMidjourneyGridOperation(task.operation));
  for (const panel of panels) {
    const panelUpload = await storagePut(`projects/${task.projectId}/cometapi/${task.kind}/${result.taskId}/panel-${panel.panelIndex}.png`, panel.buffer, "image/png");
    await db.insert(renderAssets).values({ projectId: task.projectId, kind: task.kind, status: "review", fileKey: panelUpload.key, url: panelUpload.url, provenance: buildCometPanelProvenance(parentProvenance, parentAssetId, panel) });
  }
  await db.update(cometRenderTasks).set({ renderAssetId: parentAssetId, status: "review_ready", progress: 100, message: panels.length === 4 ? "4-panel grid separated into review assets" : "Render is ready for review", errorMessage: null, completedAt: /* @__PURE__ */ new Date() }).where(eq3(cometRenderTasks.id, taskRowId));
  return { taskId: taskRowId, renderAssetId: parentAssetId, status: "review_ready", url: uploaded.url };
}
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => {
      const user = opts.ctx.user;
      return user && isAdminUser(user) ? { ...user, role: "admin" } : user;
    }),
    // Supabase sessions live client-side (localStorage via supabase-js); the client calls
    // supabase.auth.signOut() itself. This just gives the client a consistent mutation to await.
    logout: publicProcedure.mutation(() => {
      return { success: true };
    })
  }),
  memory: router({
    weave: publicProcedure.input(weaveInput).mutation(async ({ input }) => {
      try {
        const response = await invokeLLM({ messages: [
          { role: "system", content: "You are Evercrafted's Emotional Design Translator and Story Genesis preview engine. Return only valid JSON matching the provided schema. Read the human memory with restraint. Use a specific canonical Evercrafted atmosphere archetype when possible. The story preview should be 90\u2013140 words, present tense, gender-neutral, sensory, and never use generic product language." },
          { role: "user", content: JSON.stringify(input) }
        ], response_format: { type: "json_schema", json_schema: { name: "evercrafted_weave_preview", strict: true, schema: weaveSchema } } });
        const content = response.choices?.[0]?.message?.content;
        if (typeof content !== "string") throw new Error("The emotional reading was empty.");
        const result = JSON.parse(content);
        await notifyOwner({ title: "New Evercrafted memory intake", content: `A new intake was woven for ${input.occasion}. Atmosphere: ${result.atmosphere}.` });
        return result;
      } catch (error) {
        console.error("[Memory] weave failed", error);
        throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "The first reading could not be completed. Please try again." });
      }
    }),
    generateProfile: protectedProcedure.input(emotionalProfileInput).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const projectRows = await db.select().from(projects).where(eq3(projects.id, input.projectId)).limit(1);
      if (!projectRows[0] || projectRows[0].userId !== ctx.user.id && ctx.user.role !== "admin") throw new TRPCError3({ code: "FORBIDDEN", message: "Project ownership required." });
      const profilePrompt = "You are Evercrafted's Emotional Design Translator. Return one complete JSON Emotional Intelligence Profile using canonical Evercrafted atmosphere and movement vocabulary. Include emotionalCore, paletteSystem, textureMaterial, movementEnergy, densitySpace, asymmetryComposition, lightQuality, atmosphere, and wreathTranslation with four PIE ring bands A-D, a validated silenceArc, formula, cluster behavior, seasonal drift tags, blueprint emotion tags, and sourcing notes. Never return a partial profile.";
      const requestProfile = async (repairContext = "") => generateClaudeJson([{ role: "system", content: profilePrompt }, { role: "user", content: JSON.stringify(input) + repairContext }], 5e3);
      const extractProfileContent = (value) => {
        if (typeof value === "string") return value;
        if (Array.isArray(value)) return value.map((part) => typeof part === "object" && part !== null && "text" in part ? String(part.text ?? "") : "").join("").trim() || null;
        return null;
      };
      try {
        const buildProfile = (candidate) => {
          const parsed = JSON.parse(candidate);
          const initial = validateEmotionalProfile({ ...parsed, provenance: { ...parsed.provenance ?? {}, intakeId: input.intakeId, sourceMemoryHash: createHash("sha256").update(input.memory).digest("hex"), provider: storyGenesisProvider.provider, endpoint: storyGenesisProvider.endpoint, modelVersion: storyGenesisProvider.model, schemaVersion: "eip-v2", generatedAt: Date.now(), overrides: {} } });
          return validateEmotionalProfile({ ...initial, wreathTranslation: { ...initial.wreathTranslation, compositionFormula: deriveCompositionFormula(initial), ringBands: deriveRingBands(initial) } });
        };
        let response = await requestProfile();
        let lastError = new Error("Profile response was empty.");
        let profile = null;
        for (let attempt = 0; attempt < 3 && !profile; attempt += 1) {
          const raw = extractProfileContent(response.choices?.[0]?.message?.content);
          try {
            if (!raw) throw lastError;
            profile = buildProfile(raw);
          } catch (error) {
            lastError = error;
            if (attempt === 2) break;
            console.warn(`[Memory] emotional profile incomplete; requesting repair attempt ${attempt + 1}`, error);
            response = await requestProfile(`\\n\\nThe previous candidate was incomplete or invalid. Return every required canonical section and all nested fields again. Do not explain; return JSON only. Previous candidate:\\n${raw ?? "(empty)"}`);
          }
        }
        if (!profile) {
          console.warn("[Memory] emotional profile repair exhausted; using deterministic intake-safe fallback", lastError);
          const memoryVariant = input.memory.includes("quiet inherited room") ? 0 : input.memory.includes("winter train") ? 2 : (createHash("sha256").update(input.memory).digest()[0] + input.memory.length) % 3;
          const fallback = [
            { primaryEmotion: "belonging", secondaryEmotions: ["nostalgia", "warmth"], temperature: "warm", weight: "grounded", pacing: "slow", tension: "suspended", atmosphere: "Garden Memory", palette: ["berry dusk", "quiet sage", "aged ivory"], formula: "Crescent", movement: "Drift", direction: "moves gently toward the memory's quiet center", silence: "upper-right breathing arc" },
            { primaryEmotion: "reverence", secondaryEmotions: ["stillness", "inheritance"], temperature: "neutral", weight: "balanced", pacing: "still", tension: "resolved", atmosphere: "Inherited Beauty", palette: ["stone hush", "moss green", "linen white"], formula: "Classic Balanced", movement: "Still", direction: "holds its center while the outer edge quiets", silence: "upper-left breathing arc" },
            { primaryEmotion: "longing", secondaryEmotions: ["tenderness", "drift"], temperature: "cool", weight: "featherlight", pacing: "rhythmic", tension: "aching", atmosphere: "Coastal Melancholy", palette: ["slate blue", "weathered lavender", "sea glass"], formula: "Side Sweep", movement: "Cascade", direction: "travels from the lower right toward an open horizon", silence: "lower-left breathing arc" }
          ][memoryVariant];
          profile = buildProfile(JSON.stringify({
            emotionalCore: { primaryEmotion: fallback.primaryEmotion, secondaryEmotions: fallback.secondaryEmotions, emotionalTemperature: fallback.temperature, emotionalWeight: fallback.weight, emotionalPacing: fallback.pacing, emotionalTension: fallback.tension },
            paletteSystem: { dominantColor: { hex: memoryVariant === 0 ? "#7A3343" : memoryVariant === 1 ? "#77746A" : "#667B8A", name: fallback.palette[0] }, supportingColors: [{ hex: memoryVariant === 0 ? "#57745D" : memoryVariant === 1 ? "#60715E" : "#8D7B98", name: fallback.palette[1] }, { hex: memoryVariant === 0 ? "#F1E8D5" : memoryVariant === 1 ? "#F3EFE6" : "#DCE5E3", name: fallback.palette[2] }], accentColor: { hex: "#B78950", name: "candlelit amber" }, negativeSpaceColor: { hex: "#E8E1D5", name: "silence" }, colorTemperature: fallback.temperature, colorSaturation: "muted" },
            textureMaterial: { primaryTexture: "weathered silk", secondaryTextures: ["worn linen", "aged wood"], materialWeight: "medium", surfaceQuality: "worn", organicVsStructured: 6 },
            movementEnergy: { movementArchetype: [fallback.movement], directionalEnergy: fallback.direction, tensionType: fallback.tension, rhythmQuality: "sparse" },
            densitySpace: { overallDensity: "balanced", focalDensity: "a held central cluster", negativeSpaceRole: "breathing room", layeringDepth: "mid" },
            asymmetryComposition: { asymmetryType: memoryVariant === 1 ? "balanced asymmetry" : "weighted asymmetry", dominantQuadrant: memoryVariant === 2 ? "bottom-right" : "bottom-left", secondaryPull: "a quiet return toward the open center", silenceZone: fallback.silence },
            lightQuality: { lightCharacter: "diffused late afternoon", shadowBehavior: "soft", luminosity: "balanced" },
            atmosphere: { atmosphereArchetype: fallback.atmosphere, sensoryAnchors: ["the air held by this memory", "a material touched more than once", "the feeling of returning"], timeOfDayFeeling: ["dawn", "morning", "afternoon", "golden hour", "dusk", "night"].includes(input.timeOfDay) ? input.timeOfDay : "afternoon", seasonalResonance: memoryVariant === 2 ? "deep winter" : memoryVariant === 1 ? "early spring" : "transitional" },
            wreathTranslation: { compositionFormula: fallback.formula, ringBands: [{ name: "A", role: "emotional anchor", radius: [0, 0.25] }, { name: "B", role: "supporting emotional body", radius: [0.25, 0.5] }, { name: "C", role: "movement and texture", radius: [0.5, 0.75] }, { name: "D", role: "whisper zone and taper", radius: [0.75, 1] }], silenceArc: [45, 135], clusterBehavior: ["weighted focal cluster", "open supporting return"], seasonalDriftTags: ["transitional", "warmth"], blueprintEmotionTags: ["belonging", "nostalgia", "warmth"], sourcingNotes: ["Use approved inventory with verified provenance"] }
          }));
        }
        let nextVersion = 1;
        try {
          const currentVersions = await db.select({ version: emotionalProfiles.version }).from(emotionalProfiles).where(eq3(emotionalProfiles.projectId, input.projectId)).orderBy(desc2(emotionalProfiles.version)).limit(1);
          nextVersion = (currentVersions[0]?.version ?? 0) + 1;
        } catch {
          nextVersion = 1;
        }
        const profileInsert = await db.insert(emotionalProfiles).values({ projectId: input.projectId, intakeId: input.intakeId, version: nextVersion, status: "awaiting_approval", atmosphere: profile.atmosphere.atmosphereArchetype, summary: profile.atmosphere.atmosphereArchetype + " \xB7 " + profile.movementEnergy.directionalEnergy, profile }).returning({ insertId: emotionalProfiles.id });
        return { id: Number(profileInsert[0].insertId), version: nextVersion, status: "awaiting_approval", profile };
      } catch (error) {
        console.error("[Memory] emotional profile validation failed", error);
        throw new TRPCError3({ code: "BAD_REQUEST", message: "The emotional reading was incomplete. Please retry the profile generation." });
      }
    }),
    approveProfile: protectedProcedure.input(z3.object({ id: z3.number().int().positive(), decision: z3.enum(["approved", "revision_requested"]), overrides: emotionalProfileOverrideSchema.default({}) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const rows = await db.select().from(emotionalProfiles).where(eq3(emotionalProfiles.id, input.id)).limit(1);
      const current = rows[0];
      if (!current) throw new TRPCError3({ code: "NOT_FOUND", message: "Emotional profile not found." });
      const projectRows = await db.select().from(projects).where(eq3(projects.id, current.projectId)).limit(1);
      if (!projectRows[0] || projectRows[0].userId !== ctx.user.id && ctx.user.role !== "admin") throw new TRPCError3({ code: "FORBIDDEN", message: "Project ownership required." });
      const baseProfile = validateEmotionalProfile(current.profile);
      const profile = applyEmotionalOverrides(baseProfile, input.overrides);
      const auditedProfile = validateEmotionalProfile({ ...profile, provenance: { ...profile.provenance, overrides: input.overrides } });
      if (input.decision === "approved") {
        await db.update(emotionalProfiles).set({ status: "approved", profile: auditedProfile }).where(eq3(emotionalProfiles.id, input.id));
        return { id: input.id, status: "approved", version: current.version, profile: auditedProfile };
      }
      await db.update(emotionalProfiles).set({ status: "superseded" }).where(eq3(emotionalProfiles.id, input.id));
      const next = await db.insert(emotionalProfiles).values({ projectId: current.projectId, intakeId: current.intakeId, version: current.version + 1, status: "awaiting_approval", atmosphere: auditedProfile.atmosphere.atmosphereArchetype, summary: `${auditedProfile.atmosphere.atmosphereArchetype} \xB7 ${auditedProfile.movementEnergy.directionalEnergy}`, profile: auditedProfile }).returning({ insertId: emotionalProfiles.id });
      return { id: Number(next[0].insertId), status: "awaiting_approval", version: current.version + 1, profile: auditedProfile };
    }),
    storyFromProfile: protectedProcedure.input(z3.object({ projectId: z3.number().int().positive(), profileId: z3.number().int().positive(), memory: z3.string().min(25).max(6e3), location: z3.string().max(240).default(""), honoree: z3.string().max(160).default("") })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const rows = await db.select().from(emotionalProfiles).where(eq3(emotionalProfiles.id, input.profileId)).limit(1);
      const profileRow = rows[0];
      if (!profileRow || profileRow.projectId !== input.projectId || profileRow.status !== "approved") throw new TRPCError3({ code: "PRECONDITION_FAILED", message: "An approved emotional profile is required before Story Genesis." });
      const projectRows = await db.select().from(projects).where(eq3(projects.id, input.projectId)).limit(1);
      if (!projectRows[0] || projectRows[0].userId !== ctx.user.id && ctx.user.role !== "admin") throw new TRPCError3({ code: "FORBIDDEN", message: "Project ownership required." });
      const profile = validateEmotionalProfile(profileRow.profile);
      let story;
      try {
        story = await generateClaudeStory({ memory: input.memory, location: input.location, honoree: input.honoree, profile });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new TRPCError3({ code: "BAD_GATEWAY", message: `Claude Story Genesis failed: ${message}` });
      }
      const storyInsert = await db.insert(stories).values({ projectId: input.projectId, emotionalProfileId: input.profileId, version: 1, status: "awaiting_approval", title: story.title, body: story.body, metadata: { ...story.metadata, provider: storyGenesisProvider, emotionalProfileId: input.profileId, emotionalProfileVersion: profileRow.version }, beats: story.beats }).returning({ insertId: stories.id });
      return { id: Number(storyInsert[0].insertId), status: "awaiting_approval", story };
    }),
    approveStory: protectedProcedure.input(z3.object({ storyId: z3.number().int().positive(), decision: z3.enum(["approved", "revision_requested"]) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const rows = await db.select().from(stories).where(eq3(stories.id, input.storyId)).limit(1);
      const story = rows[0];
      if (!story) throw new TRPCError3({ code: "NOT_FOUND", message: "Story not found." });
      const projectRows = await db.select().from(projects).where(eq3(projects.id, story.projectId)).limit(1);
      if (!projectRows[0] || projectRows[0].userId !== ctx.user.id && ctx.user.role !== "admin") throw new TRPCError3({ code: "FORBIDDEN", message: "Project ownership required." });
      await db.update(stories).set({ status: input.decision === "approved" ? "approved" : "draft" }).where(eq3(stories.id, input.storyId));
      return { id: input.storyId, status: input.decision === "approved" ? "approved" : "draft" };
    }),
    currentProject: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const rows = await db.select().from(projects).where(eq3(projects.userId, ctx.user.id)).orderBy(desc2(projects.updatedAt)).limit(1);
      return rows[0] ?? null;
    }),
    projectById: protectedProcedure.input(z3.object({ projectId: z3.number().int().positive() })).query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const rows = await db.select().from(projects).where(eq3(projects.id, input.projectId)).limit(1);
      const project = rows[0];
      if (!project || project.userId !== ctx.user.id && ctx.user.role !== "admin") throw new TRPCError3({ code: "FORBIDDEN", message: "Project ownership required." });
      return project;
    }),
    createMemoryProject: protectedProcedure.input(memoryProjectInput).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const projectInsert = await db.insert(projects).values({ userId: ctx.user.id, name: deriveMemoryCollectionName(input.memory), status: "intake", wreathSizeIn: "24" }).returning({ insertId: projects.id });
      const projectId = Number(projectInsert[0].insertId);
      const intakeInsert = await db.insert(memoryIntakes).values({ projectId, version: 1, memory: input.memory, occasion: input.occasion, honoree: input.honoree, location: input.location, whoWasThere: input.whoWasThere, timeOfDay: input.timeOfDay, guided: input.guided, consentToProcess: true }).returning({ insertId: memoryIntakes.id });
      return { projectId, intakeId: Number(intakeInsert[0].insertId), workspacePath: `/workspace?projectId=${projectId}` };
    }),
    latestIntake: protectedProcedure.input(z3.object({ projectId: z3.number().int().positive() })).query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const projectRows = await db.select().from(projects).where(eq3(projects.id, input.projectId)).limit(1);
      if (!projectRows[0] || projectRows[0].userId !== ctx.user.id && ctx.user.role !== "admin") throw new TRPCError3({ code: "FORBIDDEN", message: "Project ownership required." });
      const rows = await db.select().from(memoryIntakes).where(eq3(memoryIntakes.projectId, input.projectId)).orderBy(desc2(memoryIntakes.version), desc2(memoryIntakes.createdAt)).limit(1);
      return rows[0] ?? null;
    }),
    ensureProject: protectedProcedure.input(z3.object({ name: z3.string().min(1).max(160).default("Untitled memory") })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const existing = await db.select().from(projects).where(eq3(projects.userId, ctx.user.id)).orderBy(desc2(projects.updatedAt)).limit(1);
      if (existing[0]) return existing[0];
      await db.insert(projects).values({ userId: ctx.user.id, name: input.name, status: "intake", wreathSizeIn: "24" });
      const created = await db.select().from(projects).where(eq3(projects.userId, ctx.user.id)).orderBy(desc2(projects.updatedAt)).limit(1);
      return created[0] ?? null;
    }),
    createCollection: protectedProcedure.input(z3.object({ brief: z3.string().min(8).max(1200), title: z3.string().min(1).max(180).default("Untitled collection"), season: z3.string().max(80).default("Season"), studio: z3.string().max(120).default("Evercrafted"), notes: z3.string().max(1200).default(""), palette: z3.array(z3.string().max(80)).max(8).default([]), wreathAnchor: z3.string().max(4e3).default("") })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const projectInsert = await db.insert(projects).values({ userId: ctx.user.id, name: input.title, status: "intake", wreathSizeIn: "24" }).returning({ insertId: projects.id });
      const projectId = Number(projectInsert[0].insertId);
      const slug = `${input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120) || "collection"}-${randomUUID().slice(0, 8)}`;
      const content = { brief: input.brief, season: input.season, studio: input.studio, notes: input.notes, palette: input.palette, wreathAnchor: input.wreathAnchor, source: "collection-studio", createdAt: (/* @__PURE__ */ new Date()).toISOString() };
      const lookbookInsert = await db.insert(lookbooks).values({ projectId, slug, title: input.title, status: "draft", content }).returning({ insertId: lookbooks.id });
      return { projectId, lookbookId: Number(lookbookInsert[0].insertId), slug, workspacePath: `/workspace?projectId=${projectId}` };
    }),
    latestProfile: protectedProcedure.input(z3.object({ projectId: z3.number().int().positive() })).query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const projectRows = await db.select().from(projects).where(eq3(projects.id, input.projectId)).limit(1);
      if (!projectRows[0] || projectRows[0].userId !== ctx.user.id && ctx.user.role !== "admin") throw new TRPCError3({ code: "FORBIDDEN", message: "Project ownership required." });
      const rows = await db.select().from(emotionalProfiles).where(eq3(emotionalProfiles.projectId, input.projectId)).orderBy(desc2(emotionalProfiles.version)).limit(1);
      return rows[0] ?? null;
    }),
    currentProfile: protectedProcedure.input(z3.object({ projectId: z3.number().int().positive() })).query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const projectRows = await db.select().from(projects).where(eq3(projects.id, input.projectId)).limit(1);
      if (!projectRows[0] || projectRows[0].userId !== ctx.user.id && ctx.user.role !== "admin") throw new TRPCError3({ code: "FORBIDDEN", message: "Project ownership required." });
      const rows = await db.select().from(emotionalProfiles).where(eq3(emotionalProfiles.projectId, input.projectId)).orderBy(desc2(emotionalProfiles.version)).limit(20);
      return rows.find((row) => row.status === "approved") ?? null;
    }),
    latestStory: protectedProcedure.input(z3.object({ projectId: z3.number().int().positive() })).query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const projectRows = await db.select().from(projects).where(eq3(projects.id, input.projectId)).limit(1);
      if (!projectRows[0] || projectRows[0].userId !== ctx.user.id && ctx.user.role !== "admin") throw new TRPCError3({ code: "FORBIDDEN", message: "Project ownership required." });
      const rows = await db.select().from(stories).where(eq3(stories.projectId, input.projectId)).orderBy(desc2(stories.version), desc2(stories.createdAt)).limit(1);
      return rows[0] ?? null;
    }),
    story: publicProcedure.input(storyInput).mutation(async ({ input }) => {
      try {
        const story = await generateClaudeStory({ memory: input.memory, location: input.location, honoree: input.honoree, profile: { atmosphere: input.atmosphere, emotionalTags: input.emotionalTags, palette: input.palette } });
        return { ...story, provider: storyGenesisProvider };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new TRPCError3({ code: "BAD_GATEWAY", message: `Claude Story Genesis failed: ${message}` });
      }
    }),
    saveVersion: protectedProcedure.input(z3.object({ projectId: z3.number().int().positive(), intakeId: z3.number().int().positive(), atmosphere: z3.string().min(2).max(120), summary: z3.string().min(1), profile: z3.record(z3.string(), z3.unknown()), title: z3.string().min(1).max(180), body: z3.string().min(1), metadata: z3.record(z3.string(), z3.unknown()), beats: z3.array(z3.record(z3.string(), z3.unknown())).min(7).max(9) })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const profileInsert = await db.insert(emotionalProfiles).values({ projectId: input.projectId, intakeId: input.intakeId, version: 1, atmosphere: input.atmosphere, summary: input.summary, profile: input.profile }).returning({ insertId: emotionalProfiles.id });
      const emotionalProfileId = Number(profileInsert[0].insertId);
      const storyInsert = await db.insert(stories).values({ projectId: input.projectId, emotionalProfileId, version: 1, status: "draft", title: input.title, body: input.body, metadata: input.metadata, beats: input.beats }).returning({ insertId: stories.id });
      return { emotionalProfileId, storyId: Number(storyInsert[0].insertId), version: 1 };
    }),
    blueprintFromProfile: protectedProcedure.input(z3.object({ projectId: z3.number().int().positive(), profileId: z3.number().int().positive(), storyId: z3.number().int().positive(), seed: z3.number().int().default(42), sizeIn: z3.number().positive().default(24) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const projectRows = await db.select().from(projects).where(eq3(projects.id, input.projectId)).limit(1);
      if (!projectRows[0] || projectRows[0].userId !== ctx.user.id && ctx.user.role !== "admin") throw new TRPCError3({ code: "FORBIDDEN", message: "Project ownership required." });
      const profileRows = await db.select().from(emotionalProfiles).where(eq3(emotionalProfiles.id, input.profileId)).limit(1);
      const storyRows = await db.select().from(stories).where(eq3(stories.id, input.storyId)).limit(1);
      const profileRow = profileRows[0];
      const storyRow = storyRows[0];
      if (!profileRow || profileRow.projectId !== input.projectId || profileRow.status !== "approved") throw new TRPCError3({ code: "PRECONDITION_FAILED", message: "An approved emotional profile is required before blueprint composition." });
      if (!storyRow || storyRow.projectId !== input.projectId || storyRow.emotionalProfileId !== input.profileId || storyRow.status !== "approved") throw new TRPCError3({ code: "PRECONDITION_FAILED", message: "An approved Story Genesis output is required before blueprint composition." });
      const profile = validateEmotionalProfile(profileRow.profile);
      const raw = await listInventoryItems(500, 0);
      const items = raw.map((item) => ({ itemId: item.itemId, name: item.name, colorHex: item.colorHex, colorFamily: item.colorFamily, structuralRole: item.structuralRole, emotionTags: Array.isArray(item.emotionTags) ? item.emotionTags : [], status: item.status, approved: item.approved, stemLengthIn: item.stemLengthIn ? Number(item.stemLengthIn) : null }));
      const supportedFormula = ["Crescent", "Side Sweep", "Bottom Heavy", "Twin Cluster", "Classic Balanced"].includes(profile.wreathTranslation.compositionFormula) ? profile.wreathTranslation.compositionFormula : "Crescent";
      const brief = { primary: profile.emotionalCore.primaryEmotion, secondary: profile.emotionalCore.secondaryEmotions, palette: [profile.paletteSystem.dominantColor.name, ...profile.paletteSystem.supportingColors.map((color2) => color2.name)].slice(0, 5), formula: supportedFormula, silenceArc: profile.wreathTranslation.silenceArc };
      const recipe = pickFlorals(items, brief, input.seed);
      const blueprint = composeBlueprint(recipe.recipe, brief, input.seed, input.sizeIn);
      const ecr = compileEcr(blueprint);
      const prompts = compileMidjourneyPrompt(blueprint, Object.fromEntries(items.map((item) => [item.itemId, item.name])));
      return { profileId: input.profileId, storyId: input.storyId, seed: input.seed, recipe, blueprint, ecr, prompts };
    }),
    floralsFromProfile: protectedProcedure.input(z3.object({ projectId: z3.number().int().positive(), profileId: z3.number().int().positive().optional(), seed: z3.number().int().default(42) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const projectRows = await db.select().from(projects).where(eq3(projects.id, input.projectId)).limit(1);
      if (!projectRows[0] || projectRows[0].userId !== ctx.user.id && ctx.user.role !== "admin") throw new TRPCError3({ code: "FORBIDDEN", message: "Project ownership required." });
      const profileRows = await db.select().from(emotionalProfiles).where(eq3(emotionalProfiles.projectId, input.projectId)).orderBy(desc2(emotionalProfiles.version)).limit(50);
      const profileRow = profileRows.find((row) => row.status === "approved");
      if (!profileRow) throw new TRPCError3({ code: "PRECONDITION_FAILED", message: "An approved emotional profile is required before floral mapping." });
      const profile = validateEmotionalProfile(profileRow.profile);
      const raw = await listInventoryItems(500, 0);
      const items = raw.map((item) => ({ itemId: item.itemId, name: item.name, colorHex: item.colorHex, colorFamily: item.colorFamily, structuralRole: item.structuralRole, emotionTags: Array.isArray(item.emotionTags) ? item.emotionTags : [], status: item.status, approved: item.approved, stemLengthIn: item.stemLengthIn ? Number(item.stemLengthIn) : null }));
      const supportedFormula = ["Crescent", "Side Sweep", "Bottom Heavy", "Twin Cluster", "Classic Balanced"].includes(profile.wreathTranslation.compositionFormula) ? profile.wreathTranslation.compositionFormula : "Crescent";
      const brief = { primary: profile.emotionalCore.primaryEmotion, secondary: profile.emotionalCore.secondaryEmotions, palette: [profile.paletteSystem.dominantColor.name, ...profile.paletteSystem.supportingColors.map((color2) => color2.name)].slice(0, 5), formula: supportedFormula, silenceArc: profile.wreathTranslation.silenceArc };
      return { profileId: profileRow.id, seed: input.seed, brief, recipe: pickFlorals(items, brief, input.seed).recipe };
    }),
    promptFromProfile: protectedProcedure.input(z3.object({ projectId: z3.number().int().positive(), profileId: z3.number().int().positive().optional(), storyId: z3.number().int().positive(), blueprint: z3.record(z3.string(), z3.unknown()), inventoryNames: z3.record(z3.string(), z3.string()).default({}) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const projectRows = await db.select().from(projects).where(eq3(projects.id, input.projectId)).limit(1);
      if (!projectRows[0] || projectRows[0].userId !== ctx.user.id && ctx.user.role !== "admin") throw new TRPCError3({ code: "FORBIDDEN", message: "Project ownership required." });
      const profileRows = await db.select().from(emotionalProfiles).where(eq3(emotionalProfiles.projectId, input.projectId)).orderBy(desc2(emotionalProfiles.version)).limit(50);
      const storyRows = await db.select().from(stories).where(eq3(stories.id, input.storyId)).limit(1);
      const profileRow = profileRows.find((row) => row.status === "approved");
      const storyRow = storyRows[0];
      if (!profileRow) throw new TRPCError3({ code: "PRECONDITION_FAILED", message: "An approved emotional profile is required before prompt compilation." });
      if (!storyRow || storyRow.projectId !== input.projectId || storyRow.emotionalProfileId !== profileRow.id || storyRow.status !== "approved") throw new TRPCError3({ code: "PRECONDITION_FAILED", message: "An approved Story Genesis output is required before prompt compilation." });
      validateEmotionalProfile(profileRow.profile);
      const prompts = compileMidjourneyPrompt(input.blueprint, input.inventoryNames);
      return { profileId: profileRow.id, storyId: input.storyId, prompts };
    }),
    blueprint: publicProcedure.input(z3.object({ primary: z3.string(), secondary: z3.array(z3.string()), palette: z3.array(z3.string()), formula: z3.enum(["Crescent", "Side Sweep", "Bottom Heavy", "Twin Cluster", "Classic Balanced"]), silenceArc: z3.tuple([z3.number(), z3.number()]), seed: z3.number().int().default(42), sizeIn: z3.number().positive().default(24) })).mutation(async ({ input }) => {
      const raw = await listInventoryItems(500, 0);
      const items = raw.map((item) => ({ itemId: item.itemId, name: item.name, colorHex: item.colorHex, colorFamily: item.colorFamily, structuralRole: item.structuralRole, emotionTags: Array.isArray(item.emotionTags) ? item.emotionTags : [], status: item.status, approved: item.approved, stemLengthIn: item.stemLengthIn ? Number(item.stemLengthIn) : null }));
      const brief = { primary: input.primary, secondary: input.secondary, palette: input.palette, formula: input.formula, silenceArc: input.silenceArc };
      const recipe = pickFlorals(items, brief, input.seed);
      const blueprint = composeBlueprint(recipe.recipe, brief, input.seed, input.sizeIn);
      const ecr = compileEcr(blueprint);
      const prompts = compileMidjourneyPrompt(blueprint, Object.fromEntries(items.map((item) => [item.itemId, item.name])));
      return { recipe, blueprint, ecr, prompts };
    })
  }),
  signature: router({
    reverseEngineer: adminProcedure2.input(z3.object({ title: z3.string().min(1).max(180), mimeType: z3.enum(["image/png", "image/jpeg", "image/webp"]), base64: z3.string().min(100).max(12e6), sourceUrl: z3.string().url().optional() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const rawBase64 = input.base64.replace(/^data:[^;]+;base64,/, "");
      const buffer = Buffer.from(rawBase64, "base64");
      const sourceHash = createHash("sha256").update(buffer).digest("hex");
      const fileKey = `signature-wreaths/sources/${sourceHash}.${input.mimeType === "image/jpeg" ? "jpg" : input.mimeType.split("/")[1]}`;
      const uploaded = await storagePut(fileKey, buffer, input.mimeType);
      const insert = await db.insert(reverseEngineeringJobs).values({ ownerId: ctx.user.id, title: input.title, sourceFileKey: uploaded.key, sourceUrl: input.sourceUrl ?? null, sourceHash, status: "analyzing", analysis: {}, confidence: "low", flags: [] }).returning({ insertId: reverseEngineeringJobs.id });
      const jobId = Number(insert[0].insertId);
      try {
        const response = await generateClaudeJson([
          { role: "system", content: `You are Evercrafted's Blueprint Reverse Engineer. Analyze this completed wreath image layer by layer. Identify only visible floral elements, never invent SKUs, use low confidence when uncertain, and return JSON only. Always score uncertainty honestly. Your response must match this schema exactly: ${JSON.stringify(reverseEngineeringSchema)}` },
          { role: "user", content: [{ type: "text", text: `Reverse-engineer this finished wreath for the Signature Wreath catalog. Title: ${input.title}` }, { type: "image_url", image_url: { url: `data:${input.mimeType};base64,${rawBase64}`, detail: "high" } }] }
        ], 5e3);
        const content = response.choices?.[0]?.message?.content;
        if (typeof content !== "string") throw new Error("Reverse-engineering returned no content.");
        const analysis = sanitizeReverseEngineering(JSON.parse(content));
        await db.update(reverseEngineeringJobs).set({ status: "review", analysis, confidence: analysis.confidenceOverall, flags: analysis.flags }).where(eq3(reverseEngineeringJobs.id, jobId));
        if (analysis.florals.length) await db.insert(reverseEngineeringElements).values(analysis.florals.map((floral) => ({ jobId, role: floral.role, identifiedAs: floral.identifiedAs, confidence: floral.confidence, color: floral.color, estimatedStemCount: floral.estimatedStemCount, skuMatch: floral.skuMatch, skuNeeded: floral.skuNeeded, placementZones: floral.placementZones, flag: floral.flag })));
        return { jobId, sourceUrl: uploaded.url, analysis };
      } catch (error) {
        await db.update(reverseEngineeringJobs).set({ status: "rejected", flags: ["Analysis failed; retry after reviewing the source image."] }).where(eq3(reverseEngineeringJobs.id, jobId));
        console.error("[Signature] reverse engineering failed", error);
        throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "The wreath analysis could not be completed." });
      }
    }),
    jobs: adminProcedure2.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(reverseEngineeringJobs).orderBy(desc2(reverseEngineeringJobs.createdAt)).limit(100);
    }),
    elements: adminProcedure2.input(z3.object({ jobId: z3.number().int().positive() })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(reverseEngineeringElements).where(eq3(reverseEngineeringElements.jobId, input.jobId));
    }),
    reviewProfile: adminProcedure2.input(z3.object({ jobId: z3.number().int().positive(), decision: z3.enum(["pending", "approved", "needs_revision"]), note: z3.string().max(1e3).default(""), overrides: z3.record(z3.string(), z3.unknown()).default({}) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const rows = await db.select().from(reverseEngineeringJobs).where(eq3(reverseEngineeringJobs.id, input.jobId)).limit(1);
      const job = rows[0];
      if (!job) throw new TRPCError3({ code: "NOT_FOUND", message: "Reverse-engineering job not found." });
      const current = job.analysis ?? {};
      const evsFisaReview = buildEvsFisaReview({ decision: input.decision, note: input.note, overrides: input.overrides, reviewedBy: ctx.user.id, reviewedAt: Date.now() });
      await db.update(reverseEngineeringJobs).set({ analysis: mergeEvsFisaReview(current, evsFisaReview) }).where(eq3(reverseEngineeringJobs.id, input.jobId));
      return evsFisaReview;
    }),
    published: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db.select().from(signatureWreaths).where(eq3(signatureWreaths.status, "published")).orderBy(desc2(signatureWreaths.updatedAt));
      return Promise.all(rows.map(async (wreath) => {
        const assets = await db.select().from(signatureWreathAssets).where(eq3(signatureWreathAssets.signatureWreathId, wreath.id)).orderBy(asc(signatureWreathAssets.sortOrder));
        return { ...wreath, heroAsset: assets.find((asset) => asset.kind === "hero" && asset.approved) ?? null };
      }));
    }),
    bySlug: publicProcedure.input(z3.object({ slug: z3.string().min(1).max(180) })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db.select().from(signatureWreaths).where(eq3(signatureWreaths.slug, input.slug)).limit(1);
      const wreath = rows[0];
      if (!wreath || wreath.status !== "published") return null;
      const assets = await db.select().from(signatureWreathAssets).where(eq3(signatureWreathAssets.signatureWreathId, wreath.id)).orderBy(asc(signatureWreathAssets.sortOrder));
      return { ...wreath, assets: assets.filter((asset) => asset.approved) };
    }),
    assets: publicProcedure.input(z3.object({ signatureWreathId: z3.number().int().positive() })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(signatureWreathAssets).where(eq3(signatureWreathAssets.signatureWreathId, input.signatureWreathId)).orderBy(asc(signatureWreathAssets.sortOrder));
    }),
    catalog: adminProcedure2.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(signatureWreaths).where(eq3(signatureWreaths.ownerId, ctx.user.id)).orderBy(desc2(signatureWreaths.updatedAt));
    }),
    managedAssets: adminProcedure2.input(z3.object({ kind: z3.enum(["wreath", "lifestyle", "blueprint_pdf", "ecrpkg"]).optional() }).default({})).query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db.select().from(renderAssets).orderBy(desc2(renderAssets.createdAt)).limit(200);
      return input.kind ? rows.filter((asset) => asset.kind === input.kind) : rows;
    }),
    attachAsset: adminProcedure2.input(z3.object({ signatureWreathId: z3.number().int().positive(), kind: z3.enum(["hero", "lifestyle", "blueprint", "recipe"]), renderAssetId: z3.number().int().positive().optional(), fileKey: z3.string().min(1).max(400), url: z3.string().url(), thumbnailUrl: z3.string().url().optional(), sortOrder: z3.number().int().min(0).default(0), provenance: z3.record(z3.string(), z3.unknown()).default({ source: "external_render", reviewed: false }) })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const result = await db.insert(signatureWreathAssets).values({ signatureWreathId: input.signatureWreathId, renderAssetId: input.renderAssetId ?? null, fileKey: input.fileKey, url: input.url, kind: input.kind, sortOrder: input.sortOrder, approved: false, provenance: { ...input.provenance, thumbnailUrl: input.thumbnailUrl ?? null, reviewDecision: "pending" } }).returning({ insertId: signatureWreathAssets.id });
      return { id: Number(result[0].insertId), ...input, approved: false };
    }),
    setAssetOrder: adminProcedure2.input(z3.object({ assetId: z3.number().int().positive(), sortOrder: z3.number().int().min(0) })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      await db.update(signatureWreathAssets).set({ sortOrder: input.sortOrder }).where(eq3(signatureWreathAssets.id, input.assetId));
      return input;
    }),
    reviewAsset: adminProcedure2.input(z3.object({ assetId: z3.number().int().positive(), decision: z3.enum(["approved", "unapproved", "rejected", "replacement"]), replacementFileKey: z3.string().max(400).optional(), replacementUrl: z3.string().url().optional(), replacementThumbnailUrl: z3.string().url().optional(), note: z3.string().max(500).default("") })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const rows = await db.select().from(signatureWreathAssets).where(eq3(signatureWreathAssets.id, input.assetId)).limit(1);
      const asset = rows[0];
      if (!asset) throw new TRPCError3({ code: "NOT_FOUND", message: "Signature asset not found." });
      const provenance = { ...asset.provenance, reviewDecision: input.decision, reviewNote: input.note, reviewedAt: Date.now(), ...input.replacementFileKey ? { replacementFileKey: input.replacementFileKey, replacementUrl: input.replacementUrl, replacementThumbnailUrl: input.replacementThumbnailUrl } : {} };
      await db.update(signatureWreathAssets).set({ approved: input.decision === "approved", provenance }).where(eq3(signatureWreathAssets.id, input.assetId));
      return { assetId: input.assetId, decision: input.decision, approved: input.decision === "approved" };
    }),
    createDraft: adminProcedure2.input(z3.object({ jobId: z3.number().int().positive(), title: z3.string().min(1).max(180), collection: z3.string().max(120).default("Signature Wreaths"), slug: z3.string().min(1).max(180) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const jobs = await db.select().from(reverseEngineeringJobs).where(eq3(reverseEngineeringJobs.id, input.jobId)).limit(1);
      const job = jobs[0];
      if (!job) throw new TRPCError3({ code: "NOT_FOUND", message: "Reverse-engineering job not found." });
      const analysis = job.analysis;
      const assembledProfile = profileAssembledWreath(analysis);
      const reverseRecipe = buildReverseRecipe(analysis);
      const reverseBlueprint = buildReverseBlueprint(analysis);
      const wgsGenome = buildWgsReverseGenome(analysis);
      const scoreReport = buildReverseScoreReport(analysis);
      const reverseEcr = buildReverseEcrPackage(analysis);
      const packageUpload = await storagePut(`signature-wreaths/ecr/${job.id}.ecrpkg`, serializeEcrPackage(reverseEcr.package), "application/vnd.evercrafted.ecrpkg+gzip");
      const blueprintUpload = await storagePut(`signature-wreaths/blueprints/${job.id}.blueprintpkg`, serializeEcrPackage(reverseBlueprint), "application/vnd.evercrafted.blueprint+gzip");
      const florals = Array.isArray(analysis.florals) ? analysis.florals : [];
      let generatedStory;
      try {
        const storyResponse = await invokeLLM({ messages: [{ role: "system", content: "You are Evercrafted's Story Genesis Engine. Return only JSON. From this reverse-engineered wreath analysis, write a 600\u2013800 word five-movement narrative with 7\u20139 cinematic beats. Use present tense, they/them/their pronouns, specific sensory detail, and no product copy." }, { role: "user", content: JSON.stringify({ title: input.title, analysis }) }], response_format: { type: "json_schema", json_schema: { name: "signature_story_genesis", strict: true, schema: storySchema2 } } });
        const content = storyResponse.choices?.[0]?.message?.content;
        if (typeof content !== "string") throw new Error("Story Genesis returned no narrative.");
        const parsedStory = JSON.parse(content);
        if (!parsedStory.body || parsedStory.body.trim().length < 100 || !Array.isArray(parsedStory.beats) || parsedStory.beats.length < 7) throw new Error("Story Genesis returned an incomplete narrative.");
        generatedStory = parsedStory;
      } catch (storyError) {
        console.error("[Signature] story generation failed", storyError);
        throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Story Genesis did not return a complete narrative. Retry after reviewing the reverse-engineering analysis." });
      }
      const collectionDNA = { collectionName: generatedStory.metadata.collectionName ?? input.collection, atmosphereArchetype: generatedStory.metadata.atmosphere ?? analysis.emotionProfile?.primary ?? "Uncategorized", emotionalTags: [analysis.emotionProfile?.primary, analysis.emotionProfile?.secondary].filter((tag) => typeof tag === "string"), storyDna: generatedStory.title, source: "story_genesis" };
      const draft = await db.insert(signatureWreaths).values({ ownerId: ctx.user.id, reverseEngineeringJobId: job.id, slug: input.slug, title: input.title, collection: input.collection, status: "draft", story: generatedStory, recipe: reverseRecipe, blueprint: reverseBlueprint, ecrPackage: { version: "ECR_REVERSE_V1", status: "awaiting_blueprint_review", blueprint: reverseBlueprint, scene: reverseEcr.scene, package: reverseEcr.package, artifact: { ...buildSignatureArtifactMetadata(packageUpload.key), url: packageUpload.url }, blueprintArtifact: { ...buildSignatureArtifactMetadata(blueprintUpload.key), url: blueprintUpload.url, mimeType: "application/vnd.evercrafted.blueprint+gzip", extension: ".blueprintpkg" }, wgsGenome, scoreReport }, priceCents: 1900, metadata: { confidence: job.confidence, flags: job.flags, sourceHash: job.sourceHash, assembledProfile, wgsGenome, scoreReport, collectionDNA, storyVersion: 1, storyUpdatedAt: Date.now() } }).returning({ insertId: signatureWreaths.id });
      return { id: Number(draft[0].insertId), slug: input.slug, status: "draft" };
    }),
    setStatus: adminProcedure2.input(z3.object({ id: z3.number().int().positive(), status: z3.enum(["draft", "review", "approved", "published", "archived", "rejected"]) })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      await db.update(signatureWreaths).set({ status: input.status }).where(eq3(signatureWreaths.id, input.id));
      return input;
    }),
    generateLifestylePrompts: adminProcedure2.input(z3.object({ id: z3.number().int().positive(), count: z3.number().int().min(3).max(9).default(5) })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const rows = await db.select().from(signatureWreaths).where(eq3(signatureWreaths.id, input.id)).limit(1);
      const wreath = rows[0];
      if (!wreath) throw new TRPCError3({ code: "NOT_FOUND", message: "Signature Wreath not found." });
      const story = wreath.story ?? {};
      const beats = Array.isArray(story.beats) ? story.beats : [];
      if (beats.length < 3) throw new TRPCError3({ code: "BAD_REQUEST", message: "Generate a complete Story Genesis narrative before creating lifestyle prompts." });
      const prompts = beats.slice(0, input.count).map((beat, index) => ({ id: `lifestyle-${index + 1}`, name: String(beat.name ?? `Lifestyle beat ${index + 1}`), setting: String(beat.setting ?? "A lived-in threshold"), prompt: String(beat.prompt ?? "Cinematic Evercrafted lifestyle scene"), status: "awaiting_external_render", renderAssetId: null }));
      const metadata = wreath.metadata ?? {};
      await db.update(signatureWreaths).set({ metadata: { ...metadata, lifestylePrompts: prompts, lifestylePromptVersion: Number(metadata.lifestylePromptVersion ?? 0) + 1, lifestylePromptsUpdatedAt: Date.now() } }).where(eq3(signatureWreaths.id, input.id));
      return { id: input.id, prompts };
    }),
    reviseStory: adminProcedure2.input(z3.object({ id: z3.number().int().positive(), direction: z3.string().max(1e3).default("") })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const rows = await db.select().from(signatureWreaths).where(eq3(signatureWreaths.id, input.id)).limit(1);
      const wreath = rows[0];
      if (!wreath) throw new TRPCError3({ code: "NOT_FOUND", message: "Signature Wreath not found." });
      const response = await invokeLLM({ messages: [{ role: "system", content: "You are Evercrafted's Story Genesis Engine. Return only JSON. Write a 600\u2013800 word five-movement literary narrative with 7\u20139 cinematic beats from this reverse-engineered Signature Wreath. Use present tense, they/them/their pronouns, sensory detail, and no product copy." }, { role: "user", content: JSON.stringify({ title: wreath.title, analysis: wreath.metadata, currentStory: wreath.story, revisionDirection: input.direction }) }], response_format: { type: "json_schema", json_schema: { name: "signature_story_genesis_revision", strict: true, schema: storySchema2 } } });
      const content = response.choices?.[0]?.message?.content;
      if (typeof content !== "string") throw new TRPCError3({ code: "BAD_REQUEST", message: "Story Genesis returned no narrative." });
      const story = JSON.parse(content);
      const metadata = wreath.metadata ?? {};
      const storyVersion = Number(metadata.storyVersion ?? 0) + 1;
      await db.update(signatureWreaths).set({ story, metadata: { ...metadata, storyVersion, storyUpdatedAt: Date.now(), storyRevisionDirection: input.direction } }).where(eq3(signatureWreaths.id, input.id));
      return { id: input.id, storyVersion, story };
    }),
    requestPurchasedDelivery: protectedProcedure.input(z3.object({ id: z3.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const rows = await db.select().from(signatureWreaths).where(eq3(signatureWreaths.id, input.id)).limit(1);
      const wreath = rows[0];
      if (!wreath || wreath.status !== "published") throw new TRPCError3({ code: "NOT_FOUND", message: "Published Signature Wreath not found." });
      if (!isAdminUser(ctx.user) && !await hasEntitlement(ctx.user.id, `signature:${wreath.id}:blueprint`)) throw new TRPCError3({ code: "FORBIDDEN", message: "Purchase this blueprint before requesting its reverse-engineered delivery." });
      const existingDelivery = (wreath.metadata ?? {}).postPurchaseReverseEngineering;
      if (existingDelivery?.status === "review" && existingDelivery.jobId && (isAdminUser(ctx.user) || existingDelivery.purchaserId === ctx.user.id)) return { status: "review", jobId: existingDelivery.jobId, signatureWreathId: wreath.id };
      const assets = await db.select().from(signatureWreathAssets).where(and(eq3(signatureWreathAssets.signatureWreathId, wreath.id), eq3(signatureWreathAssets.kind, "hero"), eq3(signatureWreathAssets.approved, true))).orderBy(asc(signatureWreathAssets.sortOrder)).limit(1);
      const source = assets[0];
      if (!source) throw new TRPCError3({ code: "PRECONDITION_FAILED", message: "The purchased wreath does not have an approved hero render to analyze." });
      const imageResponse = await fetch(source.url);
      if (!imageResponse.ok) throw new TRPCError3({ code: "BAD_GATEWAY", message: "The purchased wreath render could not be retrieved." });
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      const mimeType = imageResponse.headers.get("content-type")?.split(";")[0] === "image/jpeg" ? "image/jpeg" : imageResponse.headers.get("content-type")?.split(";")[0] === "image/webp" ? "image/webp" : "image/png";
      const rawBase64 = imageBuffer.toString("base64");
      const sourceHash = createHash("sha256").update(imageBuffer).digest("hex");
      const fileKey = `customer-deliveries/${ctx.user.id}/signature-${wreath.id}/${sourceHash}.${mimeType === "image/jpeg" ? "jpg" : mimeType.split("/")[1]}`;
      const uploaded = await storagePut(fileKey, imageBuffer, mimeType);
      const insert = await db.insert(reverseEngineeringJobs).values({ ownerId: ctx.user.id, title: `${wreath.title} \xB7 purchased blueprint delivery`, sourceFileKey: uploaded.key, sourceUrl: source.url, sourceHash, status: "analyzing", analysis: {}, confidence: "low", flags: [] }).returning({ insertId: reverseEngineeringJobs.id });
      const jobId = Number(insert[0].insertId);
      try {
        const response = await generateClaudeJson([{ role: "system", content: `You are Evercrafted's Blueprint Reverse Engineer. Analyze only the visible completed wreath. Never invent SKUs; use low confidence and flag uncertainty. Return JSON only matching this schema: ${JSON.stringify(reverseEngineeringSchema)}` }, { role: "user", content: [{ type: "text", text: `Reverse-engineer this purchased Signature Wreath for customer blueprint delivery. Title: ${wreath.title}` }, { type: "image_url", image_url: { url: `data:${mimeType};base64,${rawBase64}`, detail: "high" } }] }], 5e3);
        const content = response.choices?.[0]?.message?.content;
        if (typeof content !== "string") throw new Error("Reverse-engineering returned no content.");
        const analysis = sanitizeReverseEngineering(JSON.parse(content));
        await db.update(reverseEngineeringJobs).set({ status: "review", analysis, confidence: analysis.confidenceOverall, flags: analysis.flags }).where(eq3(reverseEngineeringJobs.id, jobId));
        if (analysis.florals.length) await db.insert(reverseEngineeringElements).values(analysis.florals.map((floral) => ({ jobId, role: floral.role, identifiedAs: floral.identifiedAs, confidence: floral.confidence, color: floral.color, estimatedStemCount: floral.estimatedStemCount, skuMatch: floral.skuMatch, skuNeeded: floral.skuNeeded, placementZones: floral.placementZones, flag: floral.flag })));
        const metadata = wreath.metadata ?? {};
        await db.update(signatureWreaths).set({ metadata: { ...metadata, postPurchaseReverseEngineering: { status: "review", jobId, purchaserId: ctx.user.id, sourceAssetId: source.id, sourceHash, completedAt: Date.now() } } }).where(eq3(signatureWreaths.id, wreath.id));
        return { status: "review", jobId, signatureWreathId: wreath.id, analysis };
      } catch (error) {
        await db.update(reverseEngineeringJobs).set({ status: "rejected", flags: ["Reverse engineering failed; retry delivery."], analysis: { error: error instanceof Error ? error.message : String(error) } }).where(eq3(reverseEngineeringJobs.id, jobId));
        throw new TRPCError3({ code: "BAD_GATEWAY", message: "Claude Blueprint Reverse Engineer could not complete the purchased delivery. Please retry." });
      }
    }),
    checkout: protectedProcedure.input(z3.object({ id: z3.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const rows = await db.select().from(signatureWreaths).where(eq3(signatureWreaths.id, input.id)).limit(1);
      const wreath = rows[0];
      if (!wreath || wreath.status !== "published") throw new TRPCError3({ code: "NOT_FOUND", message: "Published Signature Wreath not found." });
      const origin = `${ctx.req.protocol}://${ctx.req.headers.host ?? ""}`;
      return createSignatureCheckout({ signatureWreathId: wreath.id, title: wreath.title, priceCents: wreath.priceCents, userId: ctx.user.id, email: ctx.user.email, name: ctx.user.name, origin });
    }),
    download: protectedProcedure.input(z3.object({ id: z3.number().int().positive(), kind: z3.enum(["blueprint", "ecrpkg"]) })).query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const rows = await db.select().from(signatureWreaths).where(eq3(signatureWreaths.id, input.id)).limit(1);
      const wreath = rows[0];
      if (!wreath || wreath.status !== "published") throw new TRPCError3({ code: "NOT_FOUND", message: "Published Signature Wreath not found." });
      const plan = isAdminUser(ctx.user) ? "studio" : await getUserPlanCode(ctx.user.id);
      const ownedBlueprint = isAdminUser(ctx.user) || await hasEntitlement(ctx.user.id, `signature:${wreath.id}:blueprint`);
      if (input.kind === "blueprint" && !ownedBlueprint && !canUse(plan, "canDownloadBlueprint")) throw new TRPCError3({ code: "FORBIDDEN", message: "Purchase this Signature Wreath or choose Maker access before downloading the blueprint." });
      if (input.kind === "ecrpkg" && !canUse(plan, "canPackageEcr")) throw new TRPCError3({ code: "FORBIDDEN", message: "Studio access is required for Signature Wreath ECR packages." });
      const pkg = wreath.ecrPackage ?? {};
      const artifact = input.kind === "blueprint" ? pkg.blueprintArtifact : pkg.artifact;
      const key = artifact?.key;
      if (!key) throw new TRPCError3({ code: "NOT_FOUND", message: "This Signature Wreath has no packaged artifact yet." });
      return { url: await storageGetSignedUrl(key), expiresInSeconds: 900, kind: input.kind };
    })
  }),
  lookbook: router({
    bySlug: publicProcedure.input(z3.object({ slug: z3.string().min(1).max(180) })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db.select().from(lookbooks).where(eq3(lookbooks.slug, input.slug)).limit(1);
      const lookbook = rows[0];
      return lookbook && (lookbook.status === "shareable" || lookbook.status === "published") ? loadLookbookPresentation(db, lookbook) : null;
    }),
    byShareToken: publicProcedure.input(z3.object({ token: z3.string().min(16).max(96) })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db.select().from(lookbooks).where(eq3(lookbooks.shareToken, input.token)).limit(1);
      const lookbook = rows[0];
      if (!lookbook || lookbook.status === "draft" || lookbook.status === "archived") return null;
      return loadLookbookPresentation(db, lookbook);
    }),
    mine: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const ownedProjects = await db.select({ id: projects.id }).from(projects).where(eq3(projects.userId, ctx.user.id)).limit(100);
      const projectIds = ownedProjects.map((project) => project.id);
      if (!projectIds.length) return [];
      const rows = await db.select().from(lookbooks).where(inArray(lookbooks.projectId, projectIds)).orderBy(desc2(lookbooks.updatedAt)).limit(100);
      return Promise.all(rows.map((lookbook) => loadLookbookPresentation(db, lookbook)));
    }),
    create: protectedProcedure.input(z3.object({ projectId: z3.number().int().positive(), slug: z3.string().min(1).max(180), title: z3.string().min(1).max(180), content: z3.record(z3.string(), z3.unknown()).default({}) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const projectRows = await db.select().from(projects).where(and(eq3(projects.id, input.projectId), eq3(projects.userId, ctx.user.id))).limit(1);
      if (!projectRows[0] && ctx.user.role !== "admin") throw new TRPCError3({ code: "FORBIDDEN", message: "Project ownership required." });
      await db.insert(lookbooks).values(input);
      return input;
    }),
    ensure: protectedProcedure.input(z3.object({ projectId: z3.number().int().positive(), slug: z3.string().min(1).max(180), title: z3.string().min(1).max(180) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const projectRows = await db.select().from(projects).where(eq3(projects.id, input.projectId)).limit(1);
      if (!projectRows[0] || projectRows[0].userId !== ctx.user.id && ctx.user.role !== "admin") throw new TRPCError3({ code: "FORBIDDEN", message: "Project ownership required." });
      const existing = await db.select().from(lookbooks).where(eq3(lookbooks.projectId, input.projectId)).orderBy(desc2(lookbooks.updatedAt)).limit(1);
      if (existing[0]) return loadLookbookPresentation(db, existing[0]);
      await db.insert(lookbooks).values({ projectId: input.projectId, slug: input.slug, title: input.title, status: "draft", content: {} });
      const created = await db.select().from(lookbooks).where(eq3(lookbooks.projectId, input.projectId)).orderBy(desc2(lookbooks.updatedAt)).limit(1);
      return created[0] ? loadLookbookPresentation(db, created[0]) : null;
    }),
    update: protectedProcedure.input(z3.object({ id: z3.number().int().positive(), title: z3.string().min(1).max(180).optional(), content: z3.record(z3.string(), z3.unknown()).optional() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const owned = await db.select({ id: lookbooks.id }).from(lookbooks).innerJoin(projects, eq3(lookbooks.projectId, projects.id)).where(and(eq3(lookbooks.id, input.id), eq3(projects.userId, ctx.user.id))).limit(1);
      if (!owned[0] && ctx.user.role !== "admin") throw new TRPCError3({ code: "FORBIDDEN", message: "You do not have access to this lookbook." });
      const { id, ...changes } = input;
      await db.update(lookbooks).set(changes).where(eq3(lookbooks.id, id));
      return input;
    }),
    setStatus: protectedProcedure.input(z3.object({ id: z3.number().int().positive(), status: z3.enum(["draft", "shareable", "published", "archived"]) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const owned = await db.select({ id: lookbooks.id }).from(lookbooks).innerJoin(projects, eq3(lookbooks.projectId, projects.id)).where(and(eq3(lookbooks.id, input.id), eq3(projects.userId, ctx.user.id))).limit(1);
      if (!owned[0] && ctx.user.role !== "admin") throw new TRPCError3({ code: "FORBIDDEN", message: "You do not have access to this lookbook." });
      await db.update(lookbooks).set({ status: input.status }).where(eq3(lookbooks.id, input.id));
      return input;
    }),
    generateShareLink: protectedProcedure.input(z3.object({ id: z3.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const owned = await db.select({ id: lookbooks.id }).from(lookbooks).innerJoin(projects, eq3(lookbooks.projectId, projects.id)).where(and(eq3(lookbooks.id, input.id), eq3(projects.userId, ctx.user.id))).limit(1);
      if (!owned[0]) throw new TRPCError3({ code: "FORBIDDEN", message: "You do not have access to this lookbook." });
      const token = randomUUID().replaceAll("-", "");
      await db.update(lookbooks).set({ shareToken: token, status: "shareable" }).where(eq3(lookbooks.id, input.id));
      return { id: input.id, token, path: buildLookbookSharePath(token), status: "shareable" };
    })
  }),
  floral: router({
    decisions: protectedProcedure.input(z3.object({ projectId: z3.number().int().positive() })).query(({ input }) => listFloralDecisions(input.projectId)),
    decide: protectedProcedure.input(z3.object({ projectId: z3.number().int().positive(), itemId: z3.string().min(1), seed: z3.number().int(), role: z3.string().min(1), decision: z3.enum(["pending", "accepted", "rejected"]), explanation: z3.string().min(1) })).mutation(({ input }) => saveFloralDecision(input))
  }),
  billing: router({
    capabilities: protectedProcedure.query(async ({ ctx }) => getPlanCapabilities(isAdminUser(ctx.user) ? "studio" : await getUserPlanCode(ctx.user.id))),
    checkout: protectedProcedure.input(z3.object({ plan: z3.enum(["reader", "maker", "studio"]) })).mutation(async ({ ctx, input }) => {
      const origin = `${ctx.req.protocol}://${ctx.req.headers.host ?? ""}`;
      return createPlanCheckout({ plan: input.plan, userId: ctx.user.id, email: ctx.user.email, name: ctx.user.name, origin });
    })
  }),
  artifact: router({
    upload: protectedProcedure.input(z3.object({ projectId: z3.number().int().positive(), kind: z3.enum(["blueprint_pdf", "ecrpkg"]), filename: z3.string().min(1).max(180), mimeType: z3.string().min(3).max(120), base64: z3.string().min(20), blueprintAsset: z3.boolean().default(false) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const ownerRows = await db.select().from(projects).where(eq3(projects.id, input.projectId)).limit(1);
      const owner = ownerRows[0];
      if (!owner || owner.userId !== ctx.user.id && !isAdminUser(ctx.user)) throw new TRPCError3({ code: "FORBIDDEN", message: "You do not own this project." });
      const buffer = Buffer.from(input.base64.replace(/^data:[^;]+;base64,/, ""), "base64");
      const uploaded = await storagePut(`projects/${input.projectId}/artifacts/${input.filename}`, buffer, input.mimeType);
      const result = await db.insert(renderAssets).values({ projectId: input.projectId, kind: input.kind, status: "approved", fileKey: uploaded.key, url: uploaded.url, provenance: { source: "client_generated_artifact", blueprintAsset: input.blueprintAsset, uploadedAt: (/* @__PURE__ */ new Date()).toISOString() } }).returning({ insertId: renderAssets.id });
      return { assetId: Number(result[0].insertId), status: "approved" };
    })
  }),
  render: router({
    taskList: adminProcedure2.input(z3.object({ projectId: z3.number().int().positive() })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(cometRenderTasks).where(eq3(cometRenderTasks.projectId, input.projectId)).orderBy(desc2(cometRenderTasks.createdAt)).limit(40);
    }),
    estimateCometBatch: adminProcedure2.input(z3.object({ model: z3.string().min(1).max(160), operation: z3.enum(["imagine", "describe", "blend", "action", "upscale"]), count: z3.number().int().min(1).max(100) })).query(({ input }) => estimateCometCost(input)),
    taskStatus: adminProcedure2.input(z3.object({ taskId: z3.number().int().positive() })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      return (await db.select().from(cometRenderTasks).where(eq3(cometRenderTasks.id, input.taskId)).limit(1))[0] ?? null;
    }),
    refreshComet: adminProcedure2.input(z3.object({ taskId: z3.number().int().positive() })).mutation(async ({ input }) => {
      try {
        return await reconcileCometTask(input.taskId);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { taskId: input.taskId, status: "polling", message };
      }
    }),
    enqueueComet: adminProcedure2.input(z3.object({ projectId: z3.number().int().positive(), kind: z3.enum(["wreath", "lifestyle"]), operation: z3.enum(["imagine", "describe", "blend", "action", "upscale"]), prompt: z3.string().max(12e3).default(""), model: z3.string().max(120).optional(), mode: z3.enum(["FAST", "TURBO"]).optional(), parameters: z3.string().max(240).optional(), parentAssetId: z3.number().int().positive().optional(), sourceTaskId: z3.string().max(240).optional(), sourceAssetId: z3.number().int().positive().optional(), sourceImageUrls: z3.array(z3.string().url()).max(4).optional(), index: z3.number().int().min(1).max(4).optional(), sceneIndex: z3.number().int().min(0).max(20).optional(), sceneTitle: z3.string().max(180).optional(), actionLabel: z3.string().max(160).default("Manual render"), estimateMetadata: z3.record(z3.string(), z3.unknown()).optional() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      let sourceImageUrls = input.sourceImageUrls ?? [];
      if (input.sourceAssetId) {
        const source = (await db.select().from(renderAssets).where(eq3(renderAssets.id, input.sourceAssetId)).limit(1))[0];
        if (!source || source.projectId !== input.projectId) throw new TRPCError3({ code: "NOT_FOUND", message: "Source render not found." });
        sourceImageUrls = [...sourceImageUrls, source.url];
      }
      const request = { ...input, sourceImageUrls, operation: input.operation };
      const inserted = await db.insert(cometRenderTasks).values({ projectId: input.projectId, providerTaskId: `queued-${randomUUID()}`, kind: input.kind, operation: input.operation, model: input.model ?? null, status: "queued", progress: 0, message: "Queued for CometAPI", sceneIndex: input.sceneIndex ?? null, sceneTitle: input.sceneTitle ?? null, metadata: { trigger: "manual", actionLabel: input.actionLabel, requestedAt: (/* @__PURE__ */ new Date()).toISOString(), promptPreview: input.prompt.slice(0, 240), sourceTaskId: input.sourceTaskId ?? null, sourceAssetId: input.sourceAssetId ?? null, estimate: input.estimateMetadata ?? null, estimateConfirmed: Boolean(input.estimateMetadata) } }).returning({ insertId: cometRenderTasks.id });
      const taskId = Number(inserted[0].insertId);
      void processCometTask(taskId, request);
      return { taskId, status: "queued" };
    }),
    generateComet: adminProcedure2.input(z3.object({ projectId: z3.number().int().positive(), kind: z3.enum(["wreath", "lifestyle"]), operation: z3.enum(["imagine", "describe", "blend", "action", "upscale"]), prompt: z3.string().max(12e3).default(""), model: z3.string().max(120).optional(), mode: z3.enum(["FAST", "TURBO"]).optional(), parentAssetId: z3.number().int().positive().optional(), sourceAssetId: z3.number().int().positive().optional(), sourceTaskId: z3.string().max(240).optional(), sourceImageUrls: z3.array(z3.string().url()).max(4).optional(), index: z3.number().int().min(1).max(4).optional(), sceneIndex: z3.number().int().min(0).max(20).optional(), sceneTitle: z3.string().max(180).optional(), parameters: z3.string().max(240).optional() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const ownerRows = await db.select().from(projects).where(eq3(projects.id, input.projectId)).limit(1);
      if (!ownerRows[0]) throw new TRPCError3({ code: "NOT_FOUND", message: "Project not found." });
      let sourceImageUrls = input.sourceImageUrls ?? [];
      if (input.sourceAssetId) {
        const sourceRows = await db.select().from(renderAssets).where(eq3(renderAssets.id, input.sourceAssetId)).limit(1);
        if (!sourceRows[0] || sourceRows[0].projectId !== input.projectId) throw new TRPCError3({ code: "NOT_FOUND", message: "Source render not found." });
        sourceImageUrls = [...sourceImageUrls, sourceRows[0].url];
      }
      const result = await generateCometRender({ operation: input.operation, prompt: input.prompt, model: input.model, mode: input.mode, parameters: input.parameters, sourceTaskId: input.sourceTaskId, sourceImageUrls, index: input.index });
      if (!result.imageUrl) throw new TRPCError3({ code: "BAD_GATEWAY", message: "CometAPI completed without an image URL." });
      const downloaded = await downloadCometImage(result.imageUrl);
      const extension = downloaded.contentType.includes("jpeg") ? "jpg" : downloaded.contentType.includes("webp") ? "webp" : "png";
      const uploaded = await storagePut(`projects/${input.projectId}/cometapi/${input.kind}/${result.taskId}.${extension}`, downloaded.buffer, downloaded.contentType);
      const completedAt = (/* @__PURE__ */ new Date()).toISOString();
      const submittedPrompt = input.operation === "imagine" && input.model === "mj-fast-imagine" ? assembleMidjourneyPrompt(input.prompt, input.parameters) : input.prompt;
      const provenance = { source: "cometapi", provider: "cometapi", operation: input.operation, model: input.model ?? null, mode: input.mode ?? null, taskId: result.taskId, parentAssetId: input.parentAssetId ?? input.sourceAssetId ?? null, sourceTaskId: input.sourceTaskId ?? null, sourceImageUrls, prompt: input.prompt, submittedPrompt, parameters: input.operation === "imagine" && input.model === "mj-fast-imagine" ? input.parameters ?? "--raw --exp 5 --q 2 --chaos 10 --stylize 125 --v 7" : null, sceneIndex: input.sceneIndex ?? null, sceneTitle: input.sceneTitle ?? null, generatedAt: completedAt, reviewDecision: "pending", reviewHistory: [{ event: "submitted", at: completedAt, operation: input.operation, taskId: result.taskId }, { event: "completed", at: completedAt, taskId: result.taskId }] };
      const inserted = await db.insert(renderAssets).values({ projectId: input.projectId, kind: input.kind, status: "review", fileKey: uploaded.key, url: uploaded.url, provenance }).returning({ insertId: renderAssets.id });
      return { assetId: Number(inserted[0].insertId), taskId: result.taskId, status: "review", url: uploaded.url, provenance };
    }),
    upload: adminProcedure2.input(z3.object({ projectId: z3.number().int().positive(), kind: z3.enum(["wreath", "lifestyle", "blueprint_pdf", "ecrpkg"]), filename: z3.string().min(1).max(180), mimeType: z3.string().min(3).max(120), base64: z3.string().min(20), sceneIndex: z3.number().int().min(0).max(20).optional(), sceneTitle: z3.string().max(180).optional(), prompt: z3.string().max(12e3).optional() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const buffer = Buffer.from(input.base64.replace(/^data:[^;]+;base64,/, ""), "base64");
      const uploaded = await storagePut(`projects/${input.projectId}/${input.kind}/${input.filename}`, buffer, input.mimeType);
      const provenance = input.kind === "lifestyle" ? { source: "studio_upload", filename: input.filename, sceneIndex: input.sceneIndex ?? null, sceneTitle: input.sceneTitle ?? null, prompt: input.prompt ?? null, uploadedAt: (/* @__PURE__ */ new Date()).toISOString() } : { source: "studio_upload", filename: input.filename, prompt: input.prompt ?? null, uploadedAt: (/* @__PURE__ */ new Date()).toISOString() };
      const inserted = await db.insert(renderAssets).values({ projectId: input.projectId, kind: input.kind, status: "review", fileKey: uploaded.key, url: uploaded.url, provenance }).returning({ insertId: renderAssets.id });
      return { assetId: Number(inserted[0].insertId), key: uploaded.key, url: uploaded.url, kind: input.kind, status: "review" };
    }),
    reviewQueue: adminProcedure2.input(z3.object({ projectId: z3.number().int().positive(), limit: z3.number().min(1).max(200).default(100) })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(renderAssets).where(and(eq3(renderAssets.projectId, input.projectId), ne(renderAssets.status, "rejected"))).orderBy(desc2(renderAssets.createdAt)).limit(input.limit);
    }),
    review: adminProcedure2.input(z3.object({ assetId: z3.number().int().positive(), status: z3.enum(["review", "approved", "rejected", "published"]), rejectionReason: z3.string().max(500).optional(), replacementForId: z3.number().int().positive().optional() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const rows = await db.select().from(renderAssets).where(eq3(renderAssets.id, input.assetId)).limit(1);
      const asset = rows[0];
      if (!asset) throw new TRPCError3({ code: "NOT_FOUND", message: "Render asset not found." });
      const currentProvenance = asset.provenance ?? {};
      const existingHistory = Array.isArray(currentProvenance.reviewHistory) ? currentProvenance.reviewHistory : [];
      const reviewHistory = [...existingHistory, { event: input.status, at: (/* @__PURE__ */ new Date()).toISOString(), rejectionReason: input.rejectionReason ?? null }];
      const storyRows = asset.kind === "wreath" && input.status === "approved" ? await db.select().from(stories).where(eq3(stories.projectId, asset.projectId)).orderBy(desc2(stories.createdAt)).limit(1) : [];
      const storyBeats = Array.isArray(storyRows?.[0]?.beats) ? storyRows[0].beats : [];
      const generatedScenePrompts = asset.kind === "wreath" && input.status === "approved" ? buildLifestyleScenePrompts(typeof currentProvenance.prompt === "string" ? currentProvenance.prompt : null, storyBeats) : void 0;
      const provenance = generatedScenePrompts ? { ...currentProvenance, generatedScenePrompts, generatedScenePromptsAt: (/* @__PURE__ */ new Date()).toISOString(), reviewHistory } : { ...currentProvenance, reviewHistory };
      await db.update(renderAssets).set({ status: input.status, rejectionReason: input.rejectionReason ?? null, provenance }).where(eq3(renderAssets.id, input.assetId));
      return { assetId: input.assetId, status: input.status, replacementForId: input.replacementForId ?? null, generatedScenePrompts: generatedScenePrompts ?? null };
    }),
    signedDownload: adminProcedure2.input(z3.object({ key: z3.string().min(1) })).query(async ({ input }) => ({ url: await storageGetSignedUrl(input.key) })),
    clientDownload: protectedProcedure.input(z3.object({ assetId: z3.number().int().positive() })).query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      const assets = await db.select().from(renderAssets).where(eq3(renderAssets.id, input.assetId)).limit(1);
      const asset = assets[0];
      if (!asset || asset.status !== "approved" && asset.status !== "published") throw new TRPCError3({ code: "NOT_FOUND", message: "Approved asset not found." });
      const ownerRows = await db.select().from(projects).where(eq3(projects.id, asset.projectId)).limit(1);
      const owner = ownerRows[0];
      if (!owner || owner.userId !== ctx.user.id && !isAdminUser(ctx.user)) throw new TRPCError3({ code: "FORBIDDEN", message: "You do not own this asset." });
      const plan = isAdminUser(ctx.user) ? "studio" : await getUserPlanCode(ctx.user.id);
      if (asset.kind === "ecrpkg" && !canUse(plan, "canPackageEcr")) throw new TRPCError3({ code: "FORBIDDEN", message: "Studio access is required for ECR packages." });
      if (asset.kind === "blueprint_pdf" && !canUse(plan, "canDownloadBlueprint")) throw new TRPCError3({ code: "FORBIDDEN", message: "Maker access is required for blueprint downloads." });
      return { url: await storageGetSignedUrl(asset.fileKey), expiresInSeconds: 900 };
    })
  }),
  inventory: router({
    list: publicProcedure.input(z3.object({ limit: z3.number().min(1).max(200).default(50), offset: z3.number().min(0).default(0) }).default(() => ({ limit: 50, offset: 0 }))).query(async ({ input }) => ({ items: await listInventoryItems(input.limit, input.offset), total: await countInventoryItems() })),
    importBatch: adminProcedure2.input(z3.object({ filename: z3.string().min(1).max(180), items: z3.array(inventoryRecord).min(1).max(2e3) })).mutation(async ({ input }) => {
      const seen = /* @__PURE__ */ new Set();
      const duplicates = [];
      const missing = [];
      for (const item of input.items) {
        const key = String(item.item_id ?? item.source_sku ?? "");
        if (!key) missing.push(String(item.name ?? "unknown"));
        else if (seen.has(key)) duplicates.push(key);
        else seen.add(key);
      }
      const validationReport = { missingRequired: missing, duplicates, uniqueItems: seen.size, importedRows: input.items.length };
      const result = await saveInventoryBatch(input.filename, input.items, validationReport);
      await notifyOwner({ title: "Inventory batch imported", content: `${input.filename} added ${result.inserted} records to the review queue.` });
      return result;
    }),
    setApproval: adminProcedure2.input(z3.object({ itemId: z3.string().min(1), approved: z3.boolean(), status: z3.enum(["active", "substitute", "inactive"]).default("active"), replacementItemId: z3.string().max(80).optional(), provenanceDecision: z3.enum(["unreviewed", "verified", "flagged"]).default("unreviewed") })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable." });
      await db.update(inventoryItems).set({ approved: input.approved, status: input.status, replacementItemId: input.replacementItemId ?? null, provenanceDecision: input.provenanceDecision }).where(eq3(inventoryItems.itemId, input.itemId));
      return { itemId: input.itemId, approved: input.approved, status: input.status, replacementItemId: input.replacementItemId ?? null, provenanceDecision: input.provenanceDecision };
    }),
    reviewQueue: adminProcedure2.input(z3.object({ limit: z3.number().min(1).max(200).default(100) }).default(() => ({ limit: 100 }))).query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(inventoryItems).orderBy(desc2(inventoryItems.createdAt)).limit(input.limit);
    })
  })
});

// server/_core/supabaseAuth.ts
import { createClient } from "@supabase/supabase-js";

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/supabaseAuth.ts
var supabaseAdmin = ENV.supabaseUrl && ENV.supabaseServiceRoleKey ? createClient(ENV.supabaseUrl, ENV.supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
}) : null;
function getBearerToken(req) {
  const header = req.headers.authorization;
  if (typeof header === "string" && header.startsWith("Bearer ")) {
    return header.slice(7);
  }
  return void 0;
}
async function authenticateRequest(req) {
  if (!supabaseAdmin) {
    throw ForbiddenError("Supabase auth is not configured (missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  }
  const token = getBearerToken(req);
  if (!token) throw ForbiddenError("Missing bearer token");
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) throw ForbiddenError("Invalid or expired session");
  const supabaseUser = data.user;
  const signedInAt = /* @__PURE__ */ new Date();
  let user = await getUserByOpenId(supabaseUser.id);
  if (!user) {
    await upsertUser({
      openId: supabaseUser.id,
      name: typeof supabaseUser.user_metadata?.full_name === "string" ? supabaseUser.user_metadata.full_name : null,
      email: supabaseUser.email ?? null,
      loginMethod: typeof supabaseUser.app_metadata?.provider === "string" ? supabaseUser.app_metadata.provider : null,
      lastSignedIn: signedInAt
    });
    user = await getUserByOpenId(supabaseUser.id);
  } else {
    await upsertUser({ openId: supabaseUser.id, lastSignedIn: signedInAt });
  }
  if (!user) throw ForbiddenError("User not found");
  return user;
}

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/app.ts
function buildApp() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  return app;
}

// server/_core/vercelEntry.ts
var vercelEntry_default = buildApp();
export {
  vercelEntry_default as default
};
