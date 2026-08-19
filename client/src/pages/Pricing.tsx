import { Link } from "wouter";
import { ArrowLeft, Check, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const tiers = [
  { key: "reader" as const, name: "Reader", price: "Free", description: "For entering the story and receiving a first emotional reading.", features: ["Memory intake", "Emotional reading", "Story preview"] },
  { key: "maker" as const, name: "Maker", price: "$19 / month", description: "For people who want to build their memory wreath by hand.", features: ["Full story genesis", "Floral recipe and blueprint", "Maker download package"] },
  { key: "studio" as const, name: "Studio", price: "$79 / month", description: "For operators managing the complete render and lookbook pipeline.", features: ["ECR package access", "Render review workflow", "Published sales lookbooks"] },
];

export default function Pricing() {
  const { user } = useAuth();
  const checkout = trpc.billing.checkout.useMutation({ onSuccess: ({ url }) => { if (url) window.open(url, "_blank"); }, onError: (error) => toast.error(error.message) });
  return <main className="min-h-screen bg-[#f6f3ed] text-[#24231f]"><header className="flex items-center justify-between border-b border-[#ddd3c5] bg-[#fbfaf7] px-6 py-5 sm:px-10"><Link href="/" className="flex items-center gap-3 font-serif text-xl italic"><ArrowLeft size={16} /> Evercrafted</Link><div className="font-mono text-[10px] uppercase tracking-[.2em] text-[#81786c]">Access / Plans</div></header><section className="mx-auto max-w-6xl px-6 py-20 sm:px-10"><div className="max-w-2xl"><p className="eyebrow">Choose your depth</p><h1 className="mt-4 font-serif text-7xl font-light leading-[.9]">A memory can be read, made, or carried into the world.</h1><p className="mt-7 font-serif text-xl leading-relaxed text-[#756d62]">Every tier preserves the same emotional beginning. The difference is how far you want to take the design.</p></div><div className="mt-14 grid gap-5 lg:grid-cols-3">{tiers.map((tier, index) => <Card key={tier.key} className={`border-[#dfd3c1] ${index === 1 ? "bg-[#26342b] text-[#f8f4eb]" : "bg-[#fbfaf7]"}`}><CardContent className="p-8"><p className={`eyebrow ${index === 1 ? "text-[#d8bb84]" : ""}`}>0{index + 1} / {tier.name}</p><h2 className="mt-5 font-serif text-4xl font-light">{tier.price}</h2><p className={`mt-4 min-h-16 font-serif text-lg ${index === 1 ? "text-white/70" : "text-[#756d62]"}`}>{tier.description}</p><div className="mt-8 space-y-3">{tier.features.map((feature) => <div key={feature} className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[.12em]"><Check size={14} className={index === 1 ? "text-[#d8bb84]" : "text-[#304c3b]"} /> {feature}</div>)}</div>{tier.key === "reader" ? <Link href="/"><Button className="mt-10 w-full rounded-full bg-[#d8bb84] text-[#26342b]">Begin with a memory</Button></Link> : user ? <Button onClick={() => checkout.mutate({ plan: tier.key })} disabled={checkout.isPending} className={`mt-10 w-full rounded-full ${index === 1 ? "bg-[#d8bb84] text-[#26342b]" : "bg-[#304c3b]"}`}>{checkout.isPending ? "Opening checkout" : <>Choose {tier.name}</>}</Button> : <Button onClick={() => startLogin()} className="mt-10 w-full rounded-full bg-[#304c3b]">Sign in to continue</Button>}</CardContent></Card>)}</div><div className="mt-8 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.14em] text-[#8f8373]"><Lock size={13} /> Payments handled securely through Stripe</div></section></main>;
}
