import { z } from "zod";

export const atmosphereArchetypes = ["Quiet Opulence", "Weathered Romance", "Sacred Warmth", "Lingering Autumn", "Velvet Stillness", "Candlelit Gathering", "Garden Memory", "Coastal Melancholy", "Wild Ceremony", "Soft Grandeur", "Inherited Beauty", "Winter Reverence", "Faded Celebration", "Untamed Elegance", "Gilded Silence", "Reverence", "Ceremony", "Stillness", "Tension", "Drift", "Inheritance", "Echo", "Sanctuary"] as const;
export const movementArchetypes = ["Still", "Cascade", "Taper Fade", "Drift", "Side Sweep", "Orbit", "Spiral", "Rhythmic", "Restless", "Reaching", "Garden Scatter", "Wild Lift"] as const;
const enumOf = <T extends readonly [string, ...string[]]>(values: T) => z.enum(values);
const color = z.object({ hex: z.string().regex(/^#[0-9a-fA-F]{6}$/), name: z.string().min(2).max(80) });

export const emotionalDesignProfileSchema = z.object({
  emotionalCore: z.object({ primaryEmotion: z.string().min(2), secondaryEmotions: z.array(z.string().min(2)).min(2).max(4), emotionalTemperature: enumOf(["cool", "neutral", "warm", "hot"]), emotionalWeight: enumOf(["featherlight", "balanced", "grounded", "heavy"]), emotionalPacing: enumOf(["still", "slow", "rhythmic", "restless", "urgent"]), emotionalTension: enumOf(["resolved", "suspended", "building", "aching", "released"]) }),
  paletteSystem: z.object({ dominantColor: color, supportingColors: z.array(color).min(2).max(4), accentColor: color, negativeSpaceColor: color, colorTemperature: enumOf(["cool", "warm", "split-toned", "desaturated"]), colorSaturation: enumOf(["muted", "low", "medium", "high", "saturated"]) }),
  textureMaterial: z.object({ primaryTexture: z.string().min(2), secondaryTextures: z.array(z.string().min(2)).min(2).max(3), materialWeight: enumOf(["delicate", "medium", "substantial", "architectural"]), surfaceQuality: enumOf(["matte", "satin", "luminous", "worn", "patinated"]), organicVsStructured: z.number().min(0).max(10) }),
  movementEnergy: z.object({ movementArchetype: z.array(enumOf(movementArchetypes)).min(1).max(2), directionalEnergy: z.string().min(2), tensionType: z.string().min(2), rhythmQuality: enumOf(["even", "syncopated", "sparse", "dense", "erratic"]) }),
  densitySpace: z.object({ overallDensity: enumOf(["sparse", "open", "balanced", "lush", "saturated"]), focalDensity: z.string().min(2), negativeSpaceRole: enumOf(["breathing room", "dramatic void", "structural silence", "counterweight"]), layeringDepth: enumOf(["flat", "shallow", "mid", "deep", "dimensional"]) }),
  asymmetryComposition: z.object({ asymmetryType: enumOf(["balanced asymmetry", "weighted asymmetry", "intentional imbalance", "structural tension"]), dominantQuadrant: enumOf(["top-left", "top-right", "bottom-left", "bottom-right", "center"]), secondaryPull: z.string().min(2), silenceZone: z.string().min(2) }),
  lightQuality: z.object({ lightCharacter: z.string().min(2), shadowBehavior: enumOf(["soft", "crisp", "long", "absent"]), luminosity: enumOf(["dim", "low", "balanced", "bright", "radiant"]) }),
  atmosphere: z.object({ atmosphereArchetype: enumOf(atmosphereArchetypes), sensoryAnchors: z.array(z.string().min(2)).min(2).max(3), timeOfDayFeeling: enumOf(["dawn", "morning", "afternoon", "golden hour", "dusk", "night"]), seasonalResonance: enumOf(["early spring", "late summer", "peak autumn", "deep winter", "transitional"]) }),
  wreathTranslation: z.object({ compositionFormula: z.enum(["Crescent", "Side Sweep", "Bottom Heavy", "Diagonal Flow", "Twin Cluster", "Corner Cluster", "Wild Asymmetry", "Half Ring", "Top Cluster", "Spiral Flow", "Classic Balanced", "Garden Scatter"]), ringBands: z.array(z.object({ name: z.enum(["A", "B", "C", "D"]), role: z.string().min(2), radius: z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)]) })).length(4), silenceArc: z.tuple([z.number().min(0).max(360), z.number().min(0).max(360)]), clusterBehavior: z.array(z.string().min(2)).min(2).max(4), seasonalDriftTags: z.array(z.string().min(2)).min(1).max(5), blueprintEmotionTags: z.array(z.string().min(2)).min(3).max(12), sourcingNotes: z.array(z.string().min(2)).max(8) }),
  provenance: z.object({ intakeId: z.number().int().positive().optional(), sourceMemoryHash: z.string().min(8).optional(), provider: z.string().min(1).optional(), endpoint: z.string().url().optional(), modelVersion: z.string().min(1), schemaVersion: z.string().min(1), generatedAt: z.number().int().positive(), overrides: z.record(z.string(), z.unknown()).default({}) }),
});

export type EmotionalDesignProfile = z.infer<typeof emotionalDesignProfileSchema>;

