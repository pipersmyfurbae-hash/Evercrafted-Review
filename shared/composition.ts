export type FloralItem = {
  itemId: string;
  name: string;
  colorHex?: string | null;
  colorFamily?: string | null;
  structuralRole?: string | null;
  emotionTags: string[];
  status?: string | null;
  approved?: boolean;
  stemLengthIn?: number | null;
};

export type EmotionalBrief = {
  primary: string;
  secondary: string[];
  palette: string[];
  formula: "Crescent" | "Side Sweep" | "Bottom Heavy" | "Twin Cluster" | "Classic Balanced";
  silenceArc: [number, number];
};

const roleOrder = ["focal", "secondary", "filler", "greenery"] as const;
const selectionOrder = ["greenery", "focal", "secondary", "filler"] as const;
const roleTarget = { focal: 3, secondary: 5, filler: 8, greenery: 10 } as const;

function seeded(seed: number) {
  let state = Math.abs(seed || 1) % 2147483647;
  return () => (state = (state * 16807) % 2147483647) / 2147483647;
}

function matchScore(item: FloralItem, brief: EmotionalBrief, role: string) {
  const tags = new Set([brief.primary, ...brief.secondary].map((value) => value.toLowerCase()));
  const itemTags = item.emotionTags.map((value) => value.toLowerCase());
  const emotionTags = itemTags.filter((tag) => tags.has(tag));
  const emotion = emotionTags.length ? 3 : 0;
  const paletteNames = [item.colorFamily, item.colorHex, item.name].filter(Boolean).map((candidate) => String(candidate).toLowerCase());
  const paletteMatches = brief.palette.filter((value) => paletteNames.some((candidate) => candidate.includes(value.toLowerCase())));
  const palette = paletteMatches.length ? 2 : 0;
  const structural = (item.structuralRole ?? "").toLowerCase() === role ? 2 : 0;
  const approved = item.approved === false ? -5 : 1;
  const active = item.status === "active" ? 1 : -4;
  return { score: emotion + palette + structural + approved + active, emotionTags, paletteMatches, roleMatch: structural > 0, approvedMatch: approved > 0, activeMatch: active > 0 };
}

export function scoreFloralCandidate(item: FloralItem, brief: EmotionalBrief, role: string) {
  return matchScore(item, brief, role);
}

export function pickFlorals(items: FloralItem[], brief: EmotionalBrief, seed: number) {
  const random = seeded(seed);
  const used = new Set<string>();
  const recipe = Object.fromEntries(roleOrder.map((role) => [role, [] as Array<FloralItem & { tier: "A" | "B" | "C"; estimatedPieces: number; selectionReason: string }>])) as Record<string, Array<FloralItem & { tier: "A" | "B" | "C"; estimatedPieces: number; selectionReason: string }>>;
  for (const role of selectionOrder) {
    const available = items.filter((item) => !used.has(item.itemId) && item.status !== "inactive");
    const roleCandidates = role === "greenery"
      ? available.filter((item) => (item.structuralRole ?? "").toLowerCase().includes("green") || (item.colorFamily ?? "").toLowerCase().match(/green|olive|sage|foliage/))
      : available;
    const candidates = (roleCandidates.length ? roleCandidates : role === "greenery" ? [] : available).map((item) => {
      const match = matchScore(item, brief, role);
      const tier = match.score >= 6 ? "A" : match.score >= 4 ? "B" : "C";
      return { item, ...match, tier };
    }).sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name));
    const count = role === "focal" ? 1 : role === "greenery" ? 2 : 2;
    for (let index = 0; index < count && candidates.length; index++) {
      const offset = Math.floor(random() * Math.min(3, candidates.length));
      const chosen = candidates.splice(offset, 1)[0];
      if (!chosen) continue;
      used.add(chosen.item.itemId);
      const reasons = [chosen.emotionTags.length ? `emotion match: ${chosen.emotionTags.join(", ")}` : `emotion bridge: ${brief.primary} through ${role}`, chosen.paletteMatches.length ? `palette match: ${chosen.paletteMatches.join(", ")}` : `palette bridge: ${brief.palette[0] ?? "the approved palette"}`, chosen.roleMatch ? `structural role: ${role}` : `supporting role: used as ${role}`, chosen.approvedMatch ? "approved inventory" : "inventory review required"];
      recipe[role].push({ ...chosen.item, tier: chosen.tier as "A" | "B" | "C", estimatedPieces: Math.max(1, Math.round(roleTarget[role] / count)), selectionReason: `${chosen.tier} match · ${reasons.join(" · ")}`, matchFactors: { emotionTags: chosen.emotionTags, paletteMatches: chosen.paletteMatches, roleMatch: chosen.roleMatch, approvedMatch: chosen.approvedMatch, score: chosen.score } } as FloralItem & { tier: "A" | "B" | "C"; estimatedPieces: number; selectionReason: string; matchFactors: { emotionTags: string[]; paletteMatches: string[]; roleMatch: boolean; approvedMatch: boolean; score: number } });
    }
  }
  return { seed, recipe };
}

