import { buildGeneratedBuildSheet, buildPackageManifest, type PackageManifestItem } from "./packageDownload";

export type PackageSnapshot = {
  complete: boolean;
  readyCount: number;
  totalCount: number;
  items: PackageManifestItem[];
  blueprint: { id: number; version: number; filename: string; json: string } | null;
  buildSheet: { filename: string; html: string } | null;
  assets: Array<{ id: number; kind: "wreath" | "lifestyle" | "blueprint_pdf" | "ecrpkg"; filename: string; fileKey: string; url: string }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function createPackageSnapshot(input: { blueprint: { id: number; version: number; blueprint: unknown } | null; projectRecipe: unknown; assets: Array<{ id: number; kind: "wreath" | "lifestyle" | "blueprint_pdf" | "ecrpkg"; fileKey: string; url: string; provenance: unknown }> }): PackageSnapshot {
  const approvedAssets = input.assets;
  const wreathAssets = approvedAssets.filter((asset) => asset.kind === "wreath");
  const lifestyleAssets = approvedAssets.filter((asset) => asset.kind === "lifestyle");
  const blueprintArtifact = approvedAssets.find((asset) => asset.kind === "blueprint_pdf");
  const blueprintShape = input.blueprint && isRecord(input.blueprint.blueprint) ? input.blueprint.blueprint : null;
  const recipe = isRecord(input.projectRecipe) && Array.isArray(input.projectRecipe.selections) ? input.projectRecipe.selections : [];
  const selections = recipe.filter(isRecord).map((selection) => ({ itemId: String(selection.itemId ?? ""), name: String(selection.name ?? selection.itemId ?? "") })).filter((selection) => selection.itemId && selection.name);
  let buildSheet: PackageSnapshot["buildSheet"] = null;
  if (blueprintShape && ["schema", "version", "sizeIn", "formula", "seed", "emotion", "silenceArc", "ringBands", "clusters", "objects"].every((key) => key in blueprintShape)) {
    try { buildSheet = buildGeneratedBuildSheet({ blueprint: blueprintShape, selections }); } catch { buildSheet = null; }
  }
  const blueprintFilename = input.blueprint ? `evercrafted-blueprint-v${input.blueprint.version}.json` : undefined;
  const assetFilename = (asset: typeof approvedAssets[number], fallback: string) => { const provenance = isRecord(asset.provenance) ? asset.provenance : {}; const filename = typeof provenance.filename === "string" ? provenance.filename : null; return filename || fallback; };
  const manifest = buildPackageManifest({ hasBlueprint: Boolean(input.blueprint), hasBuildSheet: Boolean(buildSheet), wreathCount: wreathAssets.length, lifestyleCount: lifestyleAssets.length, wreathFilenames: wreathAssets.map((asset, index) => assetFilename(asset, `wreath-${index + 1}.png`)), lifestyleFilenames: lifestyleAssets.map((asset, index) => assetFilename(asset, `lifestyle-${index + 1}.png`)), blueprintFilename, buildSheetFilename: buildSheet?.filename ?? (blueprintArtifact ? assetFilename(blueprintArtifact, "approved-blueprint.pdf") : undefined) });
  return { ...manifest, blueprint: input.blueprint && blueprintShape ? { id: input.blueprint.id, version: input.blueprint.version, filename: blueprintFilename!, json: JSON.stringify(blueprintShape, null, 2) } : null, buildSheet, assets: approvedAssets.map((asset) => ({ id: asset.id, kind: asset.kind, filename: assetFilename(asset, `${asset.kind}-${asset.id}`), fileKey: asset.fileKey, url: asset.url })) };
}
