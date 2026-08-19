import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";

function getRedirectTarget(): string {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect");
  return redirect && redirect.startsWith("/") ? redirect : "/";
}

export default function Login() {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "signIn") {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        navigate(getRedirectTarget());
      } else {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        setNotice("Check your email to confirm your account, then sign in.");
        setMode("signIn");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f3ed] px-6 text-[#24231f]">
      <Card className="w-full max-w-sm border-[#ddd3c5] bg-[#fbfaf7]">
        <CardContent className="p-8">
          <p className="font-serif text-2xl italic">Evercrafted</p>
          <h1 className="mt-4 font-serif text-3xl font-light">
            {mode === "signIn" ? "Sign in" : "Create an account"}
          </h1>
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              required
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            {notice && <p className="text-sm text-[#304c3b]">{notice}</p>}
            <Button type="submit" disabled={loading} className="w-full rounded-full bg-[#304c3b]">
              {loading ? "Please wait…" : mode === "signIn" ? "Sign in" : "Sign up"}
            </Button>
          </form>
          <button
            type="button"
            onClick={() => setMode(mode === "signIn" ? "signUp" : "signIn")}
            className="mt-6 font-mono text-[10px] uppercase tracking-[.14em] text-[#81786c] underline"
          >
            {mode === "signIn" ? "Need an account? Sign up" : "Have an account? Sign in"}
          </button>
        </CardContent>
      </Card>
    </main>
  );
}
