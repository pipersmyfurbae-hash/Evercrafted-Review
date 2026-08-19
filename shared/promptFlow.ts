import type { FloralItem } from "./composition";

export type FloralDecisionMap = Record<string, "pending" | "accepted" | "rejected">;

export function getApprovedFlorals(items: FloralItem[], decisions: FloralDecisionMap) {
  return items.filter((item) => decisions[item.itemId] === "accepted");
}

export function mergeDecisionFallbackItems<T extends { itemId: string }>(catalog: T[], fallbackItems: T[], persistedItemIds: string[]) {
  const catalogIds = new Set(catalog.map((item) => item.itemId));
  const persistedIds = new Set(persistedItemIds);
  return [...catalog, ...fallbackItems.filter((item) => persistedIds.has(item.itemId) && !catalogIds.has(item.itemId))];
}

export type AnchorHandoffState = "blocked" | "ready" | "locked";

export function getAnchorHandoffState(approvedFloralCount: number, anchorLocked: boolean): AnchorHandoffState {
  if (anchorLocked && approvedFloralCount > 0) return "locked";
  return approvedFloralCount > 0 ? "ready" : "blocked";
}

export function resolveAnchorTransfer(approvedFloralCount: number, hasActiveProject: boolean) {
  const canTransfer = hasActiveProject && approvedFloralCount > 0;
  return { canTransfer, nextTab: canTransfer ? "blueprint" : "selection", locked: canTransfer } as const;
}

export function resolveSceneAnchorPrompt(wreathPrompt: string | null, persistedProvenance: unknown): string | null {
  if (wreathPrompt) return wreathPrompt;
  if (persistedProvenance && typeof persistedProvenance === "object" && "prompt" in persistedProvenance && typeof (persistedProvenance as { prompt?: unknown }).prompt === "string") return (persistedProvenance as { prompt: string }).prompt;
  return null;
}

export type LifestylePrompt = {
  number: string;
  title: string;
  context: string;
  body: string;
  placement: string;
  prompt: string;
};

export function buildLifestyleRenderHandoff(scene: LifestylePrompt, sceneIndex: number) {
  return { prompt: scene.prompt, sceneIndex, sceneTitle: scene.title } as const;
}

export function buildLifestyleScenePrompts(wreathPrompt: string | null, storyBeats: Array<Record<string, unknown>> = []): LifestylePrompt[] {
  const anchor = wreathPrompt ?? "Approved wreath anchor unavailable; preserve the wreath silhouette and open negative-space arc once supplied.";
  const buildPrompt = (title: string, context: string, body: string, camera: string, light: string, beatPrompt: string) => [
    `Lifestyle scene: ${title}.`,
    `Narrative purpose: ${context}.`,
    `Setting and action: ${body}.`,
    `Camera: ${camera}.`,
    `Light and atmosphere: ${light}.`,
    `Story direction: ${beatPrompt}.`,
    `Place the approved wreath naturally within this environment as a lived-in object; preserve its exact floral identity, crescent geometry, scale, asymmetry, and breathing room.`,
    `Wreath anchor reference for continuity only: ${anchor}`,
    "Photorealistic editorial lifestyle photography, tactile materials, believable spatial depth, no isolated product cutout, no redesign of the wreath.",
  ].join(" ");
  if (storyBeats.length >= 3) {
    return storyBeats.map((beat, index) => {
      const title = String(beat.name ?? `Story beat ${index + 1}`);
      const context = String(beat.role ?? "Narrative moment");
      const body = String(beat.setting ?? "A lived-in place shaped by the approved emotional profile.");
      const camera = String(beat.camera ?? "Cinematic editorial framing with a clear environmental subject.");
      const light = String(beat.light ?? "Soft atmospheric light shaped by the approved emotional profile.");
      const beatPrompt = String(beat.prompt ?? "Let the scene reveal the next emotional movement of the story.");
      return { number: String(index + 1).padStart(2, "0"), title, context, body, placement: `${camera} · ${light}`, prompt: typeof beat.prompt === "string" && beat.prompt.trim().length > 0 ? beat.prompt : buildPrompt(title, context, body, camera, light, beatPrompt) };
    });
  }
  return [
    { number: "01", title: "The dock at first light", context: "Threshold", body: "A quiet arrival at a lake-house dock; a hand sets down a woven bag while the morning begins beyond the doorway.", placement: "Wide environmental frame · soft blue morning light breaking across warm dock wood.", prompt: buildPrompt("The dock at first light", "Threshold", "A quiet arrival at a lake-house dock; a hand sets down a woven bag while the morning begins beyond the doorway", "Wide environmental frame with the doorway and dock leading the eye", "Soft blue morning light breaking across warm dock wood", "The memory begins before the room does, with an arrival that feels familiar rather than staged") },
    { number: "02", title: "Coffee cooling on the rail", context: "Intimate space", body: "A quiet interior after conversation, with coffee cooling on an oak rail and linen catching the last movement of the morning.", placement: "Close environmental portrait · warm horizontal light with low contrast and tactile shadows.", prompt: buildPrompt("Coffee cooling on the rail", "Intimate space", "A quiet interior after conversation, with coffee cooling on an oak rail and linen catching the last movement of the morning", "Close environmental portrait that keeps the wreath in relationship to the rail and room", "Warm horizontal light with low contrast and tactile shadows", "Let the wreath feel like a witness to the hour after conversation") },
    { number: "03", title: "The entry after the guests leave", context: "Open return", body: "An entry at blue hour, the room holding the traces of company while the open side of the wreath gives the silence somewhere to breathe.", placement: "Balanced architectural frame · last blue light with a restrained amber practical in the distance.", prompt: buildPrompt("The entry after the guests leave", "Open return", "An entry at blue hour, the room holding the traces of company while the open side of the wreath gives the silence somewhere to breathe", "Balanced architectural frame with generous negative space around the crescent", "Last blue light with a restrained amber practical in the distance", "Allow the story to resolve through absence, spaciousness, and the feeling of return") },
  ];
}
