import { beforeEach, describe, expect, it, vi } from "vitest";

const insertValues = vi.fn(async () => [{ insertId: 44 }]);
const updateWhere = vi.fn(async () => undefined);
const updateSet = vi.fn(() => ({ where: updateWhere }));
const assetSelectResult = vi.fn();
const db = { select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ orderBy: vi.fn(() => ({ limit: assetSelectResult })), limit: assetSelectResult })) })) })), insert: vi.fn(() => ({ values: (payload: unknown) => { const result = insertValues(payload); return Object.assign(Promise.resolve(result), { returning: () => result }); } })), update: vi.fn(() => ({ set: updateSet })) };

vi.mock("./db", () => ({
  getDb: vi.fn(async () => db),
  getUserPlanCode: vi.fn(async () => "studio"),
  hasEntitlement: vi.fn(async () => true),
  listInventoryItems: vi.fn(), countInventoryItems: vi.fn(), saveInventoryBatch: vi.fn(), saveFloralDecision: vi.fn(), listFloralDecisions: vi.fn(),
}));
vi.mock("./storage", () => ({ storagePut: vi.fn(async (key: string) => ({ key, url: `https://storage.example/${key}` })), storageGetSignedUrl: vi.fn() }));
vi.mock("./cometapi", () => ({ assembleMidjourneyPrompt: (prompt: string, parameters?: string) => `${prompt} ${parameters ?? "--raw --exp 5 --q 2 --chaos 10 --stylize 125 --v 7"}`, generateCometRender: vi.fn(async () => ({ taskId: "comet-task-1", imageUrl: "https://cdn.example/generated.png" })), downloadCometImage: vi.fn(async () => ({ buffer: Buffer.from("generated"), contentType: "image/png" })) }));
vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn() }));

import { appRouter } from "./routers";
import { generateCometRender } from "./cometapi";
import type { TrpcContext } from "./_core/context";

const ctx = { user: { id: 7, openId: "admin", email: "admin@example.com", name: "Admin", loginMethod: "manus", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} }, res: {} } as TrpcContext;

