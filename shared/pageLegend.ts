export type PageLegendEntry = {
  label: string;
  detail: string;
  href: string;
  active?: boolean;
};

export const workspacePageLegend: PageLegendEntry[] = [
  { label: "Guided journey", detail: "Memory to wreath", href: "/guided" },
  { label: "Workspace", detail: "Memory-to-wreath studio", href: "/workspace", active: true },
  { label: "Memory intake", detail: "Start a new story", href: "/" },
  { label: "Inventory", detail: "Botanical catalog", href: "/admin/inventory" },
  { label: "Floral library", detail: "Signature wreaths", href: "/signature-wreaths" },
  { label: "Collection Studio", detail: "Build collections", href: "/collection-studio" },
  { label: "Photo Edits", detail: "Review and refine", href: "/photo-edits" },
  { label: "Lookbook", detail: "Preview and share", href: "/lookbook" },
  { label: "Plans", detail: "Access and packages", href: "/plans" },
];
