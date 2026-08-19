import { describe, expect, it } from "vitest";
import { applyEmotionalOverrides, buildCompositionBrief, deriveCompositionFormula, deriveRingBands, validateEmotionalProfile } from "../shared/emotionalDesign";
import { pickFlorals, composeBlueprint } from "../shared/composition";
import { compileMidjourneyPrompt } from "../shared/rendering";

const validProfile = {
  emotionalCore: { primaryEmotion: "belonging", secondaryEmotions: ["nostalgia", "calm"], emotionalTemperature: "warm", emotionalWeight: "grounded", emotionalPacing: "slow", emotionalTension: "suspended" },
  paletteSystem: { dominantColor: { hex: "#7A3343", name: "berry dusk" }, supportingColors: [{ hex: "#57745D", name: "quiet sage" }, { hex: "#F1E8D5", name: "aged ivory" }], accentColor: { hex: "#B78950", name: "candlelit amber" }, negativeSpaceColor: { hex: "#E8E1D5", name: "silence" }, colorTemperature: "warm", colorSaturation: "muted" },
  textureMaterial: { primaryTexture: "worn linen", secondaryTextures: ["soft bark", "aged petal"], materialWeight: "medium", surfaceQuality: "worn", organicVsStructured: 7 },
  movementEnergy: { movementArchetype: ["Cascade", "Taper Fade"], directionalEnergy: "falls left and softens at the edge", tensionType: "suspended", rhythmQuality: "sparse" },
  densitySpace: { overallDensity: "balanced", focalDensity: "lower-left focal", negativeSpaceRole: "structural silence", layeringDepth: "deep" },
  asymmetryComposition: { asymmetryType: "weighted asymmetry", dominantQuadrant: "bottom-left", secondaryPull: "toward the upper right", silenceZone: "upper-right arc" },
  lightQuality: { lightCharacter: "diffused late afternoon", shadowBehavior: "soft", luminosity: "balanced" },
  atmosphere: { atmosphereArchetype: "Garden Memory", sensoryAnchors: ["cool rail beneath the palm", "dried leaves underfoot"], timeOfDayFeeling: "afternoon", seasonalResonance: "transitional" },
  wreathTranslation: { compositionFormula: "Crescent", ringBands: [{ name: "A", role: "emotional anchor", radius: [0, 0.25] }, { name: "B", role: "supporting body", radius: [0.25, 0.5] }, { name: "C", role: "movement and texture", radius: [0.5, 0.75] }, { name: "D", role: "whisper zone", radius: [0.75, 1] }], silenceArc: [45, 135], clusterBehavior: ["focal cluster carries belonging", "supporting clusters carry nostalgia"], seasonalDriftTags: ["transitional", "warmth"], blueprintEmotionTags: ["nostalgic", "grounded", "ceremonial"], sourcingNotes: ["prefer approved inventory with verified provenance"] },
  provenance: { modelVersion: "eip-v1", schemaVersion: "eip-v1", generatedAt: Date.now(), overrides: {} },
};

describe("Emotional Design Translator", () => {
  it("validates a complete profile and preserves canonical structure", () => {
    const parsed = validateEmotionalProfile(validProfile);
    expect(parsed.atmosphere.atmosphereArchetype).toBe("Garden Memory");
    expect(parsed.wreathTranslation.ringBands).toHaveLength(4);
  });

  it("rejects incomplete profiles", () => {
    expect(() => validateEmotionalProfile({ ...validProfile, lightQuality: undefined })).toThrow();
  });

  it("applies bounded overrides to actual profile fields", () => {
    const revised = applyEmotionalOverrides(validProfile, { primaryEmotion: "inheritance", atmosphereArchetype: "Inherited Beauty", compositionFormula: "Corner Cluster", silenceArc: [90, 180] });
    expect(revised.emotionalCore.primaryEmotion).toBe("inheritance");
    expect(revised.atmosphere.atmosphereArchetype).toBe("Inherited Beauty");
    expect(revised.wreathTranslation.compositionFormula).toBe("Corner Cluster");
    expect(revised.wreathTranslation.silenceArc).toEqual([90, 180]);
  });

  it("rejects unsupported override fields", () => {
    expect(() => applyEmotionalOverrides(validProfile, { unknownField: "nope" } as never)).toThrow();
  });

  it("marks the empty Workspace brief as non-authoritative", () => {
    expect(buildCompositionBrief().authoritative).toBe(false);
    expect(buildCompositionBrief().primary).toBe("nostalgia");
  });

  it("uses the approved profile in the Workspace composition brief", () => {
    const brief = buildCompositionBrief(validProfile);
    expect(brief.authoritative).toBe(true);
    expect(brief.primary).toBe("belonging");
    expect(brief.silenceArc).toEqual([45, 135]);
  });

  it("traverses the approved profile through florals, blueprint, and prompt inputs", () => {
    const brief = buildCompositionBrief(validProfile);
    const items = [
      { itemId: "stem-1", name: "Ivory Rose", colorHex: "#F1E8D5", colorFamily: "ivory", structuralRole: "focal", emotionTags: ["belonging"], status: "active", approved: true, stemLengthIn: 18 },
      { itemId: "stem-2", name: "Ruscus", colorHex: "#57745D", colorFamily: "green", structuralRole: "greenery", emotionTags: ["grounded"], status: "active", approved: true, stemLengthIn: 16 },
      { itemId: "stem-3", name: "Berry Spray", colorHex: "#7A3343", colorFamily: "berry", structuralRole: "filler", emotionTags: ["nostalgic"], status: "active", approved: true, stemLengthIn: 14 },
    ];
    const recipe = pickFlorals(items, brief, 42);
    const blueprint = composeBlueprint(recipe.recipe, brief, 42, 24);
    const prompts = compileMidjourneyPrompt(blueprint, Object.fromEntries(items.map((item) => [item.itemId, item.name])));
    expect(brief.authoritative).toBe(true);
    expect(recipe.recipe).toBeDefined();
    expect(blueprint.objects.length).toBeGreaterThan(0);
    expect(prompts.humanFacing).toContain("24-inch");
    expect(prompts.machineFacing).toContain("belonging");
  });

  it("derives formula and ring bands deterministically", () => {
    expect(deriveCompositionFormula(validProfile)).toBe("Crescent");
    expect(deriveRingBands(validProfile)[0]).toMatchObject({ name: "A", radius: [0, 0.25] });
    expect(deriveRingBands(validProfile)).toHaveLength(4);
  });
});
