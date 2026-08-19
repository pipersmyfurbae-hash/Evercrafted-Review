import type { BlueprintObject } from "./composition";

export type EcrScene = {
  ecrVersion: "1.1";
  blueprintHash: string;
  seed: number;
  sizeIn: number;
  objects: Array<BlueprintObject & { xPx: number; yPx: number; mirror: boolean; pivot: "visual_centroid"; bend: null }>;
  dependencies: { assetManifestVersion: string; floralCanonVersion: string };
  renderProfile: { minimumPx: number; fidelityGate: "full" | "proof_only" };
};

function hash(input: string) {
  let value = 2166136261;
  for (let i = 0; i < input.length; i++) value = Math.imul(value ^ input.charCodeAt(i), 16777619);
  return (value >>> 0).toString(16).padStart(8, "0");
}

export function compileEcr(blueprint: { sizeIn: number; seed: number; objects: BlueprintObject[] }, manifestVersion = "2026.08", canonVersion = "2026.08"): EcrScene {
  const blueprintHash = hash(JSON.stringify(blueprint));
  const outerRadius = blueprint.sizeIn * 0.5;
  return {
    ecrVersion: "1.1",
    blueprintHash,
    seed: blueprint.seed,
    sizeIn: blueprint.sizeIn,
    objects: blueprint.objects.map((object) => {
      const radians = (object.theta * Math.PI) / 180;
      return { ...object, xPx: Number((outerRadius * object.radius * Math.sin(radians)).toFixed(3)), yPx: Number((-outerRadius * object.radius * Math.cos(radians)).toFixed(3)), mirror: false, pivot: "visual_centroid", bend: null };
    }),
    dependencies: { assetManifestVersion: manifestVersion, floralCanonVersion: canonVersion },
    renderProfile: { minimumPx: 3000, fidelityGate: "proof_only" },
  };
}

export function compileMidjourneyPrompt(blueprint: { sizeIn: number; formula: string; silenceArc: [number, number]; emotion: string; objects: BlueprintObject[] }, names: Record<string, string> = {}) {
  const grouped = new Map<string, string[]>();
  for (const object of blueprint.objects) {
    const list = grouped.get(object.layer) ?? [];
    list.push(`${names[object.asset] ?? object.asset} at ${Math.round(object.theta)}°`);
    grouped.set(object.layer, list);
  }
  const florals = Array.from(grouped.entries()).map(([layer, items]) => `${layer}: ${items.join(", ")}`).join("; ");
  const machineFacing = `[IDENTITY] high-end faux botanical wreath\n[FORMULA] ${blueprint.formula}; emotional register ${blueprint.emotion}\n[COMPOSITION] 360-degree radial attachment, asymmetrical visual mass, protected silence arc ${blueprint.silenceArc[0]}–${blueprint.silenceArc[1]} degrees\n[PLACEMENT] ${florals}\n[STYLE_DNA] silk florals, latex-coated petals, wired stems, fabric leaves with visible vein structure, subtle artificial construction details, stems integrated into a grapevine base\n[SURFACE] matte petals with slightly uniform edges, semi-gloss foliage with controlled sheen, no fresh-flower translucency\n[ENVIRONMENT] neutral luxury interior, plaster wall or paneled entry, editorial catalog setting\n[LIGHT] soft directional 12pm daylight simulation, studio-quality shadows\n[PHOTOGRAPHY] 85mm editorial lens, shallow but controlled depth of field\n[STYLE] luxury editorial, high-end catalog photography, restoration hardware aesthetic, composed and intentional, premium faux botanical\n[NEGATIVE] no fresh flowers, dew, water droplets, wild garden, outdoor setting, hyper-natural imperfections, floral field styling, bouquet convergence, perfect symmetry, ribbon\n[PARAMS] --style raw --s 150 --q 2 --v 7 --no fresh flowers, dew, water droplets, wild garden, outdoor setting, hyper-natural imperfections, floral field styling`;
  const humanFacing = `Photorealistic ${blueprint.sizeIn}-inch luxury faux botanical wreath in a neutral luxury interior with a plaster wall or paneled entry, composed with ${blueprint.formula.toLowerCase()} movement and deliberately asymmetric visual mass. ${florals}. Silk florals, latex-coated petals, wired stems, fabric leaves with visible vein structure, subtle artificial construction details, stems integrated into a grapevine base, matte petals, semi-gloss foliage, editorial catalog photography, restoration hardware aesthetic, composed and intentional, premium faux botanical. Soft directional 12pm daylight simulation, studio-quality shadows, 85mm editorial lens, shallow but controlled depth of field. --style raw --s 150 --q 2 --v 7 --no fresh flowers, dew, water droplets, wild garden, outdoor setting, hyper-natural imperfections, floral field styling`;
  return { machineFacing, humanFacing };
}
