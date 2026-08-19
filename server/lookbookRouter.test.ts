import { beforeEach, describe, expect, it, vi } from "vitest";

const selectResult = vi.fn();
const updateWhere = vi.fn(async () => undefined);
const insertValues = vi.fn(async () => [{ insertId: 12 }]);
const db = {
  select: vi.fn(() => ({
    from: vi.fn(() => ({
      innerJoin: vi.fn(() => ({
        where: vi.fn(() => ({ limit: selectResult, orderBy: vi.fn(() => ({ limit: selectResult })) })),
      })),
      where: vi.fn(() => ({ limit: selectResult, orderBy: vi.fn(() => ({ limit: selectResult })) })),
    })),
  })),
  update: vi.fn(() => ({ set: vi.fn(() => ({ where: updateWhere })) })),
  insert: vi.fn(() => ({
    values: (payload: unknown) => {
      const result = insertValues(payload);
      return Object.assign(Promise.resolve(result), { returning: () => result });
    },
  })),
};

vi.mock("./db", () => ({
  getDb: vi.fn(async () => db),
  getUserPlanCode: vi.fn(async () => "studio"),
  hasEntitlement: vi.fn(async () => true),
  listInventoryItems: vi.fn(), countInventoryItems: vi.fn(), saveInventoryBatch: vi.fn(), saveFloralDecision: vi.fn(), listFloralDecisions: vi.fn(),
}));
vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn() }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(), storagePut: vi.fn() }));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const ctx = { user: { id: 7, openId: "user-7", email: "user@example.com", name: "User", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} }, res: {} } as TrpcContext;

