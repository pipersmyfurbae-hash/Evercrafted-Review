import { describe, expect, it } from "vitest";
import { buildPrintableBuildSheet, buildSheetFilename } from "../shared/buildsheet";
import { composeBlueprint, pickFlorals } from "../shared/composition";

describe("printable build sheet", () => {
  it("contains deterministic placement, silence, ring, and cluster instructions", () => {
    const items = [{ itemId: "rose", name: "Ivory Rose", colorFamily: "ivory", structuralRole: "focal", emotionTags: ["nostalgia"], status: "active", approved: true }];
    const brief = { primary: "nostalgia", secondary: ["calm"], palette: ["ivory"], formula: "Crescent" as const, silenceArc: [45, 135] as [number, number] };
    const blueprint = composeBlueprint(pickFlorals(items, brief, 42).recipe, brief, 42);
    const html = buildPrintableBuildSheet({ blueprint, items });
    expect(html).toContain("Protect the silence arc from 45° to 135°");
    expect(html).toContain("Ring bands");
    expect(html).toContain("Placement schedule");
    expect(html).toContain("Ivory Rose");
    expect(buildSheetFilename(42)).toBe("evercrafted-build-sheet-42.html");
  });
});
