import { describe, expect, it } from "vitest";
import { workspacePageLegend } from "../shared/pageLegend";

describe("Workspace page legend", () => {
  it("contains the core studio destinations with unique links", () => {
    const hrefs = workspacePageLegend.map((entry) => entry.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(hrefs).toEqual(expect.arrayContaining([
      "/workspace",
      "/admin/inventory",
      "/signature-wreaths",
      "/collection-studio",
      "/photo-edits",
      "/lookbook",
    ]));
  });
});