describe("lookbook sharing and Workspace read contracts", () => {
  beforeEach(() => { vi.clearAllMocks(); selectResult.mockReset(); updateWhere.mockReset(); updateWhere.mockResolvedValue(undefined); insertValues.mockReset(); insertValues.mockResolvedValue([{ insertId: 12 }]); });

  it("returns the authenticated user’s current project", async () => {
    selectResult.mockResolvedValueOnce([{ id: 12, userId: 7, title: "The room after rain" }]);
    const result = await appRouter.createCaller(ctx).memory.currentProject();
    expect(result).toMatchObject({ id: 12, userId: 7 });
  });

  it("returns the newest persisted intake for the authenticated project", async () => {
    const intake = { id: 33, projectId: 12, version: 1, memory: "A warm memory of a summer kitchen.", occasion: "A person I carry", honoree: "Mother", location: "Savannah", whoWasThere: "Family", timeOfDay: "Golden hour" };
    selectResult.mockResolvedValueOnce([{ id: 12, userId: 7 }]).mockResolvedValueOnce([intake]);
    const result = await appRouter.createCaller(ctx).memory.latestIntake({ projectId: 12 });
    expect(result).toMatchObject({ id: 33, projectId: 12, memory: intake.memory });
  });

  it("persists the main-page memory as a project intake handoff", async () => {
    insertValues.mockResolvedValueOnce([{ insertId: 12 }]).mockResolvedValueOnce([{ insertId: 33 }]);
    const result = await appRouter.createCaller(ctx).memory.createMemoryProject({ memory: "A warm memory of a summer kitchen where the windows stayed open after dinner and everyone lingered.", occasion: "A person I carry", honoree: "Mother", location: "Savannah", whoWasThere: "Family", timeOfDay: "Golden hour", guided: false, name: "Summer kitchen memory" });
    expect(result).toMatchObject({ projectId: 12, intakeId: 33, workspacePath: "/workspace?projectId=12" });
    expect(String(insertValues.mock.calls[0]?.[0]?.name)).toBe("A warm memory of a summer kitchen where the windows stayed open after dinner and…");
    expect(db.insert).toHaveBeenCalledTimes(2);
  });

  it("bootstraps an authenticated project when none exists", async () => {
    selectResult.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: 12, userId: 7, name: "Untitled memory", status: "intake" }]);
    const result = await appRouter.createCaller(ctx).memory.ensureProject({ name: "Untitled memory" });
    expect(result).toMatchObject({ id: 12, userId: 7, status: "intake" });
    expect(db.insert).toHaveBeenCalledOnce();
  });

  it("returns lookbooks belonging to the authenticated user’s projects", async () => {
    selectResult.mockResolvedValueOnce([{ id: 12 }]).mockResolvedValueOnce([{ id: 44, projectId: 12, title: "The room after rain", status: "draft" }]);
    const result = await appRouter.createCaller(ctx).lookbook.mine();
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 44, projectId: 12 });
  });

  it("ensures a project-owned draft lookbook exists and is idempotent", async () => {
    selectResult.mockResolvedValueOnce([{ id: 12, userId: 7 }]).mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: 44, projectId: 12, title: "The room after rain", status: "draft" }]);
    const result = await appRouter.createCaller(ctx).lookbook.ensure({ projectId: 12, slug: "room-after-rain", title: "The room after rain" });
    expect(result).toMatchObject({ id: 44, projectId: 12, title: "The room after rain" });
    expect(db.insert).toHaveBeenCalledOnce();
  });

  it("generates a share token and promotes the lookbook to shareable", async () => {
    selectResult.mockResolvedValueOnce([{ id: 12 }]);
    const result = await appRouter.createCaller(ctx).lookbook.generateShareLink({ id: 12 });
    expect(result.status).toBe("shareable");
    expect(result.path).toMatch(/^\/lookbook\/share\/[a-f0-9]{32}$/);
    expect(db.update).toHaveBeenCalledOnce();
    expect(updateWhere).toHaveBeenCalledOnce();
  });

  it("rejects share generation for a lookbook the user does not own", async () => {
    selectResult.mockResolvedValueOnce([]);
    await expect(appRouter.createCaller(ctx).lookbook.generateShareLink({ id: 12 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("returns shareable lookbooks by token and hides drafts", async () => {
    selectResult.mockResolvedValueOnce([{ id: 12, status: "shareable", shareToken: "abc123token456789" }]);
    const shared = await appRouter.createCaller(ctx).lookbook.byShareToken({ token: "abc123token456789" });
    expect(shared?.shareToken).toBe("abc123token456789");

    selectResult.mockResolvedValueOnce([{ id: 12, status: "draft", shareToken: "abc123token456789" }]);
    const draft = await appRouter.createCaller(ctx).lookbook.byShareToken({ token: "abc123token456789" });
    expect(draft).toBeNull();
  });

  it("rejects content updates for a lookbook outside the user’s projects", async () => {
    selectResult.mockResolvedValueOnce([]);
    await expect(appRouter.createCaller(ctx).lookbook.update({ id: 99, title: "Unauthorized edit" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows an owner to move a lookbook into the published state", async () => {
    selectResult.mockResolvedValueOnce([{ id: 12 }]);
    const result = await appRouter.createCaller(ctx).lookbook.setStatus({ id: 12, status: "published" });
    expect(result).toEqual({ id: 12, status: "published" });
    expect(db.update).toHaveBeenCalled();
  });

  it("reads persisted Story Genesis beats for the authenticated lifestyle surface", async () => {
    const story = { id: 31, projectId: 12, version: 1, status: "awaiting_approval", title: "The room after rain", body: "A long-form story", beats: [{ name: "The threshold", role: "establishing world", setting: "A quiet entry", camera: "35mm wide", light: "dawn", prompt: "Cinematic threshold scene" }] };
    selectResult.mockResolvedValueOnce([{ id: 12, userId: 7 }]).mockResolvedValueOnce([story]);
    const result = await appRouter.createCaller(ctx).memory.latestStory({ projectId: 12 });
    expect(result?.beats).toEqual(story.beats);
    expect(result?.title).toBe("The room after rain");
  });
});
