import { describe, expect, it } from "vitest";
import { buildLookbookPdfTitle, buildLookbookSharePath, lookbookFlowStages } from "../shared/lookbookFlow";

describe("lookbook production flow", () => {
  it("keeps the editorial stages in creation order", () => {
    expect(lookbookFlowStages.map((stage) => stage.key)).toEqual([
      "setup",
      "story",
      "florals",
      "anchor",
      "wreathPrompt",
      "scenes",
      "gallery",
      "lookbook",
    ]);
  });

  it("maps every stage to a navigable workspace surface", () => {
    expect(lookbookFlowStages.every((stage) => stage.tab.length > 0 && stage.detail.length > 0)).toBe(true);
  });

  it("builds a tokenized public share path", () => {
    expect(buildLookbookSharePath("abc123token456789")).toBe("/lookbook/share/abc123token456789");
  });

  it("builds a stable PDF document title", () => {
    expect(buildLookbookPdfTitle("The lake house in July")).toBe("The lake house in July — Evercrafted Lookbook");
  });
});
