export type ReverseEngineeringElement = {
  role: "focal" | "secondary" | "filler" | "greenery" | "accent";
  identifiedAs: string;
  confidence: "high" | "medium" | "low";
  color: string;
  estimatedStemCount: number;
  placementZones: string[];
  skuMatch: string | null;
  skuNeeded: boolean;
  flag: string | null;
};

export type ReverseEngineeringAnalysis = {
  form: { shape: string; sizeIn: number; symmetry: string; density: string };
  palette: { dominant: string; secondary: string; accent: string; ratio: string };
  emotionProfile: { primary: string; secondary: string };
  season: string;
  style: string;
  confidenceOverall: "high" | "medium" | "low";
  flags: string[];
  florals: ReverseEngineeringElement[];
  stemCountTotal: number;
  clusterCount: number;
  notes: string;
};

export const reverseEngineeringSchema = {
  type: "object",
  properties: {
    form: { type: "object", properties: { shape: { type: "string" }, sizeIn: { type: "number" }, symmetry: { type: "string" }, density: { type: "string" } }, required: ["shape", "sizeIn", "symmetry", "density"], additionalProperties: false },
    palette: { type: "object", properties: { dominant: { type: "string" }, secondary: { type: "string" }, accent: { type: "string" }, ratio: { type: "string" } }, required: ["dominant", "secondary", "accent", "ratio"], additionalProperties: false },
    emotionProfile: { type: "object", properties: { primary: { type: "string" }, secondary: { type: "string" } }, required: ["primary", "secondary"], additionalProperties: false },
    season: { type: "string" },
    style: { type: "string" },
    confidenceOverall: { type: "string", enum: ["high", "medium", "low"] },
    flags: { type: "array", items: { type: "string" } },
    florals: { type: "array", items: { type: "object", properties: { role: { type: "string", enum: ["focal", "secondary", "filler", "greenery", "accent"] }, identifiedAs: { type: "string" }, confidence: { type: "string", enum: ["high", "medium", "low"] }, color: { type: "string" }, estimatedStemCount: { type: "integer" }, placementZones: { type: "array", items: { type: "string" } }, skuMatch: { type: ["string", "null"] }, skuNeeded: { type: "boolean" }, flag: { type: ["string", "null"] } }, required: ["role", "identifiedAs", "confidence", "color", "estimatedStemCount", "placementZones", "skuMatch", "skuNeeded", "flag"], additionalProperties: false } },
    stemCountTotal: { type: "integer" },
    clusterCount: { type: "integer" },
    notes: { type: "string" },
  },
  required: ["form", "palette", "emotionProfile", "season", "style", "confidenceOverall", "flags", "florals", "stemCountTotal", "clusterCount", "notes"],
  additionalProperties: false,
} as const;

export function sanitizeReverseEngineering(input: ReverseEngineeringAnalysis): ReverseEngineeringAnalysis {
  return {
    ...input,
    florals: input.florals.map((floral) => ({ ...floral, skuMatch: null, skuNeeded: true, estimatedStemCount: Math.max(0, Math.round(floral.estimatedStemCount || 0)) })),
    stemCountTotal: Math.max(0, Math.round(input.stemCountTotal || 0)),
    clusterCount: Math.max(1, Math.round(input.clusterCount || 1)),
    flags: Array.from(new Set([...(input.flags ?? []), "SKU matches require operator confirmation against approved inventory."])),
  };
}
