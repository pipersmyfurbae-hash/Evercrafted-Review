export type InventorySource = Record<string, unknown>;

export function canonicalStructuralRole(item: InventorySource): string | null {
  const rawRoles = Array.isArray(item.structural_roles) ? item.structural_roles : item.structural_roles != null ? [item.structural_roles] : [];
  const explicit = [...rawRoles, item.structural_role, item.preferred_role]
    .filter((value) => typeof value === "string" && value.trim())
    .map((value) => String(value).trim().toLowerCase());
  const role = explicit.find((value) => /green|foliage|leaf/.test(value));
  if (role) return "greenery";
  const colorFamily = String(item.color_family ?? "").toLowerCase();
  const classification = String(item.classification ?? item.item_type ?? "").toLowerCase();
  if (/greenery|foliage/.test(classification) || /green|olive|sage/.test(colorFamily)) return "greenery";
  return explicit[0] ?? null;
}

export function mapEvsFisa(item: InventorySource) {
  const roles = Array.isArray(item.structural_roles) ? item.structural_roles.map(String) : item.structural_roles != null ? [String(item.structural_roles)] : [];
  const canonicalRole = canonicalStructuralRole(item);
  const tags = Array.isArray(item.evs_emotion_tags) ? item.evs_emotion_tags.map(String) : Array.isArray(item.emotion_tags) ? item.emotion_tags.map(String) : [];
  const colorFamily = String(item.color_family ?? "unknown");
  const formFactor = String(item.form_factor ?? "stem");
  const isGreenery = roles.some((role) => /green|foliage|leaf/i.test(role)) || /green|olive|sage/i.test(colorFamily);
  const atmosphere = tags.length ? tags.slice(0, 4) : [isGreenery ? "grounded" : "quiet beauty"];
  return {
    classification: isGreenery ? "GREENERY" : formFactor.toUpperCase().includes("BUNDLE") ? "SPRAY_BUNDLE" : "INDIVIDUAL_STEM",
    physical: { stemLengthIn: item.stem_length_in ?? null, formFactor, colorFamily, colorName: item.color_name ?? null },
    spatial: { preferredRole: canonicalRole ?? roles[0] ?? (isGreenery ? "greenery" : "secondary"), bend: isGreenery ? "supporting_arc" : "upright_or_splay", scale: Number(item.stem_length_in ?? 24) > 30 ? "tall" : "mid" },
    emotion: { tags: atmosphere, intensity: tags.length >= 3 ? "high" : tags.length === 2 ? "medium" : "low", atmosphere: atmosphere[0] },
    pairing: { companions: isGreenery ? ["focal", "secondary"] : ["greenery", "filler"], avoid: colorFamily === "burgundy" ? ["neon", "cool_primary"] : [] },
    provenance: { sourceSku: item.source_sku ?? item.item_id ?? null, sourceBatch: item.source_batch ?? null, mapperVersion: "EVS-FISA-1.1" },
  };
}
