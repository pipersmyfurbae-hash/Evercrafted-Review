export const lookbookFlowStages = [
  { key: "setup", label: "Setup", tab: "story", detail: "Name the collection and hold the brief" },
  { key: "story", label: "Story", tab: "story", detail: "Approve the emotional territory" },
  { key: "florals", label: "Florals", tab: "selection", detail: "Approve the stems that may enter the wreath" },
  { key: "anchor", label: "Wreath anchor", tab: "blueprint", detail: "Transfer approved florals into the form" },
  { key: "wreathPrompt", label: "Wreath prompt", tab: "render", detail: "Render the approved wreath by itself" },
  { key: "scenes", label: "Scene prompts", tab: "lifestyle", detail: "Turn story beats into separate lifestyle prompts" },
  { key: "gallery", label: "Gallery", tab: "render", detail: "Review the strongest render set" },
  { key: "lookbook", label: "Lookbook", tab: "lookbook", detail: "Assemble, preview, and share" },
] as const;

export type LookbookFlowStage = (typeof lookbookFlowStages)[number];

export const buildLookbookSharePath = (token: string) => `/lookbook/share/${token}`;
export const buildLookbookPdfTitle = (title: string) => `${title} — Evercrafted Lookbook`;
