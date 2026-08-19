import type { EcrScene } from "./rendering";

export type EcrPatch = { patchVersion: "1.0"; targetEcrHash: string; override: Array<{ target: { id: string }; changes: { rotation?: { from: number; to: number }; scale?: { from: number; to: number }; theta?: { from: number; to: number } } }> };

export function applyEcrPatch(scene: EcrScene, patch: EcrPatch): EcrScene {
  if (patch.targetEcrHash !== scene.blueprintHash) throw new Error("ECR patch target hash does not match the scene.");
  const next = structuredClone(scene);
  for (const change of patch.override) {
    const object = next.objects.find((candidate) => candidate.id === change.target.id);
    if (!object) throw new Error(`ECR patch target ${change.target.id} was not found.`);
    if (change.changes.rotation) object.rotation = change.changes.rotation.to;
    if (change.changes.scale) object.scale = change.changes.scale.to;
    if (change.changes.theta) {
      const theta = change.changes.theta.to;
      if (theta < 0 || theta >= 360) throw new Error("ECR patch theta must be between 0 and 359 degrees.");
      object.theta = theta;
    }
  }
  return next;
}

export function buildEcrPackage(scene: EcrScene, manifestSlice: unknown[], blueprintId: string) {
  return {
    packageVersion: "1.1",
    files: {
      "scene.ecr.json": scene,
      "assets.manifest": manifestSlice,
      "dependencies.lock": { ecrPackage: "1.1", dependencies: { blueprint: { id: blueprintId, hash: scene.blueprintHash }, assetManifestVersion: scene.dependencies.assetManifestVersion, floralCanonVersion: scene.dependencies.floralCanonVersion } },
      "render.profile": scene.renderProfile,
    },
  };
}
