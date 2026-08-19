import { describe, expect, it } from "vitest";

describe("CometAPI credentials", () => {
  it("authenticates against the CometAPI model list endpoint", async () => {
    const apiKey = process.env.COMETAPI_API_KEY;
    expect(apiKey, "COMETAPI_API_KEY must be configured for this credential check").toBeTruthy();

    const response = await fetch("https://api.cometapi.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    expect(response.ok, `CometAPI model list request failed with ${response.status}`).toBe(true);
    const payload = await response.json() as { data?: unknown };
    expect(payload).toHaveProperty("data");
  }, 20_000);
});
