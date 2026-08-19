export type StoryGrounding = {
  sourceDetails: string[];
  interpretations: string[];
  unsupportedClaims: string[];
  majorUnsupportedClaims: string[];
  approvalEligible: boolean;
};

export type StoryDesignSignals = {
  emotions: string[];
  emotionalMovement: string;
  intensity: number;
  atmosphere: string;
  sensoryEvidence: string[];
  symbolicThemes: string[];
  paletteDirection: string[];
  materialQualities: string[];
  directionalFlowCharacter: string;
  focalCharacter: string;
  negativeSpaceMeaning: string;
  avoidances: string[];
};

const forbiddenDesignLeakage = /\b(flora(?:l)? recipe|focal|secondary|bridge|greenery|texture role|stem count|clock position|o'clock|cluster|open arc|grapevine|eucalyptus|wreath composition|blueprint|inventory)\b/i;
const unsupportedBiographicalSignals = /\b(died|death|passed away|widow|widower|eleven years|one year|for years|last year|every morning|always did|daughter|son|grandmother|grandfather|mother|father|wife|husband|married|divorce|funeral|buried)\b/i;

export function validateStoryGrounding(grounding: StoryGrounding, body: string, beats: Array<{ setting?: string; prompt?: string }>, memory: string): StoryGrounding {
  const sourceText = memory.toLowerCase();
  const unsupported = [...grounding.unsupportedClaims];
  const major = [...grounding.majorUnsupportedClaims];
  if (forbiddenDesignLeakage.test(body) || beats.some((beat) => forbiddenDesignLeakage.test(`${beat.setting ?? ""} ${beat.prompt ?? ""}`))) {
    major.push("The generated Story Genesis output contains floral, inventory, or Blueprint implementation instructions.");
  }
  const biographicalText = `${body} ${beats.map((beat) => `${beat.setting ?? ""} ${beat.prompt ?? ""}`).join(" ")}`;
  const matched = biographicalText.match(new RegExp(unsupportedBiographicalSignals.source, "gi")) ?? [];
  matched.forEach((signal) => {
    if (!sourceText.includes(signal.toLowerCase())) {
      const claim = `Potential unsupported biographical claim: ${signal}`;
      unsupported.push(claim);
      major.push(claim);
    }
  });
  const uniqueUnsupported = Array.from(new Set(unsupported));
  const uniqueMajor = Array.from(new Set(major));
  return { ...grounding, unsupportedClaims: Array.from(new Set(uniqueUnsupported)), majorUnsupportedClaims: Array.from(new Set(uniqueMajor)), approvalEligible: uniqueMajor.length === 0 && grounding.approvalEligible !== false };
}
