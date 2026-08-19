import { validateStoryGrounding } from "../shared/storyGrounding";

const COMETAPI_BASE_URL = "https://api.cometapi.com";
const DEFAULT_MODEL = "claude-sonnet-5";

export type StoryGenesisInput = {
  memory: string;
  location: string;
  honoree: string;
  profile?: unknown;
};

export type StoryGenesisOutput = {
  title: string;
  body: string;
  metadata: {
    atmosphere: string;
    collectionName: string;
    movement: string;
    silenceArc: number[];
  };
  grounding: import("../shared/storyGrounding").StoryGrounding;
  designSignals: import("../shared/storyGrounding").StoryDesignSignals;
  beats: Array<{
    name: string;
    role: string;
    setting: string;
    camera: string;
    light: string;
    prompt: string;
  }>;
};

const systemPrompt = `You are Evercrafted's Story Genesis Engine running on Claude Sonnet 5. The submitted memory is the only source of biographical fact. Return ONLY valid JSON matching the requested schema.

Produce two separate outputs. First, write a 600–800 word Memory Story in five movements. It may be poetic and emotionally deep, but it may not invent deaths, relationships, events, places, rituals, time periods, actions, dialogue, personal history, specific florals, inventory, wreath-making, or hanging unless the client supplied that detail. Preserve the client's point of view and clearly distinguish source-grounded details from interpretation. Never turn the memory into a fictional product story.

Second, produce Structured Design Signals for downstream systems. Signals may describe emotion, movement, intensity, atmosphere, sensory evidence, symbolic themes, palette direction, material qualities, directional-flow character, focal character, negative-space meaning, and avoidances. Signals must not select inventory, assign floral roles or counts, choose materials, or specify Blueprint geometry.

The beats are story-grounded cinematic moments only. They must not introduce unsupported biography or floral/composition instructions. No beat may contain floral recipe, inventory, focal/secondary/bridge/greenery roles, stem counts, clock positions, clusters, open arcs, Blueprint instructions, or wreath construction unless directly present in the submitted memory. Include camera and light language for visual storytelling, preserve the boundary between story discovery and downstream design, and return a concise set of 3–5 beats, preferably 5 when the memory supports it.

Return grounding evidence with sourceDetails, interpretations, unsupportedClaims, majorUnsupportedClaims, and approvalEligible. Any major unsupported biographical claim must make approvalEligible false. Never include cherry blossoms, pussy willow, dried wheat, or sunflowers unless the client explicitly mentioned them; do not silently invent any other material. The client must approve the source-grounded story before Inventory Weaver runs.`;

const storySchema = {
  title: "string",
  body: "string",
  metadata: {
    atmosphere: "string",
    collectionName: "string",
    movement: "string",
    silenceArc: ["number", "number"],
  },
  grounding: {
    sourceDetails: ["string"], interpretations: ["string"], unsupportedClaims: ["string"], majorUnsupportedClaims: ["string"], approvalEligible: "boolean",
  },
  designSignals: {
    emotions: ["string"], emotionalMovement: "string", intensity: "number", atmosphere: "string", sensoryEvidence: ["string"], symbolicThemes: ["string"], paletteDirection: ["string"], materialQualities: ["string"], directionalFlowCharacter: "string", focalCharacter: "string", negativeSpaceMeaning: "string", avoidances: ["string"],
  },
  beats: [
    {
      name: "string",
      role: "string",
      setting: "string",
      camera: "string",
      light: "string",
      prompt: "string",
    },
  ],
};

const parseJson = (value: string): unknown => {
  const trimmed = value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  return JSON.parse(trimmed);
};

