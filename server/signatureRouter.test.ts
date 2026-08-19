import { describe, expect, it, vi, beforeEach } from "vitest";

const job = { id: 42, analysis: { atmosphere: "late autumn" } };
const wreath = { id: 9, status: "published", ecrPackage: { artifact: { key: "signature-wreaths/ecr/42.ecrpkg", mimeType: "application/vnd.evercrafted.ecrpkg+gzip" }, blueprintArtifact: { key: "signature-wreaths/blueprints/42.blueprintpkg", mimeType: "application/vnd.evercrafted.blueprint+gzip" } } };
const draftAnalysis = { confidenceOverall: "medium", flags: [], season: "autumn", style: "woodland", stemCountTotal: 10, clusterCount: 1, form: { shape: "crescent", sizeIn: 24, density: "airy", symmetry: "asymmetric" }, palette: { dominant: "moss", secondary: "cream", accent: "rust" }, emotionProfile: { primary: "belonging", secondary: "longing", atmosphere: "quiet" }, florals: [{ role: "focal", identifiedAs: "cream flower", color: "cream", estimatedStemCount: 10, confidence: "high", skuMatch: "TP-1", skuNeeded: false, placementZones: ["12 o'clock"], flag: null }] };
const updateWhere = vi.fn(async () => undefined);
const setUpdate = vi.fn((payload: Record<string, unknown>) => { if (payload.analysis) job.analysis = payload.analysis; return { where: updateWhere }; });
let createdDraft: Record<string, unknown> | null = null;
const persistedStories: Array<Record<string, unknown>> = [];
const uploadedArtifacts = new Map<string, Uint8Array>();
const insertValues = vi.fn(async (payload: Record<string, unknown>) => { createdDraft = payload; if (Array.isArray(payload.beats) && typeof payload.body === "string") persistedStories.push({ id: 77, ...payload }); return [{ insertId: 77 }]; });
const db = {
  select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(async () => [job]) })), orderBy: vi.fn(() => ({ limit: vi.fn(async () => [job]) })) })) })),
  update: vi.fn(() => ({ set: setUpdate })),
  insert: vi.fn(() => ({
    values: (payload: Record<string, unknown>) => {
      const result = insertValues(payload);
      return Object.assign(Promise.resolve(result), { returning: () => result });
    },
  })),
};

vi.mock("./db", () => ({
  getDb: vi.fn(async () => db),
  getUserPlanCode: vi.fn(async () => "studio"),
  listInventoryItems: vi.fn(), countInventoryItems: vi.fn(), saveInventoryBatch: vi.fn(), saveFloralDecision: vi.fn(), listFloralDecisions: vi.fn(),
}));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(async (key: string) => `https://signed.example/${key}`), storagePut: vi.fn(async (key: string, data: Uint8Array) => { uploadedArtifacts.set(key, data); return { key, url: `https://storage.example/${key}` }; }) }));
vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn(async () => ({ choices: [{ message: { content: JSON.stringify({ title: "The Quiet Hour", body: "The house holds the last blue of morning while someone moves through its rooms with the care of a person learning to stay. The door remembers every season. At the table, stems wait in water, each one carrying a small decision. By afternoon, the circle is complete, and the threshold feels less like an entrance than a promise kept. The finished wreath gathers the room around it without asking for attention. Seven small changes of light carry the story forward, from the first hush to the hand that finally turns the latch.", metadata: { atmosphere: "late autumn", collectionName: "Quiet Hour", movement: "The After", silenceArc: [30, 120] }, beats: Array.from({ length: 7 }, (_, index) => ({ name: `Beat ${index + 1}`, role: "narrative moment", setting: "A quiet threshold", camera: "50mm standard", light: "soft dawn", prompt: "cinematic Evercrafted scene" })) }) } }] })) }));

