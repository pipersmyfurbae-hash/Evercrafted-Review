import { describe, expect, it } from "vitest";
import { canUse, getPlanCapabilities } from "./entitlements";
import { isAdminUser } from "./routers";

describe("plan entitlements", () => {
  it("keeps Reader read-only", () => {
    expect(canUse("reader", "canReadStory")).toBe(true);
    expect(canUse("reader", "canDownloadBlueprint")).toBe(false);
    expect(canUse("reader", "canPackageEcr")).toBe(false);
  });
  it("gives Studio the full production capability set", () => {
    expect(getPlanCapabilities("studio")).toEqual({ canReadStory: true, canDownloadBlueprint: true, canPackageEcr: true, canPublishLookbook: true, canUploadRender: true });
  });
  it("covers the Reader/Maker/Studio download matrix", () => {
    expect(canUse("reader", "canReadStory")).toBe(true);
    expect(canUse("reader", "canDownloadBlueprint")).toBe(false);
    expect(canUse("maker", "canDownloadBlueprint")).toBe(true);
    expect(canUse("maker", "canPackageEcr")).toBe(false);
    expect(canUse("studio", "canPackageEcr")).toBe(true);
    expect(canUse("studio", "canPublishLookbook")).toBe(true);
  });
  it("classifies an admin identity as full-access", () => {
    expect(isAdminUser({ role: "admin", openId: "admin-user" })).toBe(true);
    expect(isAdminUser({ role: "user", openId: "regular-user" })).toBe(false);
  });
});
