import { ZipArchive } from "archiver";
import { PassThrough } from "node:stream";
import { buildPrintableBuildSheet, buildSheetFilename } from "../shared/buildsheet";

export type PackageManifestItem = {
  key: "blueprint" | "build_sheet" | "wreath" | "lifestyle_gallery";
  label: string;
  status: "ready" | "missing";
  count: number;
  filenames: string[];
};

export type PackageEntry = { name: string; data: Buffer | string };

export function buildPackageManifest(input: {
  hasBlueprint: boolean;
  hasBuildSheet: boolean;
  wreathCount: number;
  lifestyleCount: number;
  wreathFilenames: string[];
  lifestyleFilenames: string[];
  blueprintFilename?: string;
  buildSheetFilename?: string;
}) {
  const items: PackageManifestItem[] = [
    { key: "blueprint", label: "Approved Blueprint", status: input.hasBlueprint ? "ready" : "missing", count: input.hasBlueprint ? 1 : 0, filenames: input.blueprintFilename ? [input.blueprintFilename] : [] },
    { key: "build_sheet", label: "Build Sheet", status: input.hasBuildSheet ? "ready" : "missing", count: input.hasBuildSheet ? 1 : 0, filenames: input.buildSheetFilename ? [input.buildSheetFilename] : [] },
    { key: "wreath", label: "Approved wreath render", status: input.wreathCount > 0 ? "ready" : "missing", count: input.wreathCount, filenames: input.wreathFilenames },
    { key: "lifestyle_gallery", label: "Approved lifestyle gallery", status: input.lifestyleCount > 0 ? "ready" : "missing", count: input.lifestyleCount, filenames: input.lifestyleFilenames },
  ];
  return { items, complete: items.every((item) => item.status === "ready"), readyCount: items.filter((item) => item.status === "ready").length, totalCount: items.length };
}

export function buildGeneratedBuildSheet(input: { blueprint: Record<string, unknown>; selections: Array<{ itemId: string; name: string }> }) {
  const blueprint = input.blueprint as Parameters<typeof buildPrintableBuildSheet>[0]["blueprint"];
  const items = input.selections.map((selection) => ({ itemId: selection.itemId, name: selection.name, colorHex: null, colorFamily: null, structuralRole: "", emotionTags: [], status: "active" as const, approved: true, stemLengthIn: null }));
  return { filename: buildSheetFilename(Number(blueprint.seed ?? 0)), html: buildPrintableBuildSheet({ blueprint, items }) };
}

export async function downloadPackageEntries(entries: PackageEntry[]) {
  const archive = new ZipArchive({ zlib: { level: 9 } });
  const output = new PassThrough();
  const chunks: Buffer[] = [];
  const finished = new Promise<Buffer>((resolve, reject) => {
    output.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    output.on("end", () => resolve(Buffer.concat(chunks)));
    output.on("error", reject);
    archive.on("error", reject);
  });
  archive.pipe(output);
  for (const entry of entries) archive.append(entry.data, { name: entry.name });
  await archive.finalize();
  return finished;
}
