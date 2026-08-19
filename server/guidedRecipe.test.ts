import { describe, expect, it } from "vitest";
import { GUIDED_ROLE_COUNTS, GUIDED_WREATH_SIZES, isGuidedRecipeComplete } from "../shared/guidedRecipe";

describe("guided floral recipe contract", () => {
  it("offers the confirmed wreath sizes", () => {
    expect(GUIDED_WREATH_SIZES).toEqual([18, 24, 30]);
  });

  it("requires every role before a recipe can be locked", () => {
    expect(isGuidedRecipeComplete({ focal: ["f1", "f2"], secondary: ["s1", "s2"], bridge: ["b1"], filler: ["t1"], greenery: ["g1"], movement: [] })).toBe(false);
    expect(isGuidedRecipeComplete({ focal: ["f1", "f2"], secondary: ["s1", "s2"], bridge: ["b1"], filler: ["t1"], greenery: ["g1"], movement: ["m1"] })).toBe(true);
    expect(GUIDED_ROLE_COUNTS.focal).toBe(2);
    expect(GUIDED_ROLE_COUNTS.movement).toBe(1);
  });
});
