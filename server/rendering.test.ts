import { describe, expect, it } from "vitest";
import { compileEcr, compileMidjourneyPrompt } from "../shared/rendering";

const blueprint = { sizeIn: 24, seed: 42, formula: "Crescent", silenceArc: [45, 135] as [number, number], emotion: "nostalgia", objects: [{ id: "stem_001", asset: "TP-23109BS", layer: "focal", theta: 180, radius: .78, scale: 1.08, rotation: 0, depth: 4, composition: { compositionFunction: "anchor" as const, visualMass: .86, emotionalWeight: .92, attentionPriority: 1 } }] };

describe("render adapters", () => {
  it("compiles byte-stable scene geometry for the same blueprint", () => {
    expect(compileEcr(blueprint)).toEqual(compileEcr(blueprint));
    expect(compileEcr(blueprint).objects[0]?.bend).toBeNull();
    expect(compileEcr(blueprint).dependencies.floralCanonVersion).toBe("2026.08");
  });

  it("produces a wreath-only prompt from the approved floral name", () => {
    const result = compileMidjourneyPrompt(blueprint, { "TP-23109BS": "Berry Spray" });
    expect(result.machineFacing).toContain("[STYLE_DNA]");
    expect(result.humanFacing).toContain("Berry Spray");
    expect(result.humanFacing).toContain("--no fresh flowers");
    expect(result.humanFacing).not.toContain("dew on petals");
    expect(result.humanFacing).not.toContain("Lifestyle scene");
    expect(result.humanFacing).not.toContain("lake-house threshold");
  });
});
