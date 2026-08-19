import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { buildCometPanelProvenance, splitCometGrid } from "./cometGrid";

describe("splitCometGrid", () => {
  it("splits a 2x2 provider grid into four PNG panels in reading order", async () => {
    const source = await sharp({
      create: { width: 800, height: 800, channels: 3, background: { r: 20, g: 20, b: 20 } },
    }).png().toBuffer();

    const panels = await splitCometGrid(source, true);

    expect(panels).toHaveLength(4);
    expect(panels.map((panel) => panel.panelIndex)).toEqual([1, 2, 3, 4]);
    expect(panels.every((panel) => panel.width === 400 && panel.height === 400)).toBe(true);
    await expect(Promise.all(panels.map((panel) => sharp(panel.buffer).metadata()))).resolves.toSatisfy((metadata) => metadata.every((entry) => entry.format === "png"));
  });

  it("builds child provenance that retains the source task and parent grid", () => {
    expect(buildCometPanelProvenance({ taskId: "provider-1", sourceTaskId: "source-7", gridSource: true }, 42, { panelIndex: 3, width: 400, height: 400 })).toMatchObject({ taskId: "provider-1", sourceTaskId: "source-7", gridSource: false, parentAssetId: 42, panelIndex: 3, panelCount: 4, width: 400, height: 400, reviewDecision: "pending" });
  });

  it("does not crop when splitting is disabled", async () => {
    const source = await sharp({
      create: { width: 800, height: 800, channels: 3, background: { r: 20, g: 20, b: 20 } },
    }).png().toBuffer();

    await expect(splitCometGrid(source, false)).resolves.toEqual([]);
  });
});
