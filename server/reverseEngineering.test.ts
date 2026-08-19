import { describe, expect, it } from "vitest";
import { sanitizeReverseEngineering, type ReverseEngineeringAnalysis } from "../shared/reverseEngineering";

describe("reverse engineering safeguards", () => {
  it("keeps uncertain floral matches unresolved instead of inventing SKUs", () => {
    const analysis: ReverseEngineeringAnalysis = {
      form: { shape: "crescent", sizeIn: 24, symmetry: "asymmetric", density: "medium" },
      palette: { dominant: "sage", secondary: "cream", accent: "burgundy", ratio: "60-30-10" },
      emotionProfile: { primary: "nostalgia", secondary: "serenity" },
      season: "evergreen",
      style: "romantic",
      confidenceOverall: "medium",
      flags: [],
      florals: [{ role: "focal", identifiedAs: "garden rose", confidence: "medium", color: "cream", estimatedStemCount: 4.4, placementZones: ["2-o-clock"], skuMatch: "guessed-sku", skuNeeded: false, flag: null }],
      stemCountTotal: 4.4,
      clusterCount: 0,
      notes: "overlap",
    };
    const safe = sanitizeReverseEngineering(analysis);
    expect(safe.florals[0]?.skuMatch).toBeNull();
    expect(safe.florals[0]?.skuNeeded).toBe(true);
    expect(safe.stemCountTotal).toBe(4);
    expect(safe.clusterCount).toBe(1);
    expect(safe.flags).toContain("SKU matches require operator confirmation against approved inventory.");
  });
});
