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
  beats: Array<{
    name: string;
    role: string;
    setting: string;
    camera: string;
    light: string;
    prompt: string;
  }>;
};

const systemPrompt = `You are Evercrafted's Story Genesis Engine running on Claude Sonnet 5. Follow the Story Genesis Engine doctrine exactly: get lost in the world first, perform invisible emotional archaeology, then write the story and derive the cinematic render prompts from what the story reveals. Return ONLY valid JSON matching the requested schema.

Write a 600–800 word literary narrative in five movements: The World, The Character Enters, The Gathering, The Making / The Hanging, and The After. Use present tense where natural, gender-neutral they/them/their pronouns, specific sensory detail, and no product copy. Avoid generic adjectives and cliches. Never describe the wreath as a product. The wreath should arrive naturally as a presence in the world. The ending must land through one small concrete detail rather than explanation.

Return 7–9 distinct cinematic render beats for a wreath-only story. Every beat must be a narrative moment, not a repeated wreath prompt. Across the set include establishing world, character/presence, gathering, completed wreath in situ, detail/texture, and the after. Each beat must include full camera direction with position, lens, distance, and depth of field; full light direction with quality, direction, time, and temperature; a cinematic color grade; an emotional atmosphere; and a paste-ready FULL PROMPT that includes camera, lens, light, color grade, mood, Evercrafted Style DNA, aspect ratio, and negative prompts. No two beats may share the same camera position + lens + time combination. Include at least one wide establishing shot and one macro detail shot. Show the wreath in-frame selectively in 2–4 beats, not every beat.

Locked rules: never include cherry blossoms, pussy willow, dried wheat, or sunflowers; integrate warm LED lights when the setting is interior, dusk, or evening; do not use faux, silk, or grapevine as product descriptors; keep collection direction after the story; and preserve the emotional world rather than forcing a commercial scene.`;

const storySchema = {
  title: "string",
  body: "string",
  metadata: {
    atmosphere: "string",
    collectionName: "string",
    movement: "string",
    silenceArc: ["number", "number"],
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
  if (typeof story.title !== "string" || typeof story.body !== "string" || !story.metadata || !Array.isArray(story.beats)) {
    throw new Error("Claude Story Genesis response is missing title, body, metadata, or beats.");
  }
  if (story.beats.length < 7 || story.beats.length > 9) throw new Error(`Claude returned ${story.beats.length} beats; Story Genesis requires 7–9.`);
  for (let index = 0; index < story.beats.length; index += 1) {
    const beat = story.beats[index];
    if (!beat || typeof beat !== "object" || ["name", "role", "setting", "camera", "light", "prompt"].some((key) => typeof (beat as Record<string, unknown>)[key] !== "string")) {
      throw new Error(`Claude beat ${index + 1} is missing required cinematic fields.`);
    }
  }
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
  return validateStory(parseJson(text));
}

export const storyGenesisProvider = { provider: "cometapi", model: DEFAULT_MODEL, endpoint: `${COMETAPI_BASE_URL}/v1/chat/completions` };

export type ClaudeMessage = { role: "system" | "user"; content: string | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string; detail?: "low" | "high" } }> };

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
  return await response.json() as { choices?: Array<{ message?: { content?: string | Array<{ text?: string }> } }> };
}
