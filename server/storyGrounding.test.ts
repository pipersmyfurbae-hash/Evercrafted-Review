import { describe, expect, it } from "vitest";
import { validateStoryGrounding } from "../shared/storyGrounding";

const clean = { sourceDetails: ["A doorway after the last guest leaves."], interpretations: ["The memory carries a quiet return."], unsupportedClaims: [], majorUnsupportedClaims: [], approvalEligible: true };

describe("source-grounded Story Genesis", () => {
  it("keeps a grounded story eligible for approval", () => {
    const result = validateStoryGrounding(clean, "A doorway after the last guest leaves.", [{ setting: "The remembered doorway", prompt: "A quiet threshold" }], "A doorway after the last guest leaves.");
    expect(result.approvalEligible).toBe(true);
    expect(result.majorUnsupportedClaims).toHaveLength(0);
  });

  it("flags invented biographical events not present in memory", () => {
    const result = validateStoryGrounding(clean, "They return one year later after their grandmother died.", [], "A doorway after the last guest leaves.");
    expect(result.approvalEligible).toBe(false);
    expect(result.unsupportedClaims.join(" ")).toContain("one year");
    expect(result.unsupportedClaims.join(" ")).toContain("grandmother");
  });

  it("blocks floral and Blueprint implementation leakage", () => {
    const result = validateStoryGrounding(clean, "The focal greenery moves into a clock position on the wreath Blueprint.", [], "A doorway after the last guest leaves.");
    expect(result.approvalEligible).toBe(false);
    expect(result.majorUnsupportedClaims[0]).toContain("implementation instructions");
  });
});
