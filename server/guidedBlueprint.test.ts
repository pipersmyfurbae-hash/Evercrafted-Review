import { describe, expect, it } from "vitest";
import { buildGuidedBlueprint, buildLockedBlueprintRecipe, validateLockedBlueprintRecipe } from "../shared/guidedBlueprint";
import type { FloralItem } from "../shared/composition";

const items: FloralItem[] = [
  { itemId: "focal-a", name: "Ivory Rose", colorFamily: "ivory", structuralRole: "focal", emotionTags: ["tender"], status: "active", approved: true },
  { itemId: "focal-b", name: "Blush Rose", colorFamily: "blush", structuralRole: "focal", emotionTags: ["tender"], status: "active", approved: true },
  { itemId: "secondary-a", name: "Wisteria", colorFamily: "lavender", structuralRole: "secondary", emotionTags: ["nostalgia"], status: "active", approved: true },
  { itemId: "secondary-b", name: "Fern Bloom", colorFamily: "green", structuralRole: "secondary", emotionTags: ["quiet"], status: "active", approved: true },
  { itemId: "bridge-a", name: "Soft Thistle", colorFamily: "lavender", structuralRole: "bridge", emotionTags: ["quiet"], status: "active", approved: true },
  { itemId: "filler-a", name: "Berry Spray", colorFamily: "burgundy", structuralRole: "filler", emotionTags: ["warm"], status: "active", approved: true },
  { itemId: "greenery-a", name: "Ruscus", colorFamily: "green", structuralRole: "greenery", emotionTags: ["structured"], status: "active", approved: true },
  { itemId: "movement-a", name: "Trailing Vine", colorFamily: "green", structuralRole: "movement", emotionTags: ["open"], status: "active", approved: true },
];

const selections = items.map((item) => ({ role: item.structuralRole ?? "", itemId: item.itemId, name: item.name, reason: `${item.name} supports the approved emotional direction.`, clientSelected: true }));

const brief = { primary: "tender", secondary: ["nostalgia"], palette: ["ivory", "lavender", "green"], formula: "Crescent" as const, silenceArc: [120, 180] as [number, number] };

describe("guided Blueprint composition", () => {
  it("maps locked Guided selections into the Blueprint without reselecting inventory", () => {
    const recipe = buildLockedBlueprintRecipe(items, selections);
    expect(recipe.focal.map((item) => item.itemId)).toEqual(["focal-a", "focal-b"]);
    expect(recipe.secondary.map((item) => item.itemId)).toEqual(["secondary-a", "secondary-b", "bridge-a"]);
    expect(recipe.greenery.map((item) => item.itemId)).toEqual(["greenery-a", "movement-a"]);
    expect(validateLockedBlueprintRecipe(recipe)).toEqual({ complete: true, missingRoles: [] });
    const blueprint = buildGuidedBlueprint(recipe, brief, 42, 24);
    expect(blueprint.sizeIn).toBe(24);
    expect(blueprint.placementMap.map((placement) => placement.asset)).toEqual([
      "focal-a", "focal-b", "secondary-a", "secondary-b", "bridge-a", "filler-a", "greenery-a", "movement-a",
    ]);
  });

  it("does not invent a missing composition layer", () => {
    const recipe = buildLockedBlueprintRecipe(items.filter((item) => item.structuralRole !== "greenery" && item.structuralRole !== "movement"), selections.filter((selection) => selection.role !== "greenery" && selection.role !== "movement"));
    expect(validateLockedBlueprintRecipe(recipe)).toEqual({ complete: false, missingRoles: ["greenery"] });
  });
});
