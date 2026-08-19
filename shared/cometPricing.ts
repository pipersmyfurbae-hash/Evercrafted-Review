export type CometPricingOperation = "imagine" | "describe" | "blend" | "action" | "upscale";

export type CometCostEstimate = {
  model: string;
  operation: CometPricingOperation;
  count: number;
  currency: "USD";
  unitUsd: number | null;
  totalUsd: number | null;
  pricingKnown: boolean;
  basis: "public_reference" | "unpriced_model";
  note: string;
};

/**
 * Reference estimates are intentionally isolated from the render adapter. CometAPI
 * bills Midjourney-compatible models per call, and account pricing can change.
 * The UI must label these as estimates and never represent them as invoices.
 */
export const COMET_REFERENCE_RATES_USD: Record<string, number> = {
  "mj-fast-imagine": 0.056,
  "mj-fast-upscale-subtle": 0.056,
  "mj-turbo-pic-reader": 0.168,
  "mj-turbo-low-variation": 0.168,
};

export function canQueueCometBatch(input: { count: number; estimateReady: boolean; confirmed: boolean }) {
  if (input.count < 3) return { allowed: true, reason: "below_confirmation_threshold" as const };
  if (!input.estimateReady) return { allowed: false, reason: "estimate_unavailable" as const };
  if (!input.confirmed) return { allowed: false, reason: "confirmation_required" as const };
  return { allowed: true, reason: "confirmed" as const };
}

export function estimateCometCost(input: { model: string; operation: CometPricingOperation; count: number }): CometCostEstimate {
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
    note: unitUsd === null
      ? "No public reference rate is configured for this model. Confirm pricing in CometAPI before queueing."
      : "Reference estimate only; CometAPI account pricing and discounts may differ.",
  };
}
