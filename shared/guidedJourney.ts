export const GUIDED_STAGES = [
  "memory",
  "essence",
  "story",
  "florals",
  "recipe",
  "blueprint",
  "wreath",
  "outcome",
] as const;

export type GuidedStageKey = (typeof GUIDED_STAGES)[number];

export type GuidedStageInput = {
  hasMemory: boolean;
  essenceApproved: boolean;
  storyApproved: boolean;
  recipeLocked: boolean;
  blueprintApproved: boolean;
  wreathReady: boolean;
};

export type GuidedStageState = {
  key: GuidedStageKey;
  available: boolean;
  complete: boolean;
  blockedReason: string | null;
  nextAction: string;
};

export const GUIDED_STAGE_LABELS: Record<GuidedStageKey, string> = {
  memory: "Memory",
  essence: "Essence",
  story: "Story",
  florals: "Florals",
  recipe: "Recipe",
  blueprint: "Blueprint",
  wreath: "Wreath",
  outcome: "Outcome",
};

export function resolveGuidedStages(input: GuidedStageInput): GuidedStageState[] {
  const states: GuidedStageState[] = [
    { key: "memory", available: true, complete: input.hasMemory, blockedReason: null, nextAction: input.hasMemory ? "Review your saved memory" : "Share your memory" },
    { key: "essence", available: input.hasMemory, complete: input.essenceApproved, blockedReason: input.hasMemory ? null : "Share a memory first", nextAction: input.essenceApproved ? "Essence approved" : "Review Your Essence" },
    { key: "story", available: input.essenceApproved, complete: input.storyApproved, blockedReason: input.essenceApproved ? null : "Approve Your Essence first", nextAction: input.storyApproved ? "Story approved" : "Review and approve Story Genesis" },
    { key: "florals", available: input.storyApproved, complete: input.storyApproved && input.recipeLocked, blockedReason: input.storyApproved ? null : "Approve Story Genesis first", nextAction: input.storyApproved && input.recipeLocked ? "Recipe locked" : "Choose the florals that feel true" },
    { key: "recipe", available: input.storyApproved, complete: input.storyApproved && input.recipeLocked, blockedReason: input.storyApproved ? null : "Approve Story Genesis first", nextAction: input.storyApproved && input.recipeLocked ? "Recipe locked" : "Complete and lock your recipe" },
    { key: "blueprint", available: input.storyApproved && input.recipeLocked, complete: input.storyApproved && input.recipeLocked && input.blueprintApproved, blockedReason: input.storyApproved ? (input.recipeLocked ? null : "Lock the Floral Recipe first") : "Approve Story Genesis first", nextAction: input.storyApproved && input.recipeLocked && input.blueprintApproved ? "Blueprint approved" : "Review the wreath structure" },
    { key: "wreath", available: input.storyApproved && input.recipeLocked && input.blueprintApproved, complete: input.storyApproved && input.recipeLocked && input.blueprintApproved && input.wreathReady, blockedReason: input.storyApproved ? (input.recipeLocked ? (input.blueprintApproved ? null : "Approve the Blueprint first") : "Lock the Floral Recipe first") : "Approve Story Genesis first", nextAction: input.storyApproved && input.recipeLocked && input.blueprintApproved && input.wreathReady ? "Render ready" : "Render your approved wreath" },
    { key: "outcome", available: input.storyApproved && input.recipeLocked && input.blueprintApproved && input.wreathReady, complete: false, blockedReason: input.storyApproved && input.recipeLocked && input.blueprintApproved && input.wreathReady ? null : "Create or upload a wreath render first", nextAction: "Choose what happens next" },
  ];
  return states;
}

export function firstAvailableIncompleteStage(states: GuidedStageState[]): GuidedStageKey {
  return states.find((stage) => stage.available && !stage.complete)?.key ?? "outcome";
}