export const emotionalProfileOverrideSchema = z.object({ primaryEmotion: z.string().min(2).max(80).optional(), atmosphereArchetype: enumOf(atmosphereArchetypes).optional(), emotionalWeight: enumOf(["featherlight", "balanced", "grounded", "heavy"]).optional(), emotionalPacing: enumOf(["still", "slow", "rhythmic", "restless", "urgent"]).optional(), directionalEnergy: z.string().min(2).max(240).optional(), overallDensity: enumOf(["sparse", "open", "balanced", "lush", "saturated"]).optional(), asymmetryType: enumOf(["balanced asymmetry", "weighted asymmetry", "intentional imbalance", "structural tension"]).optional(), compositionFormula: z.enum(["Crescent", "Side Sweep", "Bottom Heavy", "Diagonal Flow", "Twin Cluster", "Corner Cluster", "Wild Asymmetry", "Half Ring", "Top Cluster", "Spiral Flow", "Classic Balanced", "Garden Scatter"]).optional(), silenceArc: z.tuple([z.number().min(0).max(360), z.number().min(0).max(360)]).optional() }).strict();
export type EmotionalProfileOverrides = z.infer<typeof emotionalProfileOverrideSchema>;

export function applyEmotionalOverrides(profile: EmotionalDesignProfile, overrides: EmotionalProfileOverrides): EmotionalDesignProfile {
  const safeOverrides = emotionalProfileOverrideSchema.parse(overrides);
  const next = structuredClone(profile);
  if (safeOverrides.primaryEmotion) next.emotionalCore.primaryEmotion = safeOverrides.primaryEmotion;
  if (safeOverrides.emotionalWeight) next.emotionalCore.emotionalWeight = safeOverrides.emotionalWeight;
  if (safeOverrides.emotionalPacing) next.emotionalCore.emotionalPacing = safeOverrides.emotionalPacing;
  if (safeOverrides.atmosphereArchetype) next.atmosphere.atmosphereArchetype = safeOverrides.atmosphereArchetype;
  if (safeOverrides.directionalEnergy) next.movementEnergy.directionalEnergy = safeOverrides.directionalEnergy;
  if (safeOverrides.overallDensity) next.densitySpace.overallDensity = safeOverrides.overallDensity;
  if (safeOverrides.asymmetryType) next.asymmetryComposition.asymmetryType = safeOverrides.asymmetryType;
  if (safeOverrides.compositionFormula) next.wreathTranslation.compositionFormula = safeOverrides.compositionFormula;
  if (safeOverrides.silenceArc) next.wreathTranslation.silenceArc = safeOverrides.silenceArc;
  return emotionalDesignProfileSchema.parse(next);
}

export function buildCompositionBrief(profile?: EmotionalDesignProfile) {
  const candidate = profile?.wreathTranslation.compositionFormula;
  const formula = ["Crescent", "Side Sweep", "Bottom Heavy", "Twin Cluster", "Classic Balanced"].includes(candidate ?? "") ? candidate as "Crescent" | "Side Sweep" | "Bottom Heavy" | "Twin Cluster" | "Classic Balanced" : "Crescent";
  return { primary: profile?.emotionalCore.primaryEmotion ?? "nostalgia", secondary: profile?.emotionalCore.secondaryEmotions ?? ["warmth", "calm"], palette: profile ? [profile.paletteSystem.dominantColor.name, ...profile.paletteSystem.supportingColors.map((color) => color.name)].slice(0, 5) : ["burgundy", "sage", "ivory"], formula, silenceArc: profile?.wreathTranslation.silenceArc ?? [45, 135] as [number, number], authoritative: Boolean(profile) };
}

export function deriveCompositionFormula(profile: Pick<EmotionalDesignProfile, "emotionalCore" | "movementEnergy" | "densitySpace" | "asymmetryComposition">): EmotionalDesignProfile["wreathTranslation"]["compositionFormula"] {
  const { emotionalWeight, emotionalPacing } = profile.emotionalCore;
  const { asymmetryType } = profile.asymmetryComposition;
  if (asymmetryType === "structural tension") return "Diagonal Flow";
  if (emotionalWeight === "heavy" && profile.densitySpace.overallDensity === "lush") return "Bottom Heavy";
  if (emotionalPacing === "restless") return "Side Sweep";
  if (profile.movementEnergy.movementArchetype.includes("Spiral")) return "Spiral Flow";
  if (asymmetryType === "weighted asymmetry") return "Crescent";
  return "Classic Balanced";
}

export function deriveRingBands(profile: Pick<EmotionalDesignProfile, "emotionalCore">) {
  const coreRole = profile.emotionalCore.emotionalWeight === "heavy" || profile.emotionalCore.emotionalWeight === "grounded" ? "emotional anchor" : "emotional seed";
  return [
    { name: "A" as const, role: coreRole, radius: [0, 0.25] as [number, number] },
    { name: "B" as const, role: "supporting emotional body", radius: [0.25, 0.5] as [number, number] },
    { name: "C" as const, role: "movement and texture", radius: [0.5, 0.75] as [number, number] },
    { name: "D" as const, role: "whisper zone and taper", radius: [0.75, 1] as [number, number] },
  ];
}

export function validateEmotionalProfile(value: unknown): EmotionalDesignProfile {
  return emotionalDesignProfileSchema.parse(value);
}
