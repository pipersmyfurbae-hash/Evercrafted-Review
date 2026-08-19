import { describe, expect, it } from "vitest";
import { canQueueCometBatch, estimateCometCost } from "../shared/cometPricing";

describe("CometAPI cost estimates", () => {
  it("calculates a fast imagine batch from the configured reference rate", () => {
    expect(estimateCometCost({ model: "mj-fast-imagine", operation: "imagine", count: 5 })).toMatchObject({
      count: 5,
      unitUsd: 0.056,
      totalUsd: 0.28,
      pricingKnown: true,
      basis: "public_reference",
    });
  });

  it("does not invent a price for an unpriced model", () => {
    expect(estimateCometCost({ model: "future-model", operation: "imagine", count: 3 })).toMatchObject({
      count: 3,
      unitUsd: null,
      totalUsd: null,
      pricingKnown: false,
      basis: "unpriced_model",
    });
  });

  it("requires an available estimate and explicit confirmation for large batches", () => {
    expect(canQueueCometBatch({ count: 3, estimateReady: false, confirmed: false })).toEqual({ allowed: false, reason: "estimate_unavailable" });
    expect(canQueueCometBatch({ count: 3, estimateReady: true, confirmed: false })).toEqual({ allowed: false, reason: "confirmation_required" });
    expect(canQueueCometBatch({ count: 3, estimateReady: true, confirmed: true })).toEqual({ allowed: true, reason: "confirmed" });
    expect(canQueueCometBatch({ count: 2, estimateReady: false, confirmed: false })).toEqual({ allowed: true, reason: "below_confirmation_threshold" });
  });

  it("clamps fractional or negative counts to a safe estimate count", () => {
    expect(estimateCometCost({ model: "mj-fast-imagine", operation: "imagine", count: -2 })).toMatchObject({ count: 0, totalUsd: 0 });
    expect(estimateCometCost({ model: "mj-fast-imagine", operation: "imagine", count: 2.9 })).toMatchObject({ count: 2, totalUsd: 0.112 });
  });
});
