import Stripe from "stripe";
import { getDb, grantEntitlement } from "./db";
import { plans, subscriptions } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { ENV } from "./_core/env";

export const STRIPE_PLANS = {
  reader: { name: "Reader", description: "Read the story and explore the design direction.", amountCents: 0, recurring: false },
  maker: { name: "Maker", description: "Download the blueprint and build the memory wreath by hand.", amountCents: 1900, recurring: true },
  studio: { name: "Studio", description: "Operate the full pipeline with ECR packages, lookbooks, and render review.", amountCents: 7900, recurring: true },
} as const;

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("Stripe is not configured. Claim the project Stripe sandbox or add keys in Settings → Payment.");
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-07-29.dahlia" });
}

export function signatureEntitlementFeature(signatureWreathId: number) { return `signature:${signatureWreathId}:blueprint`; }
export function buildSignatureCheckoutMetadata(input: { userId: number; signatureWreathId: number }) { return { user_id: String(input.userId), signature_wreath_id: String(input.signatureWreathId), product: "signature_wreath_blueprint" }; }

export async function handleStripeWebhook(rawBody: Buffer, signature: string) {
  const stripe = getStripe();
  const event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET ?? "");
  if (event.id.startsWith("evt_test_")) return { verified: true as const };
  const db = await getDb();
  if (!db) throw new Error("Database unavailable.");
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = Number(session.metadata?.user_id ?? session.client_reference_id);
    const signatureWreathId = Number(session.metadata?.signature_wreath_id ?? NaN);
    if (Number.isFinite(userId) && Number.isFinite(signatureWreathId)) {
      await grantEntitlement(userId, signatureEntitlementFeature(signatureWreathId), "stripe_signature_purchase");
      return { verified: true as const, eventType: event.type, entitlement: signatureEntitlementFeature(signatureWreathId) };
    }
    const code = session.metadata?.plan === "studio" ? "studio" : "maker";
    if (Number.isFinite(userId)) {
      const planResult = await db.insert(plans).values({ code, name: STRIPE_PLANS[code].name, description: STRIPE_PLANS[code].description, monthlyPriceCents: STRIPE_PLANS[code].amountCents, generationLimit: code === "studio" ? 100 : 10, canDownloadBlueprint: true, canPackageEcr: code === "studio", canPublishLookbook: code === "studio" }).onConflictDoUpdate({ target: plans.code, set: { name: STRIPE_PLANS[code].name } }).returning({ id: plans.id });
      const planRows = await db.select().from(plans).where(eq(plans.code, code)).limit(1);
      const planId = planRows[0]?.id ?? planResult[0].id;
      // Note: subscriptions has no unique key on userId in this schema, so this always inserts a new row
      // (matches the pre-conversion MySQL behavior, which never actually hit its onDuplicateKeyUpdate branch either).
      await db.insert(subscriptions).values({ userId, planId, status: "active", externalCustomerId: typeof session.customer === "string" ? session.customer : null, externalSubscriptionId: typeof session.subscription === "string" ? session.subscription : null });
    }
  }
  return { verified: true as const, eventType: event.type };
}

export async function createSignatureCheckout(input: { signatureWreathId: number; title: string; priceCents: number; userId: number; email?: string | null; name?: string | null; origin: string }) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: input.email ?? undefined,
    client_reference_id: String(input.userId),
    allow_promotion_codes: true,
    line_items: [{ price_data: { currency: "usd", unit_amount: input.priceCents, product_data: { name: `Evercrafted Signature Wreath — ${input.title}`, description: "A finished wreath, recovered story, and hand-buildable blueprint package." } }, quantity: 1 }],
    metadata: buildSignatureCheckoutMetadata(input),
    success_url: `${input.origin}/signature-wreaths?checkout=success`,
    cancel_url: `${input.origin}/signature-wreaths?checkout=cancelled`,
  });
  return { url: session.url };
}

export async function createPlanCheckout(input: { plan: keyof typeof STRIPE_PLANS; userId: number; email?: string | null; name?: string | null; origin: string }) {
  const plan = STRIPE_PLANS[input.plan];
  if (plan.amountCents <= 0) return { url: `${input.origin}/workspace?plan=reader` };
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: plan.recurring ? "subscription" : "payment",
    customer_email: input.email ?? undefined,
    client_reference_id: String(input.userId),
    allow_promotion_codes: true,
    line_items: [{ price_data: { currency: "usd", unit_amount: plan.amountCents, recurring: plan.recurring ? { interval: "month" } : undefined, product_data: { name: `Evercrafted ${plan.name}`, description: plan.description } }, quantity: 1 }],
    metadata: { user_id: String(input.userId), customer_email: input.email ?? "", customer_name: input.name ?? "", plan: input.plan },
    success_url: `${input.origin}/workspace?checkout=success&plan=${input.plan}`,
    cancel_url: `${input.origin}/workspace?checkout=cancelled`,
  });
  return { url: session.url };
}
