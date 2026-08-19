import { describe, expect, it } from "vitest";
import { composeBlueprint, pickFlorals } from "../shared/composition";
import { compileEcr } from "../shared/rendering";
import { applyEcrPatch, buildEcrPackage } from "../shared/ecrpkg";

describe("ECR package primitives", () => {
  it("applies a patch only to the exact scene hash", () => {
    const recipe = pickFlorals([{ itemId: "x", name: "Rose", structuralRole: "focal", emotionTags: ["nostalgia"], status: "active", approved: true }], { primary: "nostalgia", secondary: [], palette: ["ivory"], formula: "Crescent", silenceArc: [45, 135] }, 42);
    const blueprint = composeBlueprint(recipe.recipe, { primary: "nostalgia", secondary: [], palette: ["ivory"], formula: "Crescent", silenceArc: [45, 135] }, 42);
    const scene = compileEcr(blueprint);
    const first = scene.objects[0];
    expect(first).toBeDefined();
    const patched = applyEcrPatch(scene, { patchVersion: "1.0", targetEcrHash: scene.blueprintHash, override: [{ target: { id: first!.id }, changes: { rotation: { from: first!.rotation, to: 28 } } }] });
    expect(patched.objects[0]?.rotation).toBe(28);
    expect(() => applyEcrPatch(scene, { patchVersion: "1.0", targetEcrHash: "stale", override: [] })).toThrow();
  });

  it("pins both manifest and floral canon versions", () => {
    const recipe = pickFlorals([], { primary: "nostalgia", secondary: [], palette: ["ivory"], formula: "Crescent", silenceArc: [45, 135] }, 42);
    const scene = compileEcr(composeBlueprint(recipe.recipe, { primary: "nostalgia", secondary: [], palette: ["ivory"], formula: "Crescent", silenceArc: [45, 135] }, 42));
    const pack = buildEcrPackage(scene, [], "blueprint_1");
    expect(pack.files["dependencies.lock"].dependencies.floralCanonVersion).toBe("2026.08");
    expect(pack.files["dependencies.lock"].dependencies.assetManifestVersion).toBe("2026.08");
  });
});