export type BlueprintObject = { id: string; asset: string; layer: string; theta: number; radius: number; scale: number; rotation: number; depth: number; composition: { compositionFunction: "anchor" | "mass" | "transition" | "texture" | "rest"; visualMass: number; emotionalWeight: number; attentionPriority: number } };

export function composeBlueprint(recipe: ReturnType<typeof pickFlorals>["recipe"], brief: EmotionalBrief, seed: number, sizeIn = 24) {
  const objects: BlueprintObject[] = [];
  const roleDepth: Record<string, number> = { greenery: 1, filler: 2, secondary: 3, focal: 4 };
  const roleFunction: Record<string, BlueprintObject["composition"]["compositionFunction"]> = { greenery: "rest", filler: "texture", secondary: "transition", focal: "anchor" };
  let index = 0;
  for (const role of roleOrder) {
    const elements = recipe[role] ?? [];
    elements.forEach((item, itemIndex) => {
      const base = role === "focal" ? 180 : role === "secondary" ? 60 + itemIndex * 120 : role === "filler" ? 25 + itemIndex * 55 : 315 + itemIndex * 32;
      const theta = (base + (seed % 11) - 5 + 360) % 360;
      const radius = role === "greenery" ? 0.38 : role === "filler" ? 0.62 : role === "secondary" ? 0.72 : 0.78;
      objects.push({ id: `stem_${String(index++).padStart(3, "0")}`, asset: item.itemId, layer: role, theta, radius, scale: role === "focal" ? 1.08 : role === "secondary" ? .9 : .72, rotation: Math.round((theta + 180) % 360), depth: roleDepth[role], composition: { compositionFunction: roleFunction[role], visualMass: role === "focal" ? .86 : role === "secondary" ? .58 : .28, emotionalWeight: role === "focal" ? .92 : role === "secondary" ? .64 : .34, attentionPriority: role === "focal" ? 1 : 2 } });
    });
  }
  const ringBands = [{ name: "inner", radius: 0.38, role: "greenery" }, { name: "middle", radius: 0.62, role: "filler" }, { name: "outer", radius: 0.72, role: "secondary" }, { name: "anchor", radius: 0.78, role: "focal" }];
  const clusters = objects.reduce((acc, object) => { const key = object.layer === "focal" ? "anchor" : object.theta < 180 ? "left" : "right"; (acc[key] ??= []).push(object.id); return acc; }, {} as Record<string, string[]>);
  const placementMap = objects.map((object) => ({ id: object.id, asset: object.asset, layer: object.layer, angle: object.theta, clock: `${Math.round(object.theta / 30) || 12} o'clock`, radius: object.radius, density: object.layer === "focal" ? "high" : object.layer === "secondary" ? "medium" : "low" }));
  const stemCounts = objects.reduce((acc, object) => { acc[object.asset] = (acc[object.asset] ?? 0) + 1; return acc; }, {} as Record<string, number>);
  return { schema: "EC_WR_V2", version: "2.0", sizeIn, formula: brief.formula, seed, silenceArc: brief.silenceArc, emotion: brief.primary, ringBands, layerOrder: ["greenery", "filler", "secondary", "focal"], clusters, placementMap, stemCounts, objects, validation: { oddClusterCount: true, silenceArcProtected: true, deterministic: true } };
}