vi.mock("./cometClaude", async () => { const { invokeLLM: mockedInvokeLLM } = await import("./_core/llm"); return { generateClaudeJson: vi.fn(async (messages: Array<{ role: "system" | "user"; content: string }>) => mockedInvokeLLM({ messages } as never)), generateClaudeStory: vi.fn(async () => ({ title: "The Quiet Hour", body: "The house holds the last blue of morning while someone moves through its rooms with the care of a person learning to stay. The door remembers every season. At the table, stems wait in water, each one carrying a small decision. By afternoon, the circle is complete, and the threshold feels less like an entrance than a promise kept. The finished wreath gathers the room around it without asking for attention. Seven small changes of light carry the story forward, from the first hush to the hand that finally turns the latch.", metadata: { atmosphere: "late autumn", collectionName: "Quiet Hour", movement: "The After", silenceArc: [30, 120] }, beats: Array.from({ length: 7 }, (_, index) => ({ name: `Beat ${index + 1}`, role: "narrative moment", setting: "A quiet threshold", camera: "50mm standard", light: "soft dawn", prompt: "cinematic Evercrafted scene" })) })), storyGenesisProvider: { provider: "cometapi", model: "claude-sonnet-5", endpoint: "https://api.cometapi.com/v1/chat/completions" } }; });
import { appRouter } from "./routers";
import { invokeLLM } from "./_core/llm";
import { listInventoryItems } from "./db";
import type { TrpcContext } from "./_core/context";

const approvedProfileFixture = { emotionalCore: { primaryEmotion: "belonging", secondaryEmotions: ["nostalgia", "calm"], emotionalTemperature: "warm", emotionalWeight: "grounded", emotionalPacing: "slow", emotionalTension: "suspended" }, paletteSystem: { dominantColor: { hex: "#7A3343", name: "berry dusk" }, supportingColors: [{ hex: "#57745D", name: "quiet sage" }, { hex: "#F1E8D5", name: "aged ivory" }], accentColor: { hex: "#B78950", name: "candlelit amber" }, negativeSpaceColor: { hex: "#E8E1D5", name: "silence" }, colorTemperature: "warm", colorSaturation: "muted" }, textureMaterial: { primaryTexture: "weathered silk", secondaryTextures: ["linen", "worn wood"], materialWeight: "delicate", surfaceQuality: "worn", organicVsStructured: 3 }, movementEnergy: { movementArchetype: ["Drift"], directionalEnergy: "toward the threshold", tensionType: "suspended", rhythmQuality: "sparse" }, densitySpace: { overallDensity: "open", focalDensity: "moderate", negativeSpaceRole: "breathing room", layeringDepth: "shallow" }, asymmetryComposition: { asymmetryType: "weighted asymmetry", dominantQuadrant: "top-right", secondaryPull: "lower-left eye pull", silenceZone: "upper-right breathing arc" }, lightQuality: { lightCharacter: "late afternoon", shadowBehavior: "soft", luminosity: "low" }, atmosphere: { atmosphereArchetype: "Inherited Beauty", sensoryAnchors: ["coffee", "lake air"], timeOfDayFeeling: "morning", seasonalResonance: "late summer" }, wreathTranslation: { compositionFormula: "Crescent", ringBands: [{ name: "A", role: "focal", radius: [0, 0.25] }, { name: "B", role: "secondary", radius: [0.25, 0.5] }, { name: "C", role: "filler", radius: [0.5, 0.75] }, { name: "D", role: "greenery", radius: [0.75, 1] }], silenceArc: [45, 135], clusterBehavior: ["weighted", "open"], seasonalDriftTags: ["late summer"], blueprintEmotionTags: ["belonging", "nostalgia", "calm"], sourcingNotes: ["Use approved inventory only"] }, provenance: { modelVersion: "eip-v1", schemaVersion: "eip-v1", generatedAt: 1700000000000, overrides: {} } };

