import { eq, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertUser, users, inventoryBatches, inventoryItems, projects, floralSelections, plans, subscriptions, entitlements } from "../drizzle/schema";
import { ENV } from './_core/env';
import { canonicalStructuralRole, mapEvsFisa } from "../shared/inventory";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // max: 1 because each serverless invocation gets its own instance of this module.
      // connect_timeout/idle_timeout matter *because* of that: if the shared pooler is out of
      // slots (e.g. a burst of concurrent invocations), a connection attempt with no timeout
      // hangs forever instead of failing fast — and idle_timeout releases this instance's slot
      // back to the pooler quickly between requests instead of holding it until the function
      // is recycled.
      _db = drizzle(postgres(process.env.DATABASE_URL, { max: 1, connect_timeout: 10, idle_timeout: 20 }));
    }
    catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = values[field]; }
  }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listInventoryItems(limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inventoryItems).orderBy(desc(inventoryItems.createdAt)).limit(limit).offset(offset);
}

export async function countInventoryItems() {
  const db = await getDb();
  if (!db) return 0;
  const [row] = await db.select({ count: sql<number>`count(*)` }).from(inventoryItems);
  return Number(row?.count ?? 0);
}

export async function saveInventoryBatch(filename: string, items: Array<Record<string, unknown>>, validationReport: Record<string, unknown>) {
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
      approved: false,
    } : null;
  }).filter((row): row is NonNullable<typeof row> => Boolean(row));
  try {
    const chunkSize = 100;
    for (let start = 0; start < rows.length; start += chunkSize) {
      const chunk = rows.slice(start, start + chunkSize);
      await db.insert(inventoryItems).values(chunk).onConflictDoUpdate({
        target: inventoryItems.itemId,
        set: { name: sql`excluded."name"`, imageUrl: sql`excluded."imageUrl"`, reviewFlags: sql`excluded."reviewFlags"` },
      });
      await db.update(inventoryBatches).set({ processedCount: Math.min(start + chunk.length, rows.length) }).where(eq(inventoryBatches.id, batchId));
    }
    await db.update(inventoryBatches).set({ processedCount: rows.length, status: "completed" }).where(eq(inventoryBatches.id, batchId));
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "Inventory batch persistence failed.";
    await db.update(inventoryBatches).set({ status: "failed", errorMessage: message }).where(eq(inventoryBatches.id, batchId));
    throw error;
  }
  return { batchId, inserted: rows.length, status: "completed" as const };
}

export async function saveFloralDecision(input: { projectId: number; itemId: string; seed: number; role: string; decision: "pending" | "accepted" | "rejected"; explanation: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(floralSelections).values(input);
  return input;
}

export async function listFloralDecisions(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(floralSelections).where(eq(floralSelections.projectId, projectId)).orderBy(desc(floralSelections.createdAt));
}

export async function createProject(userId: number, name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(projects).values({ userId, name }).returning({ id: projects.id });
  return { id: result[0].id, name };
}

export async function grantEntitlement(userId: number, feature: string, source: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(entitlements).values({ userId, feature, source });
  return { userId, feature, source };
}

export async function hasEntitlement(userId: number, feature: string) {
  const db = await getDb();
  if (!db) return false;
  const rows = await db.select().from(entitlements).where(eq(entitlements.userId, userId)).limit(100);
  return rows.some((row) => row.feature === feature && (!row.expiresAt || row.expiresAt.getTime() > Date.now()));
}

export async function getUserPlanCode(userId: number): Promise<"reader" | "maker" | "studio"> {
  const db = await getDb();
  if (!db) return "reader";
  const active = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).orderBy(desc(subscriptions.updatedAt)).limit(5);
  const current = active.find((subscription) => subscription.status === "active" || subscription.status === "trialing");
  if (!current) return "reader";
  const planRows = await db.select().from(plans).where(eq(plans.id, current.planId)).limit(1);
  const code = planRows[0]?.code;
  return code === "studio" ? "studio" : code === "maker" ? "maker" : "reader";
}
