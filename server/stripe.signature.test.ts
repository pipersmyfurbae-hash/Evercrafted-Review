import { describe, expect, it, vi } from "vitest";

const { grantEntitlement } = vi.hoisted(() => ({ grantEntitlement: vi.fn(async (userId: number, feature: string, source: string) => ({ userId, feature, source })) }));
vi.mock("./db", () => ({ getDb: vi.fn(async () => ({})), grantEntitlement, getUserPlanCode: vi.fn(), listInventoryItems: vi.fn(), countInventoryItems: vi.fn(), saveInventoryBatch: vi.fn(), saveFloralDecision: vi.fn(), listFloralDecisions: vi.fn() }));
vi.mock("stripe", () => ({ default: class StripeMock { webhooks = { constructEvent: () => ({ id: "evt_signature_purchase", type: "checkout.session.completed", data: { object: { metadata: { user_id: "17", signature_wreath_id: "42", product: "signature_wreath_blueprint" }, client_reference_id: "17" } } }) }; } }));

import { buildSignatureCheckoutMetadata, handleStripeWebhook, signatureEntitlementFeature } from "./stripe";

describe("Signature Stripe fulfillment contracts", () => {
  it("builds stable one-time checkout metadata", () => {
    expect(buildSignatureCheckoutMetadata({ userId: 17, signatureWreathId: 42 })).toEqual({ user_id: "17", signature_wreath_id: "42", product: "signature_wreath_blueprint" });
  });

  it("uses the same entitlement feature key for webhook grants and downloads", () => {
    expect(signatureEntitlementFeature(42)).toBe("signature:42:blueprint");
  });

  it("grants the Signature Wreath entitlement on completed checkout", async () => {
    const result = await handleStripeWebhook(Buffer.from("payload"), "signature");
    expect(grantEntitlement).toHaveBeenCalledWith(17, "signature:42:blueprint", "stripe_signature_purchase");
    expect(result).toMatchObject({ eventType: "checkout.session.completed", entitlement: "signature:42:blueprint" });
  });
});