describe("Signature Wreath router integration", () => {
  const ctx = { user: { id: 7, openId: "admin", email: "admin@example.com", name: "Admin", loginMethod: "manus", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} }, res: {} } as TrpcContext;
  beforeEach(() => { updateWhere.mockClear(); db.update.mockClear(); setUpdate.mockClear(); });

  it("rejects floral mapping and prompt compilation without an approved profile", async () => {
    const selectRows = (rows: unknown[]) => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(async () => rows), orderBy: vi.fn(() => ({ limit: vi.fn(async () => rows) })) })) })) });
    db.select.mockImplementationOnce(() => selectRows([{ id: 1, userId: 7 }]) as never).mockImplementationOnce(() => selectRows([{ id: 2, projectId: 1, status: "awaiting_approval", profile: approvedProfileFixture }]) as never);
    await expect(appRouter.createCaller(ctx).memory.floralsFromProfile({ projectId: 1, profileId: 2, seed: 42 })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    db.select.mockImplementationOnce(() => selectRows([{ id: 1, userId: 7 }]) as never).mockImplementationOnce(() => selectRows([{ id: 2, projectId: 1, status: "awaiting_approval", profile: approvedProfileFixture }]) as never).mockImplementationOnce(() => selectRows([{ id: 3, projectId: 1, emotionalProfileId: 2, status: "approved" }]) as never);
    await expect(appRouter.createCaller(ctx).memory.promptFromProfile({ projectId: 1, profileId: 2, storyId: 3, blueprint: {}, inventoryNames: {} })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });

  it("maps florals and compiles prompts from the latest approved profile", async () => {
    const selectRows = (rows: unknown[]) => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(async () => rows), orderBy: vi.fn(() => ({ limit: vi.fn(async () => rows) })) })) })) });
    vi.mocked(listInventoryItems).mockResolvedValueOnce([{ itemId: "stem-1", name: "Ivory Rose", colorHex: "#F1E8D5", colorFamily: "ivory", structuralRole: "focal", emotionTags: ["belonging"], status: "active", approved: true, stemLengthIn: "18" }] as never);
    db.select.mockImplementationOnce(() => selectRows([{ id: 1, userId: 7 }]) as never).mockImplementationOnce(() => selectRows([{ id: 4, projectId: 1, status: "superseded", version: 2, profile: approvedProfileFixture }, { id: 2, projectId: 1, status: "approved", version: 1, profile: approvedProfileFixture }]) as never);
    const floralResult = await appRouter.createCaller(ctx).memory.floralsFromProfile({ projectId: 1, seed: 42 });
    expect(floralResult.profileId).toBe(2);
    expect(floralResult.recipe).toBeDefined();
    db.select.mockImplementationOnce(() => selectRows([{ id: 1, userId: 7 }]) as never).mockImplementationOnce(() => selectRows([{ id: 4, projectId: 1, status: "superseded", version: 2, profile: approvedProfileFixture }, { id: 2, projectId: 1, status: "approved", version: 1, profile: approvedProfileFixture }]) as never).mockImplementationOnce(() => selectRows([{ id: 3, projectId: 1, emotionalProfileId: 2, status: "approved" }]) as never);
    const promptResult = await appRouter.createCaller(ctx).memory.promptFromProfile({ projectId: 1, storyId: 3, blueprint: { sizeIn: 24, formula: "Crescent", emotion: "belonging", silenceArc: [45, 135], objects: [] }, inventoryNames: {} });
    expect(promptResult.profileId).toBe(2);
    expect(promptResult.prompts).toBeDefined();
  });

  it("carries an approved profile through Story Genesis, florals, blueprint, and prompt compilation", async () => {
    const selectRows = (rows: unknown[]) => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(async () => rows), orderBy: vi.fn(() => ({ limit: vi.fn(async () => rows) })) })) })) });
    const pendingProfile = { id: 2, projectId: 1, intakeId: 9, version: 1, status: "awaiting_approval", profile: approvedProfileFixture };
    db.select.mockImplementationOnce(() => selectRows([pendingProfile]) as never).mockImplementationOnce(() => selectRows([{ id: 1, userId: 7 }]) as never);
    const approval = await appRouter.createCaller(ctx).memory.approveProfile({ id: 2, decision: "approved", overrides: {} });
    expect(approval.status).toBe("approved");
    vi.mocked(listInventoryItems).mockResolvedValue([{ itemId: "stem-1", name: "Ivory Rose", colorHex: "#F1E8D5", colorFamily: "ivory", structuralRole: "focal", emotionTags: ["belonging"], status: "active", approved: true, stemLengthIn: "18" }] as never);
    db.select.mockImplementationOnce(() => selectRows([{ ...pendingProfile, status: "approved" }]) as never).mockImplementationOnce(() => selectRows([{ id: 1, userId: 7 }]) as never);
    const storyResult = await appRouter.createCaller(ctx).memory.storyFromProfile({ projectId: 1, profileId: 2, memory: "A long memory of a quiet inherited room and the lake beyond it.", location: "the house", honoree: "family" });
    expect(storyResult.status).toBe("awaiting_approval");
    expect(Array.isArray(createdDraft?.beats)).toBe(true);
    expect((createdDraft?.beats as unknown[]).length).toBe(7);
    expect(persistedStories).toHaveLength(1);
    db.select.mockImplementationOnce(() => selectRows([{ id: 1, userId: 7 }]) as never).mockImplementationOnce(() => selectRows(persistedStories) as never);
    const persistedStory = await appRouter.createCaller(ctx).memory.latestStory({ projectId: 1 });
    expect(persistedStory?.beats).toEqual(persistedStories[0]?.beats);
    expect(persistedStory?.title).toBe(persistedStories[0]?.title);
    db.select.mockImplementationOnce(() => selectRows([{ id: 77, projectId: 1, emotionalProfileId: 2, status: "awaiting_approval" }]) as never);
    const storyApproval = await appRouter.createCaller(ctx).memory.approveStory({ storyId: 77, decision: "approved" });
    expect(storyApproval.status).toBe("approved");
    db.select.mockImplementationOnce(() => selectRows([{ id: 1, userId: 7 }]) as never).mockImplementationOnce(() => selectRows([{ ...pendingProfile, status: "approved" }]) as never);
    const floralResult = await appRouter.createCaller(ctx).memory.floralsFromProfile({ projectId: 1, seed: 42 });
    expect(floralResult.profileId).toBe(2);
    db.select.mockImplementationOnce(() => selectRows([{ id: 1, userId: 7 }]) as never).mockImplementationOnce(() => selectRows([{ ...pendingProfile, status: "approved" }]) as never).mockImplementationOnce(() => selectRows([{ id: 77, projectId: 1, emotionalProfileId: 2, status: "approved" }]) as never);
    const blueprintResult = await appRouter.createCaller(ctx).memory.blueprintFromProfile({ projectId: 1, profileId: 2, storyId: 77, seed: 42, sizeIn: 24 });
    expect(blueprintResult.profileId).toBe(2);
    db.select.mockImplementationOnce(() => selectRows([{ id: 1, userId: 7 }]) as never).mockImplementationOnce(() => selectRows([{ ...pendingProfile, status: "approved" }]) as never).mockImplementationOnce(() => selectRows([{ id: 77, projectId: 1, emotionalProfileId: 2, status: "approved" }]) as never);
    const promptResult = await appRouter.createCaller(ctx).memory.promptFromProfile({ projectId: 1, storyId: 77, blueprint: blueprintResult.blueprint, inventoryNames: { "stem-1": "Ivory Rose" } });
    expect(promptResult.profileId).toBe(2);
    expect(promptResult.prompts.humanFacing).toContain("24-inch");
  });

  it("persists a server-generated Emotional Design Profile with awaiting approval and provenance", async () => {
    const project = { id: 1, userId: 7 };
    const profile = { emotionalCore: { primaryEmotion: "belonging", secondaryEmotions: ["nostalgia", "calm"], emotionalTemperature: "warm", emotionalWeight: "grounded", emotionalPacing: "slow", emotionalTension: "suspended" }, paletteSystem: { dominantColor: { hex: "#7A3343", name: "berry dusk" }, supportingColors: [{ hex: "#57745D", name: "quiet sage" }, { hex: "#F1E8D5", name: "aged ivory" }], accentColor: { hex: "#B78950", name: "candlelit amber" }, negativeSpaceColor: { hex: "#E8E1D5", name: "silence" }, colorTemperature: "warm", colorSaturation: "muted" }, textureMaterial: { primaryTexture: "weathered silk", secondaryTextures: ["linen", "worn wood"], materialWeight: "delicate", surfaceQuality: "worn", organicVsStructured: 3 }, movementEnergy: { movementArchetype: ["Drift"], directionalEnergy: "toward the threshold", tensionType: "suspended", rhythmQuality: "sparse" }, densitySpace: { overallDensity: "open", focalDensity: "moderate", negativeSpaceRole: "breathing room", layeringDepth: "shallow" }, asymmetryComposition: { asymmetryType: "weighted asymmetry", dominantQuadrant: "top-right", secondaryPull: "lower-left eye pull", silenceZone: "upper-right breathing arc" }, lightQuality: { lightCharacter: "late afternoon", shadowBehavior: "soft", luminosity: "low" }, atmosphere: { atmosphereArchetype: "Inherited Beauty", sensoryAnchors: ["coffee", "lake air"], timeOfDayFeeling: "morning", seasonalResonance: "late summer" }, wreathTranslation: { compositionFormula: "Crescent", ringBands: [{ name: "A", role: "focal", radius: [0, 0.25] }, { name: "B", role: "secondary", radius: [0.25, 0.5] }, { name: "C", role: "filler", radius: [0.5, 0.75] }, { name: "D", role: "greenery", radius: [0.75, 1] }], silenceArc: [45, 135], clusterBehavior: ["weighted", "open"], seasonalDriftTags: ["late summer"], blueprintEmotionTags: ["belonging", "nostalgia", "calm"], sourcingNotes: ["Use approved inventory only"] }, provenance: { modelVersion: "eip-v1", schemaVersion: "eip-v1", generatedAt: 1700000000000, overrides: {} } };
    db.select.mockImplementationOnce(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(async () => [project]) })) })) }));
    vi.mocked(invokeLLM).mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify(profile) } }] } as never);
    const result = await appRouter.createCaller(ctx).memory.generateProfile({ projectId: 1, intakeId: 9, memory: "A long memory of a quiet inherited room and the lake beyond it.", occasion: "remembrance", honoree: "", location: "the house", whoWasThere: "family", timeOfDay: "morning", guided: true });
    expect(result).toMatchObject({ version: 1, status: "awaiting_approval", profile: { provenance: { intakeId: 9, modelVersion: "claude-sonnet-5", schemaVersion: "eip-v2", provider: "cometapi", sourceMemoryHash: expect.any(String) } } });
    expect(insertValues).toHaveBeenCalledWith(expect.objectContaining({ status: "awaiting_approval", projectId: 1, intakeId: 9 }));
  });

  it("repairs repeated incomplete emotional profile responses before persisting", async () => {
    const project = { id: 1, userId: 7 };
    db.select.mockImplementationOnce(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(async () => [project]) })) })) }));
    const callsBefore = vi.mocked(invokeLLM).mock.calls.length;
    vi.mocked(invokeLLM).mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ emotionalCore: { primaryEmotion: "belonging" } }) } }] } as never);
    vi.mocked(invokeLLM).mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ emotionalCore: { primaryEmotion: "belonging", secondaryEmotions: ["nostalgia", "calm"] } }) } }] } as never);
    vi.mocked(invokeLLM).mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify(approvedProfileFixture) } }] } as never);
    const result = await appRouter.createCaller(ctx).memory.generateProfile({ projectId: 1, intakeId: 9, memory: "A long memory of a quiet inherited room and the lake beyond it.", occasion: "remembrance", location: "the house", timeOfDay: "morning" });
    expect(result.status).toBe("awaiting_approval");
    expect(result.profile.atmosphere.atmosphereArchetype).toBe("Inherited Beauty");
    expect(vi.mocked(invokeLLM).mock.calls.length).toBe(callsBefore + 3);
    expect(insertValues).toHaveBeenCalledWith(expect.objectContaining({ status: "awaiting_approval", projectId: 1, intakeId: 9 }));
  });

  it("uses a canonical intake-safe fallback after repeated incomplete profile responses", async () => {
    const project = { id: 1, userId: 7 };
    db.select.mockImplementationOnce(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(async () => [project]) })) })) }));
    const partial = { choices: [{ message: { content: JSON.stringify({ emotionalCore: { primaryEmotion: "belonging" } }) } }] } as never;
    vi.mocked(invokeLLM).mockResolvedValueOnce(partial).mockResolvedValueOnce(partial).mockResolvedValueOnce(partial);
    const result = await appRouter.createCaller(ctx).memory.generateProfile({ projectId: 1, intakeId: 9, memory: "A long memory of a quiet inherited room and the lake beyond it.", occasion: "remembrance", location: "the house", timeOfDay: "morning" });
    expect(result.status).toBe("awaiting_approval");
    expect(result.profile.atmosphere.atmosphereArchetype).toBe("Garden Memory");
    expect(result.profile.wreathTranslation.ringBands).toHaveLength(4);
    expect(insertValues).toHaveBeenCalledWith(expect.objectContaining({ status: "awaiting_approval", projectId: 1, intakeId: 9 }));
  });

  it("varies the intake-safe fallback by memory when provider repair is exhausted", async () => {
    const project = { id: 1, userId: 7 };
    db.select.mockImplementationOnce(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(async () => [project]) })) })) }));
    const partial = { choices: [{ message: { content: JSON.stringify({ emotionalCore: { primaryEmotion: "belonging" } }) } }] } as never;
    vi.mocked(invokeLLM).mockResolvedValueOnce(partial).mockResolvedValueOnce(partial).mockResolvedValueOnce(partial);
    const result = await appRouter.createCaller(ctx).memory.generateProfile({ projectId: 1, intakeId: 10, memory: "A winter train platform at midnight, brass light on snow, and a suitcase held for someone who never arrived.", occasion: "remembrance", location: "the station", timeOfDay: "night" });
    expect(result.status).toBe("awaiting_approval");
    expect(result.profile.atmosphere.atmosphereArchetype).not.toBe("Garden Memory");
    expect(result.profile.emotionalCore.primaryEmotion).not.toBe("belonging");
  });

  it("persists and exposes the EVS-FISA review record on the job analysis", async () => {
    const result = await appRouter.createCaller(ctx).signature.reviewProfile({ jobId: 42, decision: "approved", note: "Confirmed in studio", overrides: { density: "airy" } });
    expect(result).toMatchObject({ decision: "approved", note: "Confirmed in studio", overrides: { density: "airy" }, reviewedBy: 7 });
    expect(updateWhere).toHaveBeenCalledOnce();
    const persistedAnalysis = (db.update.mock.results[0]?.value.set.mock.calls[0]?.[0] as { analysis: { evsFisaReview: unknown } }).analysis;
    expect(persistedAnalysis.evsFisaReview).toEqual(result);
    const retrieved = await appRouter.createCaller(ctx).signature.jobs();
    expect((retrieved[0]?.analysis as { evsFisaReview?: unknown }).evsFisaReview).toEqual(result);
  });

  it("rejects Story Genesis when the emotional profile is not approved", async () => {
    const awaitingProfile = { id: 12, projectId: 1, status: "awaiting_approval", version: 1, profile: {} };
    db.select.mockImplementationOnce(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(async () => [awaitingProfile]) })) })) }));
    await expect(appRouter.createCaller(ctx).memory.storyFromProfile({ projectId: 1, profileId: 12, memory: "A long enough memory about a quiet inherited room and the person who kept returning to it.", location: "the house", honoree: "" })).rejects.toThrow("approved emotional profile");
  });

  it("returns no current profile when the latest version is awaiting approval", async () => {
    const awaitingProfile = { id: 13, projectId: 1, status: "awaiting_approval", version: 2, profile: {} };
    const project = { id: 1, userId: 7 };
    db.select.mockImplementationOnce(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(async () => [project]) })) })) }));
    db.select.mockImplementationOnce(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ orderBy: vi.fn(() => ({ limit: vi.fn(async () => []) })) })) })) }));
    await expect(appRouter.createCaller(ctx).memory.currentProfile({ projectId: 1 })).resolves.toBeNull();
  });

  it.each(["awaiting_approval", "draft", "superseded"] as const)("rejects blueprint composition for %s emotional profiles", async (status) => {
    const project = { id: 1, userId: 7 };
    const profile = { id: 14, projectId: 1, status, version: 1, profile: {} };
    db.select.mockImplementationOnce(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(async () => [project]) })) })) }));
    db.select.mockImplementationOnce(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(async () => [profile]) })) })) }));
    await expect(appRouter.createCaller(ctx).memory.blueprintFromProfile({ projectId: 1, profileId: 14, storyId: 15, seed: 42, sizeIn: 24 })).rejects.toThrow("approved emotional profile");
  });

  it("hides a superseded latest profile from currentProfile", async () => {
    const project = { id: 1, userId: 7 };
    const superseded = { id: 16, projectId: 1, status: "superseded", version: 3, profile: {} };
    db.select.mockImplementationOnce(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(async () => [project]) })) })) }));
    db.select.mockImplementationOnce(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ orderBy: vi.fn(() => ({ limit: vi.fn(async () => []) })) })) })) }));
    await expect(appRouter.createCaller(ctx).memory.currentProfile({ projectId: 1 })).resolves.toBeNull();
  });

  it("returns the approved profile for the active project", async () => {
    const project = { id: 1, userId: 7 };
    const approved = { id: 17, projectId: 1, status: "approved", version: 2, profile: { atmosphere: "Garden Memory" } };
    db.select.mockImplementationOnce(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(async () => [project]) })) })) }));
    db.select.mockImplementationOnce(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ orderBy: vi.fn(() => ({ limit: vi.fn(async () => [approved]) })) })) })) }));
    await expect(appRouter.createCaller(ctx).memory.currentProfile({ projectId: 1 })).resolves.toMatchObject({ id: 17, status: "approved" });
  });

  it("falls back to the prior approved profile when a newer revision is not approved", async () => {
    const project = { id: 1, userId: 7 };
    const newerSuperseded = { id: 19, projectId: 1, status: "superseded", version: 3, profile: {} };
    const priorApproved = { id: 18, projectId: 1, status: "approved", version: 2, profile: { atmosphere: "Garden Memory" } };
    db.select.mockImplementationOnce(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(async () => [project]) })) })) }));
    db.select.mockImplementationOnce(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ orderBy: vi.fn(() => ({ limit: vi.fn(async () => [newerSuperseded, priorApproved]) })) })) })) }));
    await expect(appRouter.createCaller(ctx).memory.currentProfile({ projectId: 1 })).resolves.toMatchObject({ id: 18, version: 2, status: "approved" });
  });

  it("stores binary ECR artifact metadata when creating a Signature Wreath draft", async () => {
    db.select.mockImplementationOnce(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(async () => [{ id: 42, analysis: draftAnalysis, confidence: "medium", flags: [], sourceHash: "hash" }]) })) })) }));
    await appRouter.createCaller(ctx).signature.createDraft({ jobId: 42, title: "Integration Wreath", slug: "integration-wreath" });
    expect(createdDraft?.ecrPackage).toMatchObject({ artifact: { key: "signature-wreaths/ecr/42.ecrpkg", mimeType: "application/vnd.evercrafted.ecrpkg+gzip", extension: ".ecrpkg" }, blueprintArtifact: { key: "signature-wreaths/blueprints/42.blueprintpkg", mimeType: "application/vnd.evercrafted.blueprint+gzip", extension: ".blueprintpkg" } });
    expect(createdDraft?.metadata).toMatchObject({ storyVersion: 1, collectionDNA: { collectionName: "Quiet Hour", source: "story_genesis" } });
    expect((createdDraft?.story as { beats: unknown[] }).beats).toHaveLength(7);
    expect(Array.from(uploadedArtifacts.get("signature-wreaths/ecr/42.ecrpkg")?.slice(0, 2) ?? [])).toEqual([31, 139]);
    expect(Array.from(uploadedArtifacts.get("signature-wreaths/blueprints/42.blueprintpkg")?.slice(0, 2) ?? [])).toEqual([31, 139]);
    db.select.mockImplementationOnce(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ orderBy: vi.fn(async () => [{ ...createdDraft, id: 77, ownerId: 7, updatedAt: new Date() }]) })) })) }));
    const catalog = await appRouter.createCaller(ctx).signature.catalog();
    expect(catalog[0]).toMatchObject({ story: { title: "The Quiet Hour" }, metadata: { storyVersion: 1, collectionDNA: { collectionName: "Quiet Hour" } } });
  });

  it("generates versioned lifestyle prompt slots from Story Genesis beats", async () => {
    const storyWreath = { ...wreath, story: { beats: Array.from({ length: 7 }, (_, index) => ({ name: `Scene ${index + 1}`, setting: "A quiet room", prompt: `Scene prompt ${index + 1}` })) }, metadata: {} };
    db.select.mockImplementationOnce(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(async () => [storyWreath]) })) })) }));
    const result = await appRouter.createCaller(ctx).signature.generateLifestylePrompts({ id: 9, count: 5 });
    expect(result.prompts).toHaveLength(5);
    expect(result.prompts[0]).toMatchObject({ id: "lifestyle-1", status: "awaiting_external_render", renderAssetId: null });
    expect(setUpdate).toHaveBeenCalledWith(expect.objectContaining({ metadata: expect.objectContaining({ lifestylePromptVersion: 1, lifestylePrompts: expect.any(Array) }) }));
  });

  it("returns persisted lifestyle prompt slots through public Signature detail data", async () => {
    db.select.mockImplementationOnce(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(async () => [{ ...wreath, slug: "gallery-wreath", metadata: { lifestylePromptVersion: 1, lifestylePrompts: [{ id: "lifestyle-1", status: "awaiting_external_render" }] } }]) })) })) }));
    db.select.mockImplementationOnce(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ orderBy: vi.fn(async () => []) })) })) }));
    const result = await appRouter.createCaller(ctx).signature.bySlug({ slug: "gallery-wreath" });
    expect(result?.metadata).toMatchObject({ lifestylePromptVersion: 1, lifestylePrompts: [{ id: "lifestyle-1", status: "awaiting_external_render" }] });
  });

  it("increments Story Genesis version and persists revised cinematic beats", async () => {
    db.select.mockImplementationOnce(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(async () => [{ ...wreath, title: "Revision Wreath", metadata: { storyVersion: 1 }, story: { beats: [] } }]) })) })) }));
    const result = await appRouter.createCaller(ctx).signature.reviseStory({ id: 9, direction: "Make the final movement quieter." });
    expect(result.storyVersion).toBe(2);
    expect(result.story).toMatchObject({ title: "The Quiet Hour" });
    expect((result.story as { beats: unknown[] }).beats).toHaveLength(7);
    expect(setUpdate).toHaveBeenCalledWith(expect.objectContaining({ metadata: expect.objectContaining({ storyVersion: 2, storyRevisionDirection: "Make the final movement quieter." }) }));
  });

  it("associates a managed render and records an explicit rejection decision", async () => {
    const attached = await appRouter.createCaller(ctx).signature.attachAsset({ signatureWreathId: 9, kind: "lifestyle", renderAssetId: 12, fileKey: "renders/12.png", url: "https://storage.example/renders/12.png", thumbnailUrl: "https://storage.example/renders/12-thumb.png" });
    expect(attached).toMatchObject({ renderAssetId: 12, approved: false });
    db.select.mockImplementationOnce(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(async () => [{ id: 55, provenance: {} }]) })) })) }));
    const reviewed = await appRouter.createCaller(ctx).signature.reviewAsset({ assetId: 55, decision: "rejected", note: "Needs a cleaner crop." });
    expect(reviewed).toMatchObject({ assetId: 55, decision: "rejected", approved: false });
  });

  it("returns only approved public assets in persisted sort order", async () => {
    const publicWreath = { ...wreath, slug: "ordered-wreath" };
    const publicAssets = [{ id: 2, kind: "lifestyle", sortOrder: 2, approved: false }, { id: 1, kind: "hero", sortOrder: 1, approved: true }, { id: 3, kind: "lifestyle", sortOrder: 3, approved: true }];
    db.select.mockImplementationOnce(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(async () => [publicWreath]) })) })) }));
    db.select.mockImplementationOnce(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ orderBy: vi.fn(async () => publicAssets) })) })) }));
    const result = await appRouter.createCaller(ctx).signature.bySlug({ slug: "ordered-wreath" });
    expect(result?.assets.map((asset) => asset.id)).toEqual([1, 3]);
  });

  it("filters the public Signature collection to approved assets", async () => {
    const publicWreath = { ...wreath, slug: "collection-wreath" };
    const publicAssets = [{ id: 4, kind: "hero", sortOrder: 4, approved: false }, { id: 1, kind: "hero", sortOrder: 1, approved: true }, { id: 2, kind: "lifestyle", sortOrder: 2, approved: true }];
    db.select.mockImplementationOnce(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ orderBy: vi.fn(async () => [publicWreath]) })) })) }));
    db.select.mockImplementationOnce(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ orderBy: vi.fn(async () => publicAssets) })) })) }));
    const result = await appRouter.createCaller(ctx).signature.published();
    expect(result[0]?.heroAsset?.id).toBe(1);
    expect(result[0]?.heroAsset?.approved).toBe(true);
  });

  it("returns a short-lived signed URL for a published ECR package", async () => {
    db.select.mockImplementationOnce(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(async () => [wreath]) })) })) }));
    const result = await appRouter.createCaller(ctx).signature.download({ id: 9, kind: "ecrpkg" });
    expect(result).toEqual({ url: "https://signed.example/signature-wreaths/ecr/42.ecrpkg", expiresInSeconds: 900, kind: "ecrpkg" });
    db.select.mockImplementationOnce(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(async () => [wreath]) })) })) }));
    const blueprintResult = await appRouter.createCaller(ctx).signature.download({ id: 9, kind: "blueprint" });
    expect(blueprintResult).toEqual({ url: "https://signed.example/signature-wreaths/blueprints/42.blueprintpkg", expiresInSeconds: 900, kind: "blueprint" });
  });
});
