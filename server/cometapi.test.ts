import { afterEach, describe, expect, it, vi } from "vitest";
import { generateCometRender } from "./cometapi";

describe("CometAPI render adapter", () => {
  afterEach(() => vi.restoreAllMocks());

  it("submits imagine through the Midjourney-compatible route and polls the task", async () => {
    process.env.COMETAPI_API_KEY = "test-key";
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ task_id: "task-123" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: "success", imageUrl: "https://cdn.example/scene.png" }), { status: 200 }));

    const result = await generateCometRender({ operation: "imagine", prompt: "A distinct scene", mode: "FAST" }, { pollIntervalMs: 0, maxPolls: 1 });
    expect(result).toMatchObject({ taskId: "task-123", status: "success", imageUrl: "https://cdn.example/scene.png" });
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.cometapi.com/mj/submit/imagine");
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ headers: expect.objectContaining({ Authorization: "Bearer test-key" }) });
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({ prompt: "A distinct scene", botType: "MID_JOURNEY", accountFilter: { modes: ["FAST"] } });
    expect(fetchMock.mock.calls[1]?.[0]).toBe("https://api.cometapi.com/mj/task/task-123/fetch");
  });

  it("appends the production Midjourney parameter profile to the initial imagine prompt", async () => {
    process.env.COMETAPI_API_KEY = "test-key";
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ task_id: "imagine-params" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: "success", imageUrl: "https://cdn.example/parameterized.png" }), { status: 200 }));

    await generateCometRender({ operation: "imagine", model: "mj-fast-imagine", prompt: "A wreath in a quiet room", mode: "FAST" }, { pollIntervalMs: 0, maxPolls: 1 });
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.prompt).toBe("A wreath in a quiet room --raw --exp 5 --q 2 --chaos 10 --stylize 125 --v 7");
  });

  it("recognizes the live CometAPI result task ID and finish-time response", async () => {
    process.env.COMETAPI_API_KEY = "test-key";
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: 1, description: "Submission successful", result: "1787066818776968" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "1787066818776968", progress: "100%", finishTime: 1787066819999, imageUrl: "https://cdn.example/live.png" }), { status: 200 }));
    const result = await generateCometRender({ operation: "imagine", prompt: "Captured shape" }, { pollIntervalMs: 0, maxPolls: 1 });
    expect(result).toMatchObject({ taskId: "1787066818776968", imageUrl: "https://cdn.example/live.png" });
  });

  it("includes the provider task ID when polling exceeds the configured window", async () => {
    process.env.COMETAPI_API_KEY = "test-key";
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ result: "long-running-1" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "long-running-1", progress: "0%", finishTime: 0, imageUrl: "" }), { status: 200 }));
    await expect(generateCometRender({ operation: "imagine", prompt: "Long running" }, { pollIntervalMs: 0, maxPolls: 1 })).rejects.toThrow(/long-running-1/);
  });

  it("recognizes numeric task IDs and nested output URLs from provider responses", async () => {
    process.env.COMETAPI_API_KEY = "test-key";
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { taskId: 98765 } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ state: "completed", result: { images: [{ download_url: "https://cdn.example/nested.png" }] } }), { status: 200 }));
    const result = await generateCometRender({ operation: "imagine", prompt: "Nested response" }, { pollIntervalMs: 0, maxPolls: 1 });
    expect(result).toMatchObject({ taskId: "98765", imageUrl: "https://cdn.example/nested.png" });
  });

  it("includes a safe response summary when no task or image is returned", async () => {
    process.env.COMETAPI_API_KEY = "test-key";
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(JSON.stringify({ accepted: false, message: "invalid prompt" }), { status: 200 }));
    await expect(generateCometRender({ operation: "imagine", prompt: "Invalid" })).rejects.toThrow(/invalid prompt/);
  });

  it("builds an upscale child task from the source task and selected index", async () => {
    process.env.COMETAPI_API_KEY = "test-key";
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ task_id: "upscale-1" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: "success", data: [{ url: "https://cdn.example/upscaled.png" }] }), { status: 200 }));

    const result = await generateCometRender({ operation: "upscale", sourceTaskId: "source-1", index: 2 });
    expect(result.imageUrl).toBe("https://cdn.example/upscaled.png");
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({ model: "mj-fast-upscale-subtle", input: { task_id: "source-1", index: 2 } });
  });
});
