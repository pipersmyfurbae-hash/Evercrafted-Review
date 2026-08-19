import { gzipSync } from "node:zlib";
import type { ReverseEngineeringAnalysis } from "./reverseEngineering";
import type { BlueprintObject } from "./composition";
import { compileEcr } from "./rendering";
import { buildEcrPackage } from "./ecrpkg";

export type AssembledWreathProfile = {
  classification: "ASSEMBLED_WREATH";
  atmosphere: string;
  primaryEmotion: string;
  secondaryEmotion: string;
  palette: string[];
  structure: string;
  density: string;
  stemCount: number;
  confidence: string;
  reviewFlags: string[];
};

export function buildEvsFisaReview(input: { decision: "pending" | "approved" | "needs_revision"; note: string; overrides: Record<string, unknown>; reviewedBy: number; reviewedAt: number }) {
  return { decision: input.decision, note: input.note, overrides: input.overrides, reviewedBy: input.reviewedBy, reviewedAt: input.reviewedAt };
}

export function mergeEvsFisaReview(analysis: Record<string, unknown>, review: ReturnType<typeof buildEvsFisaReview>) {
  return { ...analysis, evsFisaReview: review };
}

export function buildSignatureArtifactMetadata(key: string) {
  return { key, mimeType: "application/vnd.evercrafted.ecrpkg+gzip", extension: ".ecrpkg", expiresInSeconds: 900 } as const;
}

export function profileAssembledWreath(analysis: ReverseEngineeringAnalysis): AssembledWreathProfile {
  return {
    classification: "ASSEMBLED_WREATH",
    atmosphere: `${analysis.season} ${analysis.style}`,
    primaryEmotion: analysis.emotionProfile.primary,
    secondaryEmotion: analysis.emotionProfile.secondary,
    palette: [analysis.palette.dominant, analysis.palette.secondary, analysis.palette.accent],
    structure: analysis.form.shape,
    density: analysis.form.density,
    stemCount: analysis.stemCountTotal,
    confidence: analysis.confidenceOverall,
    reviewFlags: analysis.flags,
  };
}

export function buildReverseRecipe(analysis: ReverseEngineeringAnalysis) {
  return {
    version: "RECIPE_REVERSE_V1",
    items: analysis.florals.map((floral) => ({ name: floral.identifiedAs, role: floral.role, quantity: floral.estimatedStemCount, sku: floral.skuMatch, skuNeeded: floral.skuNeeded, placementZones: floral.placementZones, confidence: floral.confidence })),
    unresolvedCount: analysis.florals.filter((floral) => floral.skuNeeded).length,
  };
}

export function buildWgsReverseGenome(analysis: ReverseEngineeringAnalysis): string {
  const tokens = analysis.florals.map((floral) => `${floral.role}:${floral.identifiedAs.replace(/\\s+/g, "-").toLowerCase()}:${floral.estimatedStemCount}`).join("|");
  return `WGS-RE|${analysis.form.shape}|${analysis.emotionProfile.primary}|${tokens}`;
}

export function serializeEcrPackage(pkg: unknown): Buffer {
  return gzipSync(Buffer.from(JSON.stringify(pkg)));
}

export function buildReverseEcrPackage(analysis: ReverseEngineeringAnalysis) {
  const objects: BlueprintObject[] = analysis.florals.flatMap((floral, floralIndex) => floral.placementZones.map((zone, zoneIndex) => {
    const match = zone.match(/(\\d{1,3})/);
    const theta = Math.min(359, Math.max(0, Number(match?.[1] ?? ((floralIndex * 47 + zoneIndex * 11) % 360))));
    const role = floral.role === "focal" || floral.role === "secondary" ? floral.role : floral.role === "greenery" ? "greenery" : "filler";
    const composition = role === "focal" ? "anchor" : role === "secondary" ? "mass" : role === "greenery" ? "texture" : "transition";
    return { id: `reverse-${floralIndex + 1}-${zoneIndex + 1}`, asset: floral.skuMatch ?? `unresolved-${floral.identifiedAs.toLowerCase().replace(/\\s+/g, "-")}`, layer: role, theta, radius: role === "focal" ? 0.78 : role === "secondary" ? 0.9 : 0.98, scale: 1, rotation: 0, depth: floralIndex + 1, composition: { compositionFunction: composition, visualMass: Math.max(0.1, floral.estimatedStemCount / Math.max(1, analysis.stemCountTotal)), emotionalWeight: floral.confidence === "high" ? 1 : floral.confidence === "medium" ? 0.7 : 0.4, attentionPriority: role === "focal" ? 1 : 0.6 } } as BlueprintObject;
  }));
  const scene = compileEcr({ sizeIn: analysis.form.sizeIn, seed: analysis.stemCountTotal, objects });
  const pkg = buildEcrPackage(scene, analysis.florals.map((floral) => ({ asset: floral.skuMatch, identifiedAs: floral.identifiedAs, skuNeeded: floral.skuNeeded })), `reverse-${analysis.form.shape}-${analysis.stemCountTotal}`);
  return { scene, package: pkg };
}

export function buildReverseScoreReport(analysis: ReverseEngineeringAnalysis) {
  const confirmed = analysis.florals.filter((floral) => floral.confidence === "high").length;
  return { version: "SCORE_REVERSE_V1", overall: analysis.confidenceOverall, floralConfidence: analysis.florals.length ? Math.round((confirmed / analysis.florals.length) * 100) : 0, unresolvedSkuCount: analysis.florals.filter((floral) => floral.skuNeeded).length, flags: analysis.flags };
}

export function buildReverseBlueprint(analysis: ReverseEngineeringAnalysis) {
  return {
    version: "BLUEPRINT_REVERSE_V1",
    formula: analysis.form.shape,
    sizeIn: analysis.form.sizeIn,
    density: analysis.form.density,
    palette: [analysis.palette.dominant, analysis.palette.secondary, analysis.palette.accent],
    clusters: analysis.florals.map((floral, index) => ({ id: `${floral.role}-${index + 1}`, role: floral.role, placementZones: floral.placementZones, stemCount: floral.estimatedStemCount })),
    stemCountTotal: analysis.stemCountTotal,
    clusterCount: analysis.clusterCount,
    silenceArc: analysis.form.symmetry.toLowerCase().includes("asym") ? [300, 30] : [0, 0],
    reviewStatus: "operator_review_required",
  };
}
