import { describe, expect, it } from "vitest";
import { firstAvailableIncompleteStage, resolveGuidedStages } from "../shared/guidedJourney";

describe("guided journey stage contract", () => {
  it("blocks downstream stages until the required approval exists", () => {
    const stages = resolveGuidedStages({ hasMemory: true, essenceApproved: false, storyApproved: false, recipeLocked: false, blueprintApproved: false, wreathReady: false });
    expect(stages.find((stage) => stage.key === "essence")).toMatchObject({ available: true, complete: false });
    expect(stages.find((stage) => stage.key === "story")).toMatchObject({ available: false, blockedReason: "Approve Your Essence first" });
    expect(stages.find((stage) => stage.key === "blueprint")).toMatchObject({ available: false, blockedReason: "Approve Story Genesis first" });
    expect(firstAvailableIncompleteStage(stages)).toBe("essence");
  });

  it("does not trust stale downstream artifacts before Story approval", () => {
    const stages = resolveGuidedStages({ hasMemory: true, essenceApproved: true, storyApproved: false, recipeLocked: true, blueprintApproved: true, wreathReady: true });
    expect(stages.find((stage) => stage.key === "florals")).toMatchObject({ available: false, complete: false });
    expect(stages.find((stage) => stage.key === "blueprint")).toMatchObject({ available: false, complete: false });
    expect(stages.find((stage) => stage.key === "wreath")).toMatchObject({ available: false, complete: false });
    expect(firstAvailableIncompleteStage(stages)).toBe("story");
  });

  it("resolves the next incomplete stage after persisted approvals", () => {
    const stages = resolveGuidedStages({ hasMemory: true, essenceApproved: true, storyApproved: true, recipeLocked: true, blueprintApproved: false, wreathReady: false });
    expect(firstAvailableIncompleteStage(stages)).toBe("blueprint");
    expect(stages.find((stage) => stage.key === "florals")).toMatchObject({ available: true, complete: true });
    expect(stages.find((stage) => stage.key === "wreath")).toMatchObject({ available: false, blockedReason: "Approve the Blueprint first" });
  });
});
