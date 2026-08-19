import { describe, expect, it } from "vitest";
import { canManuallyRenderWreath, isValidProjectId } from "../shared/workspaceGuards";

describe("Workspace project guard", () => {
  it("accepts only positive integer project IDs", () => {
    expect(isValidProjectId(1)).toBe(true);
    expect(isValidProjectId(42)).toBe(true);
  });

  it("rejects missing and invalid project IDs", () => {
    expect(isValidProjectId(undefined)).toBe(false);
    expect(isValidProjectId(null)).toBe(false);
    expect(isValidProjectId(0)).toBe(false);
    expect(isValidProjectId(-1)).toBe(false);
    expect(isValidProjectId(1.5)).toBe(false);
    expect(isValidProjectId("1")).toBe(false);
  });

  it("requires explicit blueprint approval before manual wreath rendering", () => {
    expect(canManuallyRenderWreath({ hasActiveProject: false, anchorLocked: true, blueprintApproved: true })).toBe(false);
    expect(canManuallyRenderWreath({ hasActiveProject: true, anchorLocked: false, blueprintApproved: true })).toBe(false);
    expect(canManuallyRenderWreath({ hasActiveProject: true, anchorLocked: true, blueprintApproved: false })).toBe(false);
    expect(canManuallyRenderWreath({ hasActiveProject: true, anchorLocked: true, blueprintApproved: true })).toBe(true);
  });
});
