import { composeBlueprint, type EmotionalBrief, type FloralItem, type BlueprintObject } from "./composition";

export type GuidedRecipeSelection = {
  role: string;
  itemId: string;
  name: string;
  reason: string;
  clientSelected: boolean;
};

export type LockedBlueprintRecipe = ReturnType<typeof composeBlueprint> extends never ? never : {
  focal: Array<FloralItem & { tier: "A" | "B" | "C"; estimatedPieces: number; selectionReason: string }>;
  secondary: Array<FloralItem & { tier: "A" | "B" | "C"; estimatedPieces: number; selectionReason: string }>;
  filler: Array<FloralItem & { tier: "A" | "B" | "C"; estimatedPieces: number; selectionReason: string }>;
  greenery: Array<FloralItem & { tier: "A" | "B" | "C"; estimatedPieces: number; selectionReason: string }>;
};

const roleMap: Record<string, keyof LockedBlueprintRecipe> = {
  focal: "focal",
  secondary: "secondary",
  bridge: "secondary",
  filler: "filler",
  greenery: "greenery",
  movement: "greenery",
};

export function buildLockedBlueprintRecipe(items: FloralItem[], selections: GuidedRecipeSelection[]): LockedBlueprintRecipe {
  const byId = new Map(items.map((item) => [item.itemId, item]));
  const recipe: LockedBlueprintRecipe = { focal: [], secondary: [], filler: [], greenery: [] };
  selections.filter((selection) => selection.clientSelected).forEach((selection) => {
    const item = byId.get(selection.itemId);
    const mappedRole = roleMap[selection.role];
    if (!item || !mappedRole) return;
    recipe[mappedRole].push({ ...item, tier: "B", estimatedPieces: 1, selectionReason: selection.reason });
  });
  return recipe;
}

export function validateLockedBlueprintRecipe(recipe: LockedBlueprintRecipe) {
  const missingRoles = (Object.keys(recipe) as Array<keyof LockedBlueprintRecipe>).filter((role) => recipe[role].length === 0);
  return { complete: missingRoles.length === 0, missingRoles };
}

export function buildGuidedBlueprint(recipe: LockedBlueprintRecipe, brief: EmotionalBrief, seed: number, sizeIn: number) {
  return composeBlueprint(recipe, brief, seed, sizeIn);
}

export type GuidedBlueprint = ReturnType<typeof buildGuidedBlueprint>;
export type GuidedBlueprintPlacement = BlueprintObject;
