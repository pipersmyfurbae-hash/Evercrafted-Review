import { describe, expect, it } from "vitest";
import { buildGeneratedBuildSheet, buildPackageManifest, downloadPackageEntries } from "./packageDownload";
import { createPackageSnapshot } from "./packageSnapshot";

describe("approved download package", () => {
  it("reports each required package component and blocks incomplete packages", () => {
    const manifest = buildPackageManifest({ hasBlueprint: true, hasBuildSheet: false, wreathCount: 1, lifestyleCount: 0, wreathFilenames: ["wreath.png"], lifestyleFilenames: [] });
    expect(manifest.complete).toBe(false);
    expect(manifest.items.find((item) => item.key === "build_sheet")?.status).toBe("missing");
    expect(manifest.items.find((item) => item.key === "wreath")?.count).toBe(1);
  });

  it("builds a truthful complete snapshot from approved project data only", () => {
    const blueprint = { schema: "ECR", version: "1.1", sizeIn: 24, formula: "Crescent", seed: 42, emotion: "tender", silenceArc: [45, 135] as [number, number], ringBands: [{ name: "outer", radius: 1, role: "greenery" }], clusters: { focal: ["focal-a"] }, objects: [{ id: "focal-a", asset: "focal-a", layer: "focal", theta: 90, radius: 1, rotation: 0 }] };
    const snapshot = createPackageSnapshot({ blueprint: { id: 8, version: 2, blueprint }, projectRecipe: { selections: [{ itemId: "focal-a", name: "White rose", clientSelected: true }] }, assets: [
      { id: 1, kind: "wreath", fileKey: "projects/1/wreath/wreath.png", url: "https://storage.example/wreath.png", provenance: { filename: "wreath.png" } },
      { id: 2, kind: "lifestyle", fileKey: "projects/1/lifestyle/scene.png", url: "https://storage.example/scene.png", provenance: { filename: "scene.png" } },
      { id: 3, kind: "ecrpkg", fileKey: "projects/1/ecrpkg/package.zip", url: "https://storage.example/package.zip", provenance: { filename: "package.zip" } },
    ] });
    expect(snapshot.complete).toBe(true);
    expect(snapshot.items.map((item) => item.status)).toEqual(["ready", "ready", "ready", "ready"]);
    expect(snapshot.assets.some((asset) => asset.kind === "ecrpkg")).toBe(true);
    expect(snapshot.buildSheet?.filename).toContain("evercrafted-build-sheet-42");
  });

  it("creates a build sheet and ZIP containing named entries", async () => {
    const blueprint = { schema: "ECR", version: "1.1", sizeIn: 24, formula: "Crescent", seed: 7, emotion: "quiet", silenceArc: [45, 135] as [number, number], ringBands: [], clusters: {}, objects: [] };
    const sheet = buildGeneratedBuildSheet({ blueprint, selections: [] });
    expect(sheet.html).toContain("Evercrafted memory wreath build sheet");
    const zip = await downloadPackageEntries([{ name: "blueprint.json", data: "{}" }, { name: sheet.filename, data: sheet.html }, { name: "wreath/wreath.png", data: Buffer.from("image") }]);
    expect(zip.subarray(0, 2).toString()).toBe("PK");
    expect(zip.length).toBeGreaterThan(100);
  });
});
