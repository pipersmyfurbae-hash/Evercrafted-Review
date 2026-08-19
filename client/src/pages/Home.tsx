import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, Check, ChevronRight, CircleDot, Loader2, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";

const occasions = ["A person I carry", "A place I return to", "A season that changed me", "A threshold"];
const times = ["Dawn", "Morning", "Golden hour", "Dusk", "Night"];
const paletteSwatch = (value: string, index: number) => { if (/^#[0-9a-f]{6}$/i.test(value)) return value; const known: Record<string, string> = { "berry dusk": "#7A3343", "quiet sage": "#57745D", "aged ivory": "#F1E8D5", "candlelit amber": "#B78950", "stone hush": "#77746A", "moss green": "#60715E", "linen white": "#F3EFE6", "slate blue": "#667B8A", "weathered lavender": "#8D7B98", "sea glass": "#DCE5E3" }; return known[value.toLowerCase()] ?? ["#7A3343", "#57745D", "#B78950", "#8D7B98", "#667B8A"][index % 5]; };

export default function Home() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [memory, setMemory] = useState("");
  const [occasion, setOccasion] = useState("");
  const [honoree, setHonoree] = useState("");
  const [location, setLocation] = useState("");
  const [whoWasThere, setWhoWasThere] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("");
  const [result, setResult] = useState<null | { atmosphere: string; summary: string; story: string; palette: string[] }>(null);
  const [approved, setApproved] = useState(false);
  const [weaveStage, setWeaveStage] = useState(0);
  const [weaveSlow, setWeaveSlow] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");

  const weave = trpc.memory.weave.useMutation({
    onSuccess: (data) => { setResult(data); setApproved(false); setWeaveSlow(false); },
    onError: () => setWeaveSlow(false),
  });
  const persistMemory = trpc.memory.createMemoryProject.useMutation({ onSuccess: (data) => navigate(data.workspacePath), onError: (error) => window.alert(error.message) });
  useEffect(() => { if (!user || persistMemory.isPending) return; const saved = sessionStorage.getItem("evercrafted-memory-intake"); if (!saved) return; try { const payload = JSON.parse(saved) as Parameters<typeof persistMemory.mutate>[0]; sessionStorage.removeItem("evercrafted-memory-intake"); persistMemory.mutate(payload); } catch { sessionStorage.removeItem("evercrafted-memory-intake"); } }, [user]);

  const canSubmit = !weave.isPending;
  const progress = useMemo(() => {
    return [memory.trim(), occasion, honoree.trim(), location.trim(), whoWasThere.trim(), timeOfDay].filter(Boolean).length;
  }, [memory, occasion, honoree, location, whoWasThere, timeOfDay]);
  const progressiveStage = weave.isPending ? weaveStage : Math.min(3, Math.floor(progress / 2));
  useEffect(() => { if (!weave.isPending) { setWeaveSlow(false); return; } const stageTimer = window.setInterval(() => setWeaveStage((stage) => Math.min(stage + 1, 3)), 900); const slowTimer = window.setTimeout(() => setWeaveSlow(true), 12000); return () => { window.clearInterval(stageTimer); window.clearTimeout(slowTimer); }; }, [weave.isPending]);
  const submit = () => {
    if (!memory.trim() || memory.trim().length < 25) { setValidationMessage("Add a little more of the memory—at least 25 characters—so we can read its emotional shape."); return; }
    setValidationMessage("");
    setWeaveStage(0);
    weave.mutate({ memory, occasion, honoree, location, whoWasThere, timeOfDay, guided: false });
  };
  const continueToWorkspace = () => {
    const payload = { memory, occasion, honoree, location, whoWasThere, timeOfDay, guided: false, name: result?.atmosphere ? `${result.atmosphere} memory` : "Memory wreath" };
    if (!user) {
      // Stash the draft only when we're about to lose it to a login redirect —
      // the resume effect below picks it back up once the user returns signed in.
      sessionStorage.setItem("evercrafted-memory-intake", JSON.stringify(payload));
      startLogin();
      return;
    }
    persistMemory.mutate(payload);
  };

  return (
    <main className="min-h-screen bg-[#f6f3ed] text-[#24231f]">
      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between px-5 py-5 sm:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/20 text-white backdrop-blur"><Sparkles size={15} /></div>
          <span className="font-serif text-xl italic tracking-wide text-white">Evercrafted</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-white/80">
          <Link href="#how-it-works" className="hidden sm:block">The method</Link><Link href="/guided" className="hidden sm:block">Guided journey</Link><Link href="/signature-wreaths" className="hidden sm:block">Signature wreaths</Link><Link href="/plans" className="hidden sm:block">Plans</Link>
          {user ? <Link href="/workspace" className="rounded-full border border-white/35 px-4 py-2">Workspace</Link> : <button onClick={() => startLogin()} className="rounded-full border border-white/35 px-4 py-2">Sign in</button>}
        </div>
      </header>

      <section className="relative flex min-h-[780px] items-end overflow-hidden bg-[#1b211d] px-6 pb-16 pt-32 sm:px-12 sm:pb-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_15%,rgba(167,141,95,.35),transparent_32%),linear-gradient(120deg,#17201c_0%,#35463d_48%,#81775f_120%)]" />
        <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(rgba(255,255,255,.18)_1px,transparent_1px)] [background-size:4px_4px]" />
        <div className="relative z-10 max-w-4xl">
          <p className="mb-6 text-[10px] uppercase tracking-[0.34em] text-[#e5d4b0]">A memory, given form</p>
          <h1 className="max-w-3xl font-serif text-6xl font-light leading-[.9] tracking-[-.04em] text-[#f8f5ef] sm:text-8xl">Some moments<br /><em>ask to be kept.</em></h1>
          <p className="mt-8 max-w-xl font-serif text-lg leading-relaxed text-white/75 sm:text-xl">Tell us about a place, a person, a morning, or the feeling you cannot quite name. We read what lives underneath, then build from there.</p>
          <a href="#memory" className="mt-10 inline-flex items-center gap-3 rounded-full bg-[#e4c58e] px-6 py-3 text-[11px] font-medium uppercase tracking-[0.22em] text-[#273129] transition hover:-translate-y-0.5">Begin the weaving <ArrowRight size={15} /></a>
        </div>
        <div className="absolute bottom-8 right-8 hidden max-w-[220px] text-right font-serif text-sm italic text-white/55 sm:block">AI interprets.<br />Geometry places.<br />The hands finish the story.</div>
      </section>

      <section id="memory" className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-10 lg:grid-cols-[.8fr_1.2fr] lg:py-28">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#876b3d]">01 · The intake</p>
          <h2 className="mt-4 max-w-md font-serif text-5xl font-light leading-none tracking-[-.03em]">Begin with what the flowers cannot know.</h2>
          <p className="mt-6 max-w-md font-serif text-lg leading-relaxed text-[#716b61]">Specific details are welcome. So are fragments. A smell in a hallway. A chair left empty. The light on a dock. Write until the memory changes temperature.</p>
          <div className="mt-10 border-l border-[#c7bda9] pl-5 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8e877c]">{progress}/6 signals gathered</div>
        </div>

        <div className="rounded-[28px] border border-[#e0d8ca] bg-[#fbfaf7] p-6 shadow-[0_24px_80px_rgba(45,40,28,.08)] sm:p-10">
          <label className="eyebrow">The memory</label>
          <Textarea value={memory} onChange={(e) => setMemory(e.target.value)} placeholder="The lake house in July — bare feet on the warm dock, my father's coffee going cold on the rail, the whole summer still ahead of us." className="mt-3 min-h-[170px] resize-y border-[#ddd3c5] bg-[#f8f5ef] font-serif text-xl leading-relaxed shadow-none placeholder:text-[#aaa195] focus-visible:ring-[#a88d5e]" />

          <div className="mt-7"><label className="eyebrow">This wreath holds</label><div className="mt-3 flex flex-wrap gap-2">{occasions.map((item) => <button key={item} onClick={() => setOccasion(item)} className={`rounded-full border px-4 py-2 text-xs transition ${occasion === item ? "border-[#304c3b] bg-[#304c3b] text-white" : "border-[#d9d0c3] bg-transparent text-[#6f695f] hover:border-[#304c3b]"}`}>{item}</button>)}</div></div>

          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <div><label className="eyebrow">For someone, if you wish</label><Input value={honoree} onChange={(e) => setHonoree(e.target.value)} placeholder="For Mom" className="mt-3 border-[#ddd3c5] bg-[#f8f5ef] font-serif text-base shadow-none" /></div>
            <div><label className="eyebrow">Where it happened</label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="A kitchen in Savannah" className="mt-3 border-[#ddd3c5] bg-[#f8f5ef] font-serif text-base shadow-none" /></div>
          </div>
          <div className="mt-6"><label className="eyebrow">Who was there</label><Input value={whoWasThere} onChange={(e) => setWhoWasThere(e.target.value)} placeholder="My daughter, my grandmother, just us two…" className="mt-3 border-[#ddd3c5] bg-[#f8f5ef] font-serif text-base shadow-none" /></div>

          <div className="mt-7"><label className="eyebrow">The light in the room</label><div className="mt-3 flex flex-wrap gap-2">{times.map((item) => <button key={item} onClick={() => setTimeOfDay(item)} className={`rounded-full border px-4 py-2 text-xs transition ${timeOfDay === item ? "border-[#ad8755] bg-[#ad8755] text-white" : "border-[#d9d0c3] text-[#6f695f] hover:border-[#ad8755]"}`}>{item}</button>)}</div></div>

          <div className="mt-8 flex items-center justify-end gap-4 border-t border-[#eee8df] pt-6"><Button onClick={submit} disabled={!canSubmit} className="rounded-full bg-[#304c3b] px-6 py-6 text-xs uppercase tracking-[0.2em] hover:bg-[#243a2d]">{weave.isPending ? <><Loader2 className="mr-2 animate-spin" size={15} /> Weaving</> : <><Wand2 className="mr-2" size={15} /> Weave my wreath</>}</Button></div>
          {validationMessage && <p role="alert" className="mt-4 text-right text-sm text-[#9b5e45]">{validationMessage}</p>}
          {weaveSlow && weave.isPending && <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[#d9b995] bg-[#fff7ed] p-4 text-sm text-[#805d3d]"><span>The reading is taking longer than expected.</span><Button variant="outline" onClick={() => { weave.reset(); setWeaveStage(0); setWeaveSlow(false); }} className="rounded-full border-[#c9a16f] text-[#805d3d]">Retry reading</Button></div>}
          {progress > 0 && <div className="mt-6 grid grid-cols-3 gap-2 rounded-2xl border border-[#e4dacb] bg-[#f3eee5] p-4">{["Reading the memory", "Translating the feeling", "Placing the first form"].map((stage, index) => <div key={stage} className={`rounded-xl p-3 font-mono text-[9px] uppercase leading-relaxed tracking-[.1em] transition ${progressiveStage > index ? "bg-[#304c3b] text-white" : "text-[#978b7b]"}`}><span className="block text-[#d9c28f]">0{index + 1}</span>{stage}</div>)}</div>}
          {weave.error && <p className="mt-4 text-sm text-red-700">{weave.error.message}</p>}
        </div>
      </section>

      {result && <section className="border-y border-[#d9d0c3] bg-[#eee9df] px-5 py-20 sm:px-10"><div className="mx-auto max-w-5xl"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="eyebrow">Your first reading</p><h2 className="mt-3 font-serif text-5xl font-light leading-none">{result.atmosphere}</h2></div><Badge className="rounded-full bg-[#304c3b] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em]">{approved ? "Approved · ready to build" : "Draft · client review"}</Badge></div><div className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_.7fr]"><div className="rounded-2xl bg-[#fbfaf7] p-7 font-serif text-xl leading-relaxed text-[#4d493f]">{result.summary}<div className="mt-8 border-t border-[#e5ded2] pt-6 text-base text-[#797168]">{result.story}</div></div><div className="rounded-2xl bg-[#304c3b] p-7 text-[#f8f5ef]"><p className="eyebrow text-[#d9c28f]">Palette language</p><div className="mt-5 space-y-4">{result.palette.map((color, index) => <div key={color} className="flex items-center gap-3 font-serif text-lg"><span aria-hidden="true" className="h-6 w-6 rounded-full border border-black/10 shadow-inner" style={{ backgroundColor: paletteSwatch(color, index) }} /><span>{color}</span><span className="font-mono text-[9px] uppercase tracking-[.12em] text-white/50">{paletteSwatch(color, index)}</span></div>)}</div>{approved ? <div className="mt-10"><Button disabled={persistMemory.isPending} onClick={continueToWorkspace} className="w-full rounded-full bg-[#d9c28f] text-[#304c3b] hover:bg-[#ecd7a6]">{persistMemory.isPending ? <span className="inline-flex items-center gap-2"><span>Giving this memory a home</span><span className="inline-flex gap-1" aria-hidden="true"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#304c3b] [animation-delay:-300ms]" /><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#304c3b] [animation-delay:-150ms]" /><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#304c3b]" /></span></span> : <>Continue to the emotional gate <ArrowRight className="ml-2" size={15} /> </>}</Button>{persistMemory.isPending && <p role="status" className="mt-3 text-center font-mono text-[9px] uppercase tracking-[.16em] text-[#887554]">Naming the collection from your memory · opening Story Genesis next</p>}</div> : <Button onClick={() => setApproved(true)} className="mt-10 w-full rounded-full bg-[#d9c28f] text-[#304c3b] hover:bg-[#ecd7a6]">Approve emotional direction <Check className="ml-2" size={15} /></Button>}</div></div></div></section>}

      <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-20 sm:px-10 lg:py-28"><div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]"><div><p className="eyebrow">The method</p><h2 className="mt-4 font-serif text-5xl font-light leading-none">A design system with a pulse.</h2></div><div className="grid gap-4 sm:grid-cols-3">{[["01", "Read the feeling", "Memory becomes atmosphere, palette, movement, and silence."], ["02", "Place by meaning", "Approved stems become a deterministic, hand-buildable blueprint."], ["03", "Make it visible", "Prompts, renders, lifestyle scenes, and a lookbook bring it home."]].map(([n, title, body]) => <div key={n} className="border-t border-[#cfc5b6] pt-4"><p className="font-mono text-[10px] tracking-[0.18em] text-[#9a8260]">{n}</p><h3 className="mt-8 font-serif text-3xl font-light">{title}</h3><p className="mt-4 font-serif text-lg leading-relaxed text-[#756e63]">{body}</p><ChevronRight className="mt-8 text-[#9a8260]" size={17} /></div>)}</div></div></section>
      <footer className="bg-[#26342b] px-5 py-10 text-center text-[#e5d8be] sm:px-10"><div className="font-serif text-3xl italic">Evercrafted</div><div className="mt-3 font-mono text-[9px] uppercase tracking-[0.28em] text-white/50">Woven from memory · built by hand</div></footer>
    </main>
  );
}
