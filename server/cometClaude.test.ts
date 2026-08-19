import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const validStory = {
  title: "The Hour After the Last Guest Left",
  body: "A literary story in five movements with specific sensory detail and a quiet ending.",
  metadata: { atmosphere: "The Hour After the Last Guest Left", collectionName: "After the Door Closes", movement: "slow return", silenceArc: [45, 135] },
  beats: Array.from({ length: 7 }, (_, index) => ({
    name: `Beat ${index + 1}`,
    role: "narrative moment",
    setting: "A specific remembered room with environmental detail.",
    camera: `Position: ${index % 2 ? "three-quarter" : "eye-level"}; Lens: ${index % 2 ? "85mm portrait" : "35mm wide"}; Distance: medium; Depth of field: shallow`,
    light: `Quality: diffuse; Direction: side; Time: ${index % 2 ? "candlelight" : "late afternoon"}; Temperature: warm amber`,
    prompt: `BEAT ${index + 1}: a paste-ready cinematic prompt with lens, light, color grade, Evercrafted Style DNA, --ar 4:5, negative prompts`,
  })),
};

describe("CometAPI Claude Story Genesis adapter", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    process.env.COMETAPI_API_KEY = "test-key";
    delete process.env.COMETAPI_STORY_MODEL;
  });

  it("calls CometAPI chat completions with Claude Sonnet 5 and returns validated beats", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(validStory) } }] }), { status: 200 }));
    const { generateClaudeStory } = await import("./cometClaude");
    const result = await generateClaudeStory({ memory: "A remembered doorway after the last guest leaves.", location: "Columbus", honoree: "A beloved house", profile: {} });
    expect(result.beats).toHaveLength(7);
    expect(fetchMock).toHaveBeenCalledWith("https://api.cometapi.com/v1/chat/completions", expect.objectContaining({ method: "POST" }));
    const request = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(request.model).toBe("claude-sonnet-5");
    expect(request.response_format).toEqual({ type: "json_object" });
    expect(request.messages[0].content).toContain("Story Genesis Engine");
  });

  it("rejects responses that do not contain seven to nine beats", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ ...validStory, beats: validStory.beats.slice(0, 3) }) } }] }), { status: 200 }));
    const { generateClaudeStory } = await import("./cometClaude");
    await expect(generateClaudeStory({ memory: "Memory", location: "Home", honoree: "Someone", profile: {} })).rejects.toThrow("requires 7–9");
  });
});
