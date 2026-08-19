import type { EmotionalBrief, FloralItem } from "./composition";
import { scoreFloralCandidate } from "./composition";

export const WEAVER_ROLE_COUNTS = { focal: 2, secondary: 2, bridge: 1, filler: 1, greenery: 1, movement: 1 } as const;
export type WeaverRole = keyof typeof WEAVER_ROLE_COUNTS;

export type WeaverCandidate = {
  itemId: string;
  name: string;
  colorHex?: string | null;
  colorFamily?: string | null;
  structuralRole?: string | null;
  role: WeaverRole;
  emotionTags: string[];
  stemLengthIn?: number | null;
  availability: "available" | "review" | "unavailable";
  substitutionStatus: "none" | "candidate";
  recommended: boolean;
  selectionReason: string;
  designEffect: string;
  matchFactors: { emotionTags: string[]; paletteMatches: string[]; roleMatch: boolean; availability: boolean };
};

function roleFit(item: FloralItem, role: WeaverRole) {
  const structural = (item.structuralRole ?? "").toLowerCase();
  if (role === "bridge") return ["secondary", "filler"].includes(structural);
  if (role === "movement") return structural.includes("green") || /trail|fern|eucalyptus|olive|cedar|arc/i.test(`${item.name} ${item.colorFamily ?? ""}`);
  if (role === "greenery") return structural.includes("green") || /green|foliage|eucalyptus|olive|fern|cedar/i.test(`${item.name} ${item.colorFamily ?? ""}`);
  return structural === role;
}

function designEffect(role: WeaverRole, item: FloralItem, brief: EmotionalBrief) {
  const form = /round|peony|hydrangea|rose|ball/i.test(item.name) ? "gathered" : /spray|branch|fern|trail|eucalyptus|olive/i.test(item.name) ? "directional" : "textural";
  if (role === "focal") return `${form} focal presence that carries ${brief.primary.toLowerCase()} without losing the approved palette.`;
  if (role === "movement") return `directional movement that lets the eye travel through the ${brief.formula} structure.`;
  if (role === "greenery") return `foundation and breathing space that protects the wreath's silence arc.`;
  if (role === "bridge") return `a quieter transition between the focal mass and supporting materials.`;
  if (role === "filler") return `texture that gives the selected story signals a lived-in middle distance.`;
  return `supporting form that keeps the selected focal materials emotionally legible.`;
}

export function curateInventoryCandidates(items: FloralItem[], brief: EmotionalBrief, selections: Partial<Record<WeaverRole, string[]>> = {}, limit = 6): Record<WeaverRole, WeaverCandidate[]> {
  const chosen = new Set(Object.values(selections).flat());
  const result = {} as Record<WeaverRole, WeaverCandidate[]>;
  (Object.keys(WEAVER_ROLE_COUNTS) as WeaverRole[]).forEach((role) => {
    const roleItems = items.filter((item) => item.status !== "inactive" && item.approved !== false && roleFit(item, role));
    const candidates = roleItems.filter((item) => !chosen.has(item.itemId) || (selections[role] ?? []).includes(item.itemId)).map((item) => {
      const score = scoreFloralCandidate(item, brief, role === "bridge" || role === "movement" ? (role === "movement" ? "greenery" : "filler") : role);
      const availability: WeaverCandidate["availability"] = item.status === "active" ? "available" : "review";
      const substitutionStatus: WeaverCandidate["substitutionStatus"] = score.roleMatch ? "none" : "candidate";
      const emotion = score.emotionTags.length ? `emotion match: ${score.emotionTags.join(", ")}` : `emotion bridge: ${brief.primary}`;
      const palette = score.paletteMatches.length ? `palette match: ${score.paletteMatches.join(", ")}` : `palette bridge: ${brief.palette[0] ?? "the approved palette"}`;
      return {
        itemId: item.itemId,
        name: item.name,
        colorHex: item.colorHex,
        colorFamily: item.colorFamily,
        structuralRole: item.structuralRole,
        role,
        emotionTags: item.emotionTags,
        stemLengthIn: item.stemLengthIn,
        availability,
        substitutionStatus,
        recommended: false,
        selectionReason: `${emotion} · ${palette} · ${score.roleMatch ? `structural role: ${role}` : `compatible bridge into ${role}`}`,
        designEffect: designEffect(role, item, brief),
        matchFactors: { emotionTags: score.emotionTags, paletteMatches: score.paletteMatches, roleMatch: score.roleMatch, availability: availability === "available" },
        _score: score.score,
      };
    }).sort((a, b) => b._score - a._score || a.name.localeCompare(b.name)).slice(0, limit);
    if (candidates[0]) candidates[0].recommended = true;
    result[role] = candidates.map(({ _score: _ignored, ...candidate }) => candidate);
  });
  return result;
}
