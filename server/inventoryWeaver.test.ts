import { describe, expect, it } from "vitest";
import { curateInventoryCandidates, type WeaverRole } from "../shared/inventoryWeaver";
import type { FloralItem } from "../shared/composition";

describe("Inventory Weaver guided candidate contract", () => {
  const brief = { primary: "belonging", secondary: ["calm"], palette: ["ivory", "sage"], formula: "Crescent" as const, silenceArc: [45, 135] as [number, number] };
  const items: FloralItem[] = [
    { itemId: "rose-1", name: "Ivory Rose", colorHex: "#F1E8D5", colorFamily: "ivory", structuralRole: "focal", emotionTags: ["belonging"], status: "active", approved: true, stemLengthIn: 18 },
    { itemId: "rose-2", name: "Sage Rose", colorHex: "#57745D", colorFamily: "sage", structuralRole: "focal", emotionTags: ["calm"], status: "active", approved: true, stemLengthIn: 18 },
    { itemId: "fern-1", name: "Trailing Fern", colorHex: "#57745D", colorFamily: "sage", structuralRole: "greenery", emotionTags: ["calm"], status: "active", approved: true, stemLengthIn: 30 },
  ];

  it("returns role-specific recommendations with explainable reasons", () => {
    const result = curateInventoryCandidates(items, brief, {}, 6);
    expect(result.focal).toHaveLength(2);
    expect(result.focal.some((candidate) => candidate.recommended)).toBe(true);
    expect(result.focal[0]?.selectionReason).toContain("emotion match");
    expect(result.focal[0]?.matchFactors.roleMatch).toBe(true);
  });

  it("removes a selected item from other role recommendations while preserving the selected role", () => {
    const selections: Partial<Record<WeaverRole, string[]>> = { greenery: ["fern-1"] };
    const result = curateInventoryCandidates(items, brief, selections, 6);
    expect(result.greenery.map((candidate) => candidate.itemId)).toContain("fern-1");
    expect(result.movement.map((candidate) => candidate.itemId)).not.toContain("fern-1");
  });
});
