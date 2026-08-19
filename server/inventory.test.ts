import { describe, expect, it } from "vitest";
import { canonicalStructuralRole, mapEvsFisa } from "../shared/inventory";

describe("EVS-FISA inventory mapper", () => {
  it("profiles greenery as a supporting spatial system", () => {
    const profile = mapEvsFisa({ item_id: "green-1", source_sku: "G-1", structural_roles: ["greenery"], color_family: "sage", stem_length_in: 30, evs_emotion_tags: ["grounded", "calm"] });
    expect(profile.classification).toBe("GREENERY");
    expect(profile.spatial.preferredRole).toBe("greenery");
    expect(profile.pairing.companions).toContain("focal");
    expect(profile.provenance.mapperVersion).toBe("EVS-FISA-1.1");
  });

  it("normalizes singular greenery role and classification fields", () => {
    expect(canonicalStructuralRole({ structural_role: "foliage" })).toBe("greenery");
    expect(canonicalStructuralRole({ classification: "GREENERY", color_family: "unknown" })).toBe("greenery");
    expect(canonicalStructuralRole({ structural_roles: ["focal"], color_family: "ivory" })).toBe("focal");
  });

  it("falls back to an explainable emotional tag when source tags are absent", () => {
    const profile = mapEvsFisa({ item_id: "stem-1", color_family: "ivory", form_factor: "stem" });
    expect(profile.classification).toBe("INDIVIDUAL_STEM");
    expect(profile.emotion.tags.length).toBeGreaterThan(0);
    expect(profile.provenance.sourceSku).toBe("stem-1");
  });
});
