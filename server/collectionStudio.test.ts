import { describe, expect, it, vi } from "vitest";

const insertValues = vi.fn();
const db = {
  insert: vi.fn(() => ({
    values: (payload: unknown) => {
      const result = insertValues(payload);
      return Object.assign(Promise.resolve(result), { returning: () => result });
    },
  })),
};

vi.mock("./db", () => ({
  getDb: vi.fn(async () => db),
}));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const ctx = {
  user: { id: 7, openId: "user-7", email: "user@example.com", name: "User", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: { protocol: "https", headers: {} },
  res: {},
} as TrpcContext;

describe("Collection Studio persistence", () => {
  it("creates a project and draft lookbook from the build brief", async () => {
    insertValues.mockReset();
    insertValues.mockResolvedValueOnce([{ insertId: 101 }]).mockResolvedValueOnce([{ insertId: 202 }]);

    const result = await appRouter.createCaller(ctx).memory.createCollection({
      brief: "A late summer lake house at dusk with ivory roses and quiet sage.",
      title: "The lake house in July",
      season: "Late summer",
      studio: "Evercrafted",
      notes: "Keep the open side clear.",
      palette: ["ivory", "sage", "warm stone"],
      wreathAnchor: "",
    });

    expect(result.projectId).toBe(101);
    expect(result.lookbookId).toBe(202);
    expect(result.workspacePath).toBe("/workspace?projectId=101");
    expect(insertValues).toHaveBeenCalledTimes(2);
    expect(insertValues.mock.calls[0]?.[0]).toMatchObject({ userId: 7, name: "The lake house in July", status: "intake" });
    expect(insertValues.mock.calls[1]?.[0]).toMatchObject({ projectId: 101, title: "The lake house in July", status: "draft" });
    expect(insertValues.mock.calls[1]?.[0].content).toMatchObject({ brief: "A late summer lake house at dusk with ivory roses and quiet sage.", season: "Late summer", source: "collection-studio" });
  });
});