describe("scene render handoff", () => {
  beforeEach(() => { vi.clearAllMocks(); assetSelectResult.mockReset(); });

  it("requires an explicit project scope for the render review queue", async () => {
    assetSelectResult.mockResolvedValueOnce([{ id: 99, projectId: 1, kind: "wreath", status: "review" }]);
    const result = await appRouter.createCaller(ctx).render.reviewQueue({ projectId: 1 });
    expect(result).toEqual([{ id: 99, projectId: 1, kind: "wreath", status: "review" }]);
  });

  it("persists the scene index, title, and prompt with an uploaded render", async () => {
    assetSelectResult.mockResolvedValueOnce([{ id: 77, projectId: 1, status: "approved" }]).mockResolvedValueOnce([{ id: 88, projectId: 1, kind: "wreath", status: "approved" }]);
    const result = await appRouter.createCaller(ctx).render.upload({ projectId: 1, kind: "lifestyle", filename: "scene-01.png", mimeType: "image/png", base64: "data:image/png;base64," + "a".repeat(40), sceneIndex: 0, sceneTitle: "The dock at first light", prompt: "A threshold scene prompt" });
    expect(result.status).toBe("review");
    expect(insertValues).toHaveBeenCalledOnce();
    const payload = insertValues.mock.calls[0]?.[0] as { provenance: Record<string, unknown> };
    expect(payload.provenance).toMatchObject({ sceneIndex: 0, sceneTitle: "The dock at first light", prompt: "A threshold scene prompt" });
  });

  it("accepts a dedicated wreath render without scene provenance", async () => {
    assetSelectResult.mockResolvedValueOnce([{ id: 77, projectId: 1, status: "approved" }]);
    const result = await appRouter.createCaller(ctx).render.upload({ projectId: 1, kind: "wreath", filename: "wreath-anchor.png", mimeType: "image/png", base64: "data:image/png;base64," + "b".repeat(40), prompt: "Wreath-only anchor prompt" });
    expect(result).toMatchObject({ status: "review", kind: "wreath" });
    const payload = insertValues.mock.calls[0]?.[0] as { kind: string; provenance: Record<string, unknown> };
    expect(payload.kind).toBe("wreath");
    expect(payload.provenance).toMatchObject({ prompt: "Wreath-only anchor prompt" });
    expect(payload.provenance).not.toHaveProperty("sceneIndex");
  });

  it("blocks a wreath upload when the Blueprint is not approved", async () => {
    assetSelectResult.mockResolvedValueOnce([]);
    await expect(appRouter.createCaller(ctx).render.upload({ projectId: 1, kind: "wreath", filename: "wreath.png", mimeType: "image/png", base64: "data:image/png;base64," + "c".repeat(40) })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });

  it("blocks a lifestyle upload when the approved wreath anchor is missing", async () => {
    assetSelectResult.mockResolvedValueOnce([{ id: 77, projectId: 1, status: "approved" }]).mockResolvedValueOnce([]);
    await expect(appRouter.createCaller(ctx).render.upload({ projectId: 1, kind: "lifestyle", filename: "scene.png", mimeType: "image/png", base64: "data:image/png;base64," + "d".repeat(40), sceneIndex: 0 })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });

  it("rejects an unsupported render MIME type", async () => {
    assetSelectResult.mockResolvedValueOnce([{ id: 77, projectId: 1, status: "approved" }]);
    await expect(appRouter.createCaller(ctx).render.upload({ projectId: 1, kind: "wreath", filename: "wreath.svg", mimeType: "image/svg+xml", base64: "data:image/svg+xml;base64," + "e".repeat(40) })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("sanitizes uploaded filenames before storage", async () => {
    assetSelectResult.mockResolvedValueOnce([{ id: 77, projectId: 1, status: "approved" }]);
    await appRouter.createCaller(ctx).render.upload({ projectId: 1, kind: "wreath", filename: "../wreath final.png", mimeType: "image/png", base64: "data:image/png;base64," + "f".repeat(40) });
    expect(vi.mocked((await import("./storage")).storagePut)).toHaveBeenCalledWith(expect.stringContaining("wreath_final.png"), expect.anything(), "image/png");
  });

  it("persists Comet provenance when generating a render", async () => {
    assetSelectResult.mockResolvedValueOnce([{ id: 1 }]).mockResolvedValueOnce([{ id: 91, projectId: 1, url: "https://storage.example/source.png" }]);
    const result = await appRouter.createCaller(ctx).render.generateComet({ projectId: 1, kind: "lifestyle", operation: "imagine", model: "mj-fast-imagine", mode: "FAST", prompt: "A distinct scene", sourceAssetId: 91, sceneIndex: 1, sceneTitle: "The garden room" });
    expect(result.status).toBe("review");
    const payload = insertValues.mock.calls[0]?.[0] as { provenance: Record<string, unknown> };
    expect(payload.provenance).toMatchObject({ provider: "cometapi", operation: "imagine", model: "mj-fast-imagine", sceneIndex: 1, sceneTitle: "The garden room", parentAssetId: 91, reviewDecision: "pending" });
    expect(payload.provenance.submittedPrompt).toContain("--v 7");
  });

  it("retains Comet review history when approving a generated asset", async () => {
    assetSelectResult.mockResolvedValueOnce([{ id: 92, kind: "lifestyle", provenance: { provider: "cometapi", reviewHistory: [{ event: "completed" }] } }]);
    const result = await appRouter.createCaller(ctx).render.review({ assetId: 92, status: "approved" });
    expect(result.status).toBe("approved");
    const update = updateSet.mock.calls[0]?.[0] as { provenance: { reviewHistory: Array<{ event: string }> } };
    expect(update.provenance.reviewHistory.map((event) => event.event)).toEqual(["completed", "approved"]);
  });

  it("moves a returned scene from review to approved", async () => {
    assetSelectResult.mockResolvedValueOnce([{ id: 44, kind: "lifestyle", provenance: { prompt: "A threshold scene prompt" } }]);
    const result = await appRouter.createCaller(ctx).render.review({ assetId: 44, status: "approved" });
    expect(result).toMatchObject({ assetId: 44, status: "approved", generatedScenePrompts: null });
    expect(updateWhere).toHaveBeenCalledOnce();
  });

  it("generates lifestyle prompts when the wreath render is approved", async () => {
    assetSelectResult.mockResolvedValueOnce([{ id: 45, kind: "wreath", provenance: { prompt: "Approved ivory and sage wreath anchor" } }]);
    const result = await appRouter.createCaller(ctx).render.review({ assetId: 45, status: "approved" });
    expect(result.generatedScenePrompts).toHaveLength(3);
    expect(result.generatedScenePrompts?.[0]?.prompt).toContain("Approved ivory and sage wreath anchor");
    expect(result.generatedScenePrompts?.[0]?.prompt).toContain("Lifestyle scene");
    expect(updateWhere).toHaveBeenCalledOnce();
    expect(updateSet.mock.calls[0]?.[0]).toMatchObject({ status: "approved", provenance: expect.objectContaining({ generatedScenePrompts: expect.any(Array) }) });
    expect(vi.mocked(generateCometRender)).not.toHaveBeenCalled();
  });
});
