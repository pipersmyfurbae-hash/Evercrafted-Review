import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, ExternalLink, Lock, Share2 } from "lucide-react";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { buildLookbookPdfTitle } from "../../../shared/lookbookFlow";

export default function Lookbook() {
  const [, routeParams] = useRoute("/lookbook/share/:token");
  const shareToken = routeParams?.token;
  const [state, setState] = useState<"draft" | "published" | "shareable">("draft");
  const [shareUrl, setShareUrl] = useState("");
  const [titleDraft, setTitleDraft] = useState("");
  const [subtitleDraft, setSubtitleDraft] = useState("A keepsake built from the day that never quite ended.");
  const [makerNoteDraft, setMakerNoteDraft] = useState("A hand-buildable recipe with provenance for every stem.");
  const { data: slugLookbook } = trpc.lookbook.bySlug.useQuery({ slug: "lake-house-in-july" }, { enabled: !shareToken });
  const { data: ownedLookbooks } = trpc.lookbook.mine.useQuery(undefined, { enabled: !shareToken });
  const { data: sharedLookbook } = trpc.lookbook.byShareToken.useQuery({ token: shareToken ?? "" }, { enabled: Boolean(shareToken) });
  const storedLookbook = shareToken ? sharedLookbook : ownedLookbooks?.[0] ?? slugLookbook;
  const generateShareLink = trpc.lookbook.generateShareLink.useMutation({
    onSuccess: (result) => {
      const url = `${window.location.origin}${result.path}`;
      setShareUrl(url);
      setState("shareable");
      void navigator.clipboard?.writeText(url);
      toast.success("Share link copied to your clipboard.");
    },
    onError: (error) => toast.error(error.message),
  });
  const updateLookbook = trpc.lookbook.update.useMutation({ onSuccess: () => toast.success("Lookbook title saved."), onError: (error) => toast.error(error.message) });
  const updateState = trpc.lookbook.setStatus.useMutation({
    onSuccess: (result) => { if (result.status !== "archived") setState(result.status); },
    onError: (error) => toast.error(error.message),
  });

  useEffect(() => {
    if (storedLookbook && storedLookbook.status !== "archived") setState(storedLookbook.status as "draft" | "published" | "shareable");
    if (storedLookbook?.title) setTitleDraft(storedLookbook.title);
    const content = (storedLookbook?.content ?? {}) as { subtitle?: string; makerNote?: string };
    if (content.subtitle) setSubtitleDraft(content.subtitle);
    if (content.makerNote) setMakerNoteDraft(content.makerNote);
    if (storedLookbook?.shareToken) setShareUrl(`${window.location.origin}/lookbook/share/${storedLookbook.shareToken}`);
  }, [storedLookbook]);

  const title = storedLookbook?.title ?? "The lake house in July";
  const presentation = (storedLookbook as (typeof storedLookbook & { presentation?: { story?: { title?: string; body?: string; beats?: unknown[] }; blueprint?: { blueprint?: { formula?: string; silenceArc?: number[]; objects?: unknown[] } }; acceptedFlorals?: unknown[]; approvedAssets?: Array<{ id: number; url: string; kind: string }> } }) | null | undefined)?.presentation;
  const presentationStory = presentation?.story;
  const presentationBlueprint = presentation?.blueprint?.blueprint;
  const approvedAssets = presentation?.approvedAssets ?? [];
  const shareEnabled = Boolean(storedLookbook && !shareToken);
  const publicMode = Boolean(shareToken);
  const shareLabel = useMemo(() => shareUrl ? "Copy share link" : "Generate share link", [shareUrl]);

  const handleShare = async () => {
    if (shareUrl) {
      await navigator.clipboard?.writeText(shareUrl);
      toast.success("Share link copied to your clipboard.");
      return;
    }
    if (storedLookbook && shareEnabled) generateShareLink.mutate({ id: storedLookbook.id });
  };

  const handlePdfExport = () => {
    const previousTitle = document.title;
    document.title = buildLookbookPdfTitle(title);
    toast.info("Choose ‘Save to PDF’ in the print dialog to export this lookbook.");
    window.setTimeout(() => window.print(), 120);
    window.setTimeout(() => { document.title = previousTitle; }, 1500);
  };

  return <main className="min-h-screen bg-[#eee9df] text-[#24231f] print:bg-white"><header className="flex items-center justify-between border-b border-[#d5cab8] bg-[#f8f5ef] px-5 py-5 sm:px-10 print:hidden"><Link href="/" className="flex items-center gap-3 font-serif text-xl italic"><ArrowLeft size={16} /> Evercrafted</Link><div className="flex items-center gap-4"><Badge variant="outline" className="font-mono text-[9px] uppercase tracking-[.16em]">{publicMode ? "shared" : state}</Badge>{!publicMode && <Link href="/workspace" className="font-mono text-[10px] uppercase tracking-[.16em] text-[#6d604b]">Edit in workspace</Link>}</div></header><div className="mx-auto max-w-6xl px-6 py-14 sm:px-10 print:max-w-none print:px-0 print:py-0"><div className="grid gap-10 lg:grid-cols-[1.1fr_.9fr] print:grid-cols-[1.1fr_.9fr] print:gap-8"><section><p className="eyebrow">Evercrafted / Lookbook 01</p>{publicMode ? <h1 className="mt-5 max-w-3xl font-serif text-7xl font-light leading-[.88] print:text-6xl">{title}</h1> : <input value={titleDraft || title} onChange={(event) => setTitleDraft(event.target.value)} className="mt-5 w-full max-w-3xl border-0 border-b border-[#cdbd9e] bg-transparent pb-3 font-serif text-7xl font-light leading-[.88] outline-none print:text-6xl" aria-label="Lookbook title" />}{publicMode ? <p className="mt-7 max-w-xl font-serif text-2xl italic leading-relaxed text-[#6f675c]">{subtitleDraft}</p> : <textarea value={subtitleDraft} onChange={(event) => setSubtitleDraft(event.target.value)} className="mt-7 min-h-20 w-full max-w-xl resize-none border-0 border-b border-[#cdbd9e] bg-transparent font-serif text-2xl italic leading-relaxed outline-none" aria-label="Lookbook subtitle" />}<div className="mt-12 aspect-[4/3] overflow-hidden rounded-3xl bg-gradient-to-br from-[#26342b] via-[#8e9a82] to-[#d2b784] p-7 print:mt-8">{approvedAssets[0]?.url ? <img src={approvedAssets[0].url} alt="Approved wreath or lifestyle render" className="h-full w-full rounded-2xl object-cover" /> : <div className="flex h-full flex-col justify-between border border-white/35 p-6 text-white"><span className="font-mono text-[10px] uppercase tracking-[.2em]">Memory wreath / 24 inches</span><div><p className="font-serif text-5xl italic">{presentationStory?.title ?? "A garden held in the light."}</p><p className="mt-4 max-w-sm font-serif text-lg text-white/75">{presentationStory?.body?.slice(0, 220) ?? "Made from an emotional reading, an approved floral recipe, and a blueprint that leaves room for the memory to breathe."}</p></div></div>}</div></section><aside className="rounded-3xl bg-[#26342b] p-8 text-[#f8f5ef] sm:p-10 print:hidden"><p className="eyebrow text-[#d9c28f]">Lookbook controls</p><p className="mt-5 font-serif text-2xl leading-relaxed text-white/80">This lookbook can remain a private draft, become a shareable client link, or be published as a sales-facing design story.</p>{!publicMode && <><div className="mt-10 space-y-3">{(["draft", "shareable", "published"] as const).map((option) => <button key={option} onClick={() => { setState(option); if (storedLookbook) updateState.mutate({ id: storedLookbook.id, status: option }); }} className={`flex w-full items-center justify-between rounded-xl border p-4 text-left font-mono text-[10px] uppercase tracking-[.15em] transition ${state === option ? "border-[#d9c28f] bg-[#d9c28f] text-[#26342b]" : "border-white/20 text-white/65 hover:border-white/45"}`}><span>{option}</span><span>{state === option ? "active" : "set state"}</span></button>)}</div><div className="mt-10 grid gap-3">{!publicMode && <textarea value={makerNoteDraft} onChange={(event) => setMakerNoteDraft(event.target.value)} className="min-h-20 rounded-xl border border-white/20 bg-white/10 p-3 font-serif text-base text-white outline-none" aria-label="Maker note" /> }<Button disabled={!storedLookbook || !titleDraft.trim() || updateLookbook.isPending} onClick={() => storedLookbook && updateLookbook.mutate({ id: storedLookbook.id, title: titleDraft.trim(), content: { subtitle: subtitleDraft.trim(), makerNote: makerNoteDraft.trim() } })} className="rounded-full bg-[#d9c28f] text-[#26342b]">Save title and content</Button><Button disabled={!storedLookbook || generateShareLink.isPending} onClick={handleShare} className="rounded-full bg-[#d9c28f] text-[#26342b]"><Share2 className="mr-2" size={15} /> {generateShareLink.isPending ? "Generating link…" : shareLabel}</Button><Button onClick={handlePdfExport} variant="outline" className="rounded-full border-white/25 bg-transparent text-white"><Download className="mr-2" size={15} /> Save as PDF</Button><Button variant="outline" className="rounded-full border-white/25 bg-transparent text-white"><Lock className="mr-2" size={15} /> Package purchase</Button></div></>}</aside></div><section className="mt-14 grid gap-8 border-t border-[#d5cab8] pt-12 sm:grid-cols-3 print:mt-10">{[["The story", presentationStory ? `${presentationStory.beats?.length ?? 0} cinematic beats · ${presentationStory.body?.slice(0, 110) ?? "persisted narrative"}` : "Story Genesis is still being prepared."], ["The form", presentationBlueprint ? `${presentationBlueprint.formula ?? "Deterministic"} · ${presentationBlueprint.objects?.length ?? 0} placed stems · silence ${presentationBlueprint.silenceArc?.join("°–") ?? "pending"}°` : "Blueprint composition is still being prepared."], ["The making", makerNoteDraft]].map(([title, body]) => <div key={title}><p className="eyebrow">{title}</p><p className="mt-4 font-serif text-2xl leading-tight">{body}</p><ExternalLink className="mt-6 text-[#9b7950] print:hidden" size={16} /></div>)}</section></div></main>;
}
