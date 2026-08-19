import { describe, expect, it } from "vitest";
import { buildEvsFisaReview, buildReverseEcrPackage, buildReverseScoreReport, buildSignatureArtifactMetadata, buildWgsReverseGenome, mergeEvsFisaReview, profileAssembledWreath, serializeEcrPackage } from "../shared/signaturePipeline";
import type { ReverseEngineeringAnalysis } from "../shared/reverseEngineering";

const analysis: ReverseEngineeringAnalysis = {
  confidenceOverall: "medium",
  flags: ["SKU confirmation required"],
  season: "late autumn",
  style: "editorial woodland",
  stemCountTotal: 18,
  clusterCount: 3,
  form: { shape: "open crescent", sizeIn: 24, density: "airy", symmetry: "asymmetric" },
  palette: { dominant: "moss", secondary: "cream", accent: "rust" },
  emotionProfile: { primary: "belonging", secondary: "longing", atmosphere: "quiet return" },
  florals: [
    { role: "focal", identifiedAs: "cream ranunculus", color: "cream", estimatedStemCount: 4, confidence: "high", skuMatch: "TP-001", skuNeeded: false, placementZones: ["12 o'clock"], flag: null },
    { role: "greenery", identifiedAs: "eucalyptus", color: "moss", estimatedStemCount: 14, confidence: "medium", skuMatch: null, skuNeeded: true, placementZones: ["3 o'clock", "6 o'clock"], flag: "SKU confirmation required" },
  ],
};

describe("reverse Signature Wreath pipeline", () => {
  it("profiles assembled wreaths and produces deterministic review metrics", () => {
    expect(profileAssembledWreath(analysis)).toMatchObject({ classification: "ASSEMBLED_WREATH", stemCount: 18, primaryEmotion: "belonging" });
    expect(buildWgsReverseGenome(analysis)).toContain("WGS-RE|open crescent|belonging");
    expect(buildReverseScoreReport(analysis)).toMatchObject({ overall: "medium", floralConfidence: 50, unresolvedSkuCount: 1 });
    const review = buildEvsFisaReview({ decision: "approved", note: "Confirmed by studio", overrides: { density: "airy" }, reviewedBy: 7, reviewedAt: 123 });
    expect(mergeEvsFisaReview({ atmosphere: "autumn" }, review).evsFisaReview).toEqual(review);
    expect(buildSignatureArtifactMetadata("signature-wreaths/ecr/12.ecrpkg")).toMatchObject({ extension: ".ecrpkg", mimeType: "application/vnd.evercrafted.ecrpkg+gzip", expiresInSeconds: 900 });
  });

  it("compiles typed ECR scene objects and a package manifest", () => {
    const first = buildReverseEcrPackage(analysis);
    const second = buildReverseEcrPackage(analysis);
    expect(first.scene.ecrVersion).toBe("1.1");
    expect(first.scene.objects).toHaveLength(3);
    expect(first.scene.blueprintHash).toBe(second.scene.blueprintHash);
    expect(first.package.files["scene.ecr.json"]).toEqual(first.scene);
    expect(first.package.files["dependencies.lock"]).toMatchObject({ dependencies: { blueprint: { id: "reverse-open crescent-18" } } });
    const binary = serializeEcrPackage(first.package);
    expect(binary.subarray(0, 2)).toEqual(Buffer.from([0x1f, 0x8b]));
  });
});
