import { describe, expect, it } from "vitest";
import { composeBlueprint, pickFlorals, type FloralItem } from "../shared/composition";

const items: FloralItem[] = [
  { itemId: "focal-1", name: "Ivory Rose", colorFamily: "ivory", structuralRole: "focal", emotionTags: ["resolution", "soft"], status: "active", approved: true },
  { itemId: "focal-2", name: "Burgundy Dahlia", colorFamily: "burgundy", structuralRole: "focal", emotionTags: ["warmth"], status: "active", approved: true },
  { itemId: "secondary-1", name: "Ruscus Bush", colorFamily: "green", structuralRole: "greenery", emotionTags: ["structured"], status: "active", approved: true },
  { itemId: "secondary-2", name: "Wisteria Pick", colorFamily: "lavender", structuralRole: "secondary", emotionTags: ["nostalgia"], status: "active", approved: true },
  { itemId: "filler-1", name: "Berry Spray", colorFamily: "burgundy", structuralRole: "filler", emotionTags: ["warmth"], status: "active", approved: true },
  { itemId: "filler-2", name: "Sage Leaf", colorFamily: "sage", structuralRole: "filler", emotionTags: ["calm"], status: "active", approved: true },
  { itemId: "greenery-1", name: "Olive Branch", colorFamily: "green", structuralRole: "greenery", emotionTags: ["grounded"], status: "active", approved: true },
];

const brief = { primary: "nostalgia", secondary: ["warmth", "calm"], palette: ["burgundy", "sage", "ivory"], formula: "Crescent" as const, silenceArc: [45, 135] as [number, number] };

describe("composition primitives", () => {
  it("returns byte-stable selections for the same seed", () => {
    expect(pickFlorals(items, brief, 42)).toEqual(pickFlorals(items, brief, 42));
    expect(pickFlorals(items, brief, 42).seed).toBe(42);
  });

  it("changes the selected recipe when the seed changes", () => {
    expect(JSON.stringify(pickFlorals(items, brief, 42).recipe)).not.toBe(JSON.stringify(pickFlorals(items, brief, 43).recipe));
  });

  it("keeps greenery items in the greenery role instead of consuming them as secondary stems", () => {
    const result = pickFlorals(items, brief, 42).recipe;
    expect(result.greenery.length).toBeGreaterThan(0);
    expect(result.greenery.every((item) => item.structuralRole === "greenery" || /green|olive|sage|foliage/i.test(`${item.colorFamily ?? ""} ${item.name}`))).toBe(true);
    expect(result.secondary.some((item) => item.itemId === "secondary-1")).toBe(false);
  });

  it("reports an empty greenery role when the inventory contains no greenery evidence", () => {
    const result = pickFlorals(items.filter((item) => !["secondary-1", "greenery-1", "filler-2"].includes(item.itemId)), brief, 42).recipe;
    expect(result.greenery).toHaveLength(0);
  });

  it("compiles objects into clock positions and preserves the silence arc", () => {
    const recipe = pickFlorals(items, brief, 42).recipe;
    const blueprint = composeBlueprint(recipe, brief, 42);
    expect(blueprint.schema).toBe("EC_WR_V2");
    expect(blueprint.validation.deterministic).toBe(true);
    expect(blueprint.silenceArc).toEqual([45, 135]);
    expect(blueprint.objects.every((object) => object.theta >= 0 && object.theta < 360)).toBe(true);
    expect(blueprint.objects.every((object) => object.radius > 0 && object.radius <= 1)).toBe(true);
  });
});