const validateStory = (value: unknown): StoryGenesisOutput => {
  if (!value || typeof value !== "object") throw new Error("Claude returned a non-object Story Genesis response.");
  const story = value as Partial<StoryGenesisOutput>;
  if (typeof story.title !== "string" || typeof story.body !== "string" || !story.metadata || !story.grounding || !story.designSignals || !Array.isArray(story.beats)) {
    throw new Error("Claude Story Genesis response is missing title, body, metadata, or beats.");
  }
  if (story.beats.length < 3 || story.beats.length > 5) throw new Error(`Claude returned ${story.beats.length} beats; Story Genesis requires 3–5.`);
  for (let index = 0; index < story.beats.length; index += 1) {
    const beat = story.beats[index];
    if (!beat || typeof beat !== "object" || ["name", "role", "setting", "camera", "light", "prompt"].some((key) => typeof (beat as Record<string, unknown>)[key] !== "string")) {
      throw new Error(`Claude beat ${index + 1} is missing required cinematic fields.`);
    }
  }
  const grounding = story.grounding as StoryGenesisOutput["grounding"];
  if (!Array.isArray(grounding.sourceDetails) || !Array.isArray(grounding.interpretations) || !Array.isArray(grounding.unsupportedClaims) || !Array.isArray(grounding.majorUnsupportedClaims) || typeof grounding.approvalEligible !== "boolean") throw new Error("Claude Story Genesis grounding evidence is incomplete.");
  return story as StoryGenesisOutput;
};

export async function generateClaudeStory(input: StoryGenesisInput): Promise<StoryGenesisOutput> {
  const apiKey = process.env.COMETAPI_API_KEY;
  if (!apiKey) throw new Error("COMETAPI_API_KEY is not configured for Claude Story Genesis.");
  const model = process.env.COMETAPI_STORY_MODEL || DEFAULT_MODEL;
  const response = await fetch(`${COMETAPI_BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0.8,
      max_tokens: 9000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: `${systemPrompt}\n\nJSON shape to return: ${JSON.stringify(storySchema)}` },
        { role: "user", content: JSON.stringify(input) },
      ],
    }),
  });
  if (!response.ok) throw new Error(`CometAPI Claude Story Genesis failed: ${response.status} ${await response.text()}`);
  const payload = await response.json() as { choices?: Array<{ message?: { content?: string | Array<{ text?: string }> } }> };
  const content = payload.choices?.[0]?.message?.content;
  const text = Array.isArray(content) ? content.map((part) => part.text ?? "").join("") : content;
  if (!text) throw new Error("CometAPI Claude returned no Story Genesis content.");
  const story = validateStory(parseJson(text));
  story.grounding = validateStoryGrounding(story.grounding, story.body, story.beats, input.memory);
  return story;
}

export const storyGenesisProvider = { provider: "cometapi", model: DEFAULT_MODEL, endpoint: `${COMETAPI_BASE_URL}/v1/chat/completions` };

export type ClaudeMessage = { role: "system" | "user"; content: string | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string; detail?: "low" | "high" } }> };

// CometAPI's json_object mode is a soft hint, not enforced — the model sometimes wraps its
// JSON response in a markdown code fence (```json ... ```) anyway, which breaks a raw JSON.parse.
function stripJsonFence(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

export async function generateClaudeJson(messages: ClaudeMessage[], maxTokens = 5000) {
  const apiKey = process.env.COMETAPI_API_KEY;
  if (!apiKey) throw new Error("COMETAPI_API_KEY is not configured for Claude Emotional Design Translator.");
  const model = process.env.COMETAPI_STORY_MODEL || DEFAULT_MODEL;
  const response = await fetch(`${COMETAPI_BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, temperature: 0.45, max_tokens: maxTokens, response_format: { type: "json_object" }, messages }),
  });
  if (!response.ok) throw new Error(`CometAPI Claude JSON generation failed: ${response.status} ${await response.text()}`);
  const payload = await response.json() as { choices?: Array<{ message?: { content?: string | Array<{ text?: string }> } }> };
  const rawContent = payload.choices?.[0]?.message?.content;
  if (typeof rawContent === "string") {
    payload.choices![0]!.message!.content = stripJsonFence(rawContent);
  } else if (Array.isArray(rawContent)) {
    payload.choices![0]!.message!.content = rawContent.map((part) => (typeof part.text === "string" ? { ...part, text: stripJsonFence(part.text) } : part));
  }
  return payload;
}
