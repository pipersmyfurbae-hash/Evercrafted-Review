export type PlanCode = "reader" | "maker" | "studio";

export const PLAN_CAPABILITIES: Record<PlanCode, { canReadStory: boolean; canDownloadBlueprint: boolean; canPackageEcr: boolean; canPublishLookbook: boolean; canUploadRender: boolean }> = {
  reader: { canReadStory: true, canDownloadBlueprint: false, canPackageEcr: false, canPublishLookbook: false, canUploadRender: false },
  maker: { canReadStory: true, canDownloadBlueprint: true, canPackageEcr: false, canPublishLookbook: false, canUploadRender: false },
  studio: { canReadStory: true, canDownloadBlueprint: true, canPackageEcr: true, canPublishLookbook: true, canUploadRender: true },
};

export function getPlanCapabilities(plan: PlanCode) { return PLAN_CAPABILITIES[plan]; }
export function canUse(plan: PlanCode, feature: keyof (typeof PLAN_CAPABILITIES)[PlanCode]) { return PLAN_CAPABILITIES[plan][feature]; }
