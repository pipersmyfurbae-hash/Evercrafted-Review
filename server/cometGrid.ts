import sharp from "sharp";

export type CometGridPanel = {
  panelIndex: number;
  buffer: Buffer;
  width: number;
  height: number;
};

export function buildCometPanelProvenance(parent: Record<string, unknown>, parentAssetId: number, panel: Pick<CometGridPanel, "panelIndex" | "width" | "height">) {
  return { ...parent, gridSource: false, parentAssetId, panelIndex: panel.panelIndex, panelCount: 4, width: panel.width, height: panel.height, reviewDecision: "pending" };
}

/** Split a Midjourney-style 2x2 grid into reading-order panels. */
export async function splitCometGrid(buffer: Buffer, enabled: boolean): Promise<CometGridPanel[]> {
  if (!enabled) return [];
  const metadata = await sharp(buffer).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  // The supported provider shape is Midjourney's square 2x2 imagine grid.
  // Reject non-square images so ordinary portrait/landscape results are not silently cropped.
  const aspectRatio = width / Math.max(1, height);
  if (width < 512 || height < 512 || aspectRatio < 0.95 || aspectRatio > 1.05) return [];
  const halfWidth = Math.floor(width / 2);
  const halfHeight = Math.floor(height / 2);
  const rightWidth = width - halfWidth;
  const bottomHeight = height - halfHeight;
  const crops = [
    { panelIndex: 1, left: 0, top: 0, width: halfWidth, height: halfHeight },
    { panelIndex: 2, left: halfWidth, top: 0, width: rightWidth, height: halfHeight },
    { panelIndex: 3, left: 0, top: halfHeight, width: halfWidth, height: bottomHeight },
    { panelIndex: 4, left: halfWidth, top: halfHeight, width: rightWidth, height: bottomHeight },
  ];
  return Promise.all(crops.map(async (crop) => ({
    panelIndex: crop.panelIndex,
    width: crop.width,
    height: crop.height,
    buffer: await sharp(buffer).extract(crop).png().toBuffer(),
  })));
}

export function isMidjourneyGridOperation(operation: string): boolean {
  // Imagine is the verified four-panel response shape used by this studio.
  // Edit operations remain whole-image assets until their provider shapes are verified.
  return operation === "imagine";
}
