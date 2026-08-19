export const GUIDED_WREATH_SIZES = [18, 24, 30] as const;
export type GuidedWreathSize = (typeof GUIDED_WREATH_SIZES)[number];

export const GUIDED_ROLE_COUNTS = {
  focal: 2,
  secondary: 2,
  bridge: 1,
  filler: 1,
  greenery: 1,
  movement: 1,
} as const;

export const GUIDED_ROLE_LABELS: Record<keyof typeof GUIDED_ROLE_COUNTS, string> = {
  focal: "focal florals",
  secondary: "supporting florals",
  bridge: "bridge floral",
  filler: "textural accent",
  greenery: "foundation greenery",
  movement: "movement greenery",
};

export const isGuidedRecipeComplete = (selections: Partial<Record<keyof typeof GUIDED_ROLE_COUNTS, string[]>>) =>
  (Object.entries(GUIDED_ROLE_COUNTS) as Array<[keyof typeof GUIDED_ROLE_COUNTS, number]>).every(([role, count]) => (selections[role] ?? []).length >= count);
