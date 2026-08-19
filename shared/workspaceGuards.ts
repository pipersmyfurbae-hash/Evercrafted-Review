export function isValidProjectId(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

export function hasFullStudioAccess(role: string | undefined, canUploadRender: boolean | undefined): boolean {
  return role === "admin" || canUploadRender === true;
}

export function canManuallyRenderWreath(input: { hasActiveProject: boolean; anchorLocked: boolean; blueprintApproved: boolean }): boolean {
  return input.hasActiveProject && input.anchorLocked && input.blueprintApproved;
}
