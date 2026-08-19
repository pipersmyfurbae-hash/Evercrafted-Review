import { beforeEach, describe, expect, it, vi } from "vitest";
import { ENV } from "./_core/env";
import { notifyOwner } from "./_core/notification";

describe("owner notification workflow", () => {
  beforeEach(() => {
    ENV.forgeApiUrl = "https://forge.example";
    ENV.forgeApiKey = "test-key";
    vi.restoreAllMocks();
  });

  it("rejects empty notification payloads before dispatch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(notifyOwner({ title: " ", content: "content" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns true when the notification service accepts the request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(notifyOwner({ title: "Render ready", content: "A reviewed render is ready." })).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("SendNotification"), expect.objectContaining({ method: "POST", headers: expect.objectContaining({ authorization: "Bearer test-key" }) }));
  });

  it("returns false when the upstream service rejects the request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("temporarily unavailable", { status: 503, statusText: "Unavailable" }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(notifyOwner({ title: "Render ready", content: "A reviewed render is ready." })).resolves.toBe(false);
  });
});
