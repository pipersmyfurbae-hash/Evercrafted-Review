import fs from "node:fs";
const path = "server/routers.ts";
const source = fs.readFileSync(path, "utf8");
const start = "      const response = await invokeLLM({ messages: [{ role: \"system\", content: \"You are Evercrafted's Emotional Design Translator.";
const end = "      } catch (error) { console.error(\"[Memory] emotional profile validation failed\", error); throw new TRPCError({ code: \"BAD_REQUEST\", message: \"The emotional reading was incomplete. Please retry the profile generation.\" }); }";
const startIndex = source.indexOf(start);
const endIndex = source.indexOf(end, startIndex);
if (startIndex < 0 || endIndex < 0) throw new Error("Profile generation block not found");
const replacement = `      const profilePrompt = "You are Evercrafted's Emotional Design Translator. Return one complete JSON Emotional Intelligence Profile using canonical Evercrafted atmosphere and movement vocabulary. Include emotionalCore, paletteSystem, textureMaterial, movementEnergy, densitySpace, asymmetryComposition, lightQuality, atmosphere, and wreathTranslation with four PIE ring bands A-D, a validated silenceArc, formula, cluster behavior, seasonal drift tags, blueprint emotion tags, and sourcing notes. Never return a partial profile.";
      const requestProfile = async (repairContext = "") => invokeLLM({ messages: [{ role: "system", content: profilePrompt }, { role: "user", content: JSON.stringify(input) + repairContext }], response_format: { type: "json_schema", json_schema: { name: "evercrafted_emotional_design_profile", strict: false, schema: emotionalProfileResponseSchema } } });
      const response = await requestProfile();
      try {
        const raw = response.choices?.[0]?.message?.content; if (typeof raw !== "string") throw new Error("Profile response was empty.");
        const buildProfile = (candidate: string) => { const parsed = JSON.parse(candidate) as Record<string, unknown>; const initial = validateEmotionalProfile({ ...parsed, provenance: { ...((parsed.provenance ?? {}) as Record<string, unknown>), intakeId: input.intakeId, modelVersion: "eip-v1", schemaVersion: "eip-v1", generatedAt: Date.now(), overrides: {} } }); return validateEmotionalProfile({ ...initial, wreathTranslation: { ...initial.wreathTranslation, compositionFormula: deriveCompositionFormula(initial), ringBands: deriveRingBands(initial) } }); };
        let profile: EmotionalDesignProfile;
        try { profile = buildProfile(raw); } catch (firstError) {
          console.warn("[Memory] emotional profile incomplete; requesting one repair attempt", firstError);
          const repaired = await requestProfile("\\n\\nThe previous candidate was incomplete or invalid. Return the complete profile again, filling every required canonical field. Do not explain; return JSON only. Previous candidate:\\n" + raw);
          const repairedRaw = repaired.choices?.[0]?.message?.content; if (typeof repairedRaw !== "string") throw firstError;
          profile = buildProfile(repairedRaw);
        }
        const profileInsert = await db.insert(emotionalProfiles).values({ projectId: input.projectId, intakeId: input.intakeId, version: 1, status: "awaiting_approval", atmosphere: profile.atmosphere.atmosphereArchetype, summary: profile.atmosphere.atmosphereArchetype + " · " + profile.movementEnergy.directionalEnergy, profile });
        return { id: Number(profileInsert[0].insertId), version: 1, status: "awaiting_approval" as const, profile };
`;
fs.writeFileSync(path, source.slice(0, startIndex) + replacement + source.slice(endIndex));
console.log("patched");
