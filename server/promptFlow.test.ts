import { describe, expect, it } from "vitest";
import { buildLifestyleRenderHandoff, buildLifestyleScenePrompts, getAnchorHandoffState, getApprovedFlorals, mergeDecisionFallbackItems, resolveAnchorTransfer, resolveSceneAnchorPrompt } from "../shared/promptFlow";
import { hasFullStudioAccess } from "../shared/workspaceGuards";

const items = [
  { itemId: "approved-rose", name: "Ivory Rose", colorFamily: "ivory", structuralRole: "focal", emotionTags: [], status: "active", approved: true },
  { itemId: "rejected-berry", name: "Berry Spray", colorFamily: "burgundy", structuralRole: "filler", emotionTags: [], status: "active", approved: true },
] as const;

describe("approved floral prompt handoff", () => {
  it("passes accepted florals only into the wreath anchor source", () => {
    const approved = getApprovedFlorals(items, { "approved-rose": "accepted", "rejected-berry": "rejected" });
    expect(approved.map((item) => item.name)).toEqual(["Ivory Rose"]);
  });

  it("reports blocked, ready, and locked states for the floral-to-anchor handoff", () => {
    expect(getAnchorHandoffState(0, false)).toBe("blocked");
    expect(getAnchorHandoffState(2, false)).toBe("ready");
    expect(getAnchorHandoffState(2, true)).toBe("locked");
  });

  it("preserves persisted accepted fallback cards when the live catalog changes", () => {
    const catalog = [{ itemId: "live-item" }];
    const fallback = [{ itemId: "accepted-fallback" }, { itemId: "unselected-fallback" }];
    expect(mergeDecisionFallbackItems(catalog, fallback, ["accepted-fallback"]).map((item) => item.itemId)).toEqual(["live-item", "accepted-fallback"]);
  });

  it("recognizes full studio access from admin identity or studio capability", () => {
    expect(hasFullStudioAccess("admin", false)).toBe(true);
    expect(hasFullStudioAccess("user", true)).toBe(true);
    expect(hasFullStudioAccess("user", false)).toBe(false);
  });

  it("uses persisted approved-wreath provenance when the in-memory anchor prompt is unavailable", () => {
    expect(resolveSceneAnchorPrompt(null, { prompt: "STORED_APPROVED_WREATH_ANCHOR" })).toBe("STORED_APPROVED_WREATH_ANCHOR");
    expect(resolveSceneAnchorPrompt("CURRENT_WREATH_ANCHOR", { prompt: "STORED_APPROVED_WREATH_ANCHOR" })).toBe("CURRENT_WREATH_ANCHOR");
  });

  it("makes the transfer click advance and lock only when a project and approved florals exist", () => {
    expect(resolveAnchorTransfer(2, true)).toEqual({ canTransfer: true, nextTab: "blueprint", locked: true });
    expect(resolveAnchorTransfer(0, true)).toEqual({ canTransfer: false, nextTab: "selection", locked: false });
    expect(resolveAnchorTransfer(2, false)).toEqual({ canTransfer: false, nextTab: "selection", locked: false });
  });

  it("maps persisted Story Genesis beats into lifestyle prompts while inheriting the wreath anchor", async () => {
    const prompts = buildLifestyleScenePrompts("WREATH_ONLY_PROMPT", [{ name: "The blue hour", role: "threshold", setting: "The lake-facing room", camera: "35mm wide", light: "last blue light", prompt: "Place the wreath above the old rail." }, { name: "After the gathering", role: "intimate", setting: "A quiet kitchen", camera: "50mm close", light: "warm practicals", prompt: "Keep the scene spare." }, { name: "The return", role: "after", setting: "The entry at dusk", camera: "wide editorial", light: "dusk", prompt: "Leave breathing room." }]);
    expect(prompts.map((prompt) => prompt.title)).toEqual(["The blue hour", "After the gathering", "The return"]);
    expect(prompts[0]).toMatchObject({ context: "threshold", body: "The lake-facing room", placement: "35mm wide · last blue light" });
    expect(prompts[0]?.prompt).toBe("Place the wreath above the old rail.");
    expect(prompts[0]?.body).toBe("The lake-facing room");
    expect(prompts[0]?.placement).toContain("35mm wide");
    expect(prompts[0]?.placement).toContain("last blue light");
    expect(prompts[0]?.prompt).toContain("Place the wreath above the old rail.");
    expect(prompts[0]?.prompt).not.toBe(prompts[1]?.prompt);
    expect(prompts[1]?.prompt).toBe("Keep the scene spare.");
  });

  it("preserves every Story Genesis beat for the Lifestyle Scenes handoff", () => {
    const beats = Array.from({ length: 7 }, (_, index) => ({ name: `Beat ${index + 1}`, role: "narrative", setting: `Setting ${index + 1}`, camera: "35mm", light: "soft light", prompt: `Story direction ${index + 1}` }));
    const prompts = buildLifestyleScenePrompts("WREATH_ONLY_PROMPT", beats);
    expect(prompts).toHaveLength(7);
    expect(prompts.map((prompt) => prompt.title)).toEqual(beats.map((beat) => beat.name));
    expect(new Set(prompts.map((prompt) => prompt.prompt)).size).toBe(7);
  });

  it("uses the exact displayed lifestyle prompt for the beat-indexed render handoff", () => {
    const scene = { number: "07", title: "The return", context: "after", body: "The entry at dusk", placement: "wide editorial · dusk", prompt: "The exact displayed lifestyle prompt." };
    expect(buildLifestyleRenderHandoff(scene, 6)).toEqual({ prompt: scene.prompt, sceneIndex: 6, sceneTitle: "The return" });
  });

  it("keeps lifestyle prompts separate while inheriting the wreath anchor", () => {
    const prompts = buildLifestyleScenePrompts("WREATH_ONLY_PROMPT");
    expect(prompts).toHaveLength(3);
    expect(prompts[0]?.prompt).toContain("WREATH_ONLY_PROMPT");
    expect(prompts[0]?.prompt).toContain("Setting and action:");
    expect(prompts[0]?.prompt).toContain("Camera:");
    expect(prompts[0]?.prompt).toContain("Light and atmosphere:");
    expect(prompts[0]?.prompt).toContain("Photorealistic editorial lifestyle photography");
    expect(prompts[0]?.prompt).not.toBe("WREATH_ONLY_PROMPT");
    expect(new Set(prompts.map((prompt) => prompt.prompt)).size).toBe(3);
  });
});
