import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";

const stages = ["Setup", "Story", "Wreath anchor", "Scene prompts", "Gallery", "Lookbook"];

export default function CollectionStudio() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [brief, setBrief] = useState("");
  const [title, setTitle] = useState("Untitled collection");
  const [season, setSeason] = useState("Season");
  const [studio, setStudio] = useState("Evercrafted");
  const [notes, setNotes] = useState("");
  const [palette, setPalette] = useState("ivory, sage, warm stone");
  const [wreathAnchor, setWreathAnchor] = useState("");
  const createCollection = trpc.memory.createCollection.useMutation({
    onSuccess: (result) => navigate(result.workspacePath),
  });
  const canBuild = useMemo(() => brief.trim().length >= 8 && !createCollection.isPending, [brief, createCollection.isPending]);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#f6f3ed] text-[#334339]"><Loader2 className="animate-spin" /></div>;

  return (
    <main className="min-h-screen bg-[#f6f3ed] text-[#252621]">
      <header className="flex items-center justify-between border-b border-[#d8d0c2] bg-[#faf8f3] px-6 py-4 sm:px-10">
        <Link href="/" className="flex items-center gap-3 font-serif text-lg italic"><ArrowLeft size={16} /> Moodoor</Link>
        <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.25em] text-[#766f63]"><span>Collection Studio</span>{user ? <Link href="/workspace" className="rounded-full border border-[#b9ad9b] px-4 py-2">Workspace</Link> : <button onClick={() => startLogin()} className="rounded-full border border-[#b9ad9b] px-4 py-2">Sign in</button>}</div>
      </header>
      <section className="mx-auto max-w-7xl px-6 py-12 sm:px-10 sm:py-16">
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div><p className="mb-4 text-[10px] uppercase tracking-[0.34em] text-[#8d7555]">The studio</p><h1 className="max-w-3xl font-serif text-5xl font-light leading-[.95] tracking-[-.04em] sm:text-7xl">Every collection,<br /><em>door to lookbook.</em></h1><p className="mt-6 max-w-2xl font-serif text-lg leading-relaxed text-[#756f65]">Start with a phrase, then carry one wreath anchor through story, scene prompts, returned renders, and the finished lookbook.</p></div>
          <div className="flex items-center gap-2 rounded-full border border-[#c8bdad] bg-[#fffdf9] px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-[#756f65]"><Sparkles size={14} /> Connected studio</div>
        </div>
        <div className="mb-10 grid gap-2 md:grid-cols-6">{stages.map((stage, index) => <div key={stage} className={`rounded-xl border p-4 ${index === 0 ? "border-[#304c3d] bg-[#304c3d] text-white" : "border-[#d7cebf] bg-[#fffdf9] text-[#756f65]"}`}><span className="text-[10px] uppercase tracking-[0.22em]">0{index + 1}</span><p className="mt-5 font-serif text-lg">{stage}</p><p className="mt-2 text-[10px] uppercase tracking-[0.12em] opacity-70">{index === 0 ? "Build here" : "Follows the anchor"}</p></div>)}</div>
        <div className="grid gap-8 lg:grid-cols-[1.05fr_.95fr]">
          <section className="rounded-2xl bg-[#20352b] p-7 text-[#f6f3ed] shadow-[0_20px_60px_rgba(34,45,36,.12)] sm:p-10"><p className="text-[10px] uppercase tracking-[0.28em] text-[#d9bd87]">Start here</p><h2 className="mt-4 font-serif text-4xl font-light">Give it a phrase, a season, a feeling.</h2><p className="mt-5 max-w-xl font-serif leading-relaxed text-white/70">We’ll persist the collection first. The Workspace then becomes the authoritative place to approve florals, lock the wreath, generate prompts, return renders, and assemble the lookbook.</p><Textarea value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="e.g. the first thaw of late February — moss and amber" className="mt-8 min-h-28 border-white/20 bg-white/10 text-white placeholder:text-white/45" />{createCollection.error && <p className="mt-3 text-sm text-[#f3b4a6]">{createCollection.error.message}</p>}<Button disabled={!canBuild || !user} onClick={() => createCollection.mutate({ brief, title, season, studio, notes, palette: palette.split(",").map((tone) => tone.trim()).filter(Boolean), wreathAnchor })} className="mt-5 rounded-full bg-[#e4c58e] px-6 text-[#24342b] hover:bg-[#efd3a0]">{createCollection.isPending ? <><Loader2 className="mr-2 animate-spin" size={15} /> Building collection</> : <>Build collection <ArrowRight className="ml-2" size={15} /></>}</Button>{!user && <p className="mt-3 text-xs text-white/60">Sign in to persist a collection to your studio.</p>}</section>
          <section className="rounded-2xl border border-[#d8d0c2] bg-[#fffdf9] p-7 sm:p-10"><p className="text-[10px] uppercase tracking-[0.28em] text-[#8d7555]">Fine-tune / override</p><h2 className="mt-4 font-serif text-3xl font-light">Collection details</h2><div className="mt-7 grid gap-4 sm:grid-cols-2"><label className="text-xs uppercase tracking-[0.16em] text-[#766f63] sm:col-span-2">Collection name<Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2" /></label><label className="text-xs uppercase tracking-[0.16em] text-[#766f63]">Season<Input value={season} onChange={(e) => setSeason(e.target.value)} className="mt-2" /></label><label className="text-xs uppercase tracking-[0.16em] text-[#766f63]">Brand / studio<Input value={studio} onChange={(e) => setStudio(e.target.value)} className="mt-2" /></label><label className="text-xs uppercase tracking-[0.16em] text-[#766f63] sm:col-span-2">Palette tones<Input value={palette} onChange={(e) => setPalette(e.target.value)} className="mt-2" /></label><label className="text-xs uppercase tracking-[0.16em] text-[#766f63] sm:col-span-2">Notes / exceptions<Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-2 min-h-20" /></label><label className="text-xs uppercase tracking-[0.16em] text-[#766f63] sm:col-span-2">Wreath anchor override <span className="normal-case tracking-normal text-[#9d9588]">(optional)</span><Textarea value={wreathAnchor} onChange={(e) => setWreathAnchor(e.target.value)} placeholder="Leave empty until approved florals are transferred into the wreath anchor." className="mt-2 min-h-24" /></label></div><div className="mt-8 flex items-center gap-3 border-t border-[#e1d9cb] pt-6 text-sm text-[#756f65]"><Check size={16} className="text-[#55725c]" /> Saved into the new project when you build.</div></section>
        </div>
      </section>
    </main>
  );
}
