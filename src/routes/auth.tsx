import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/brand";

const search = z.object({ mode: z.enum(["signin", "signup", "forgot"]).catch("signin") });

export const Route = createFileRoute("/auth")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Sign in — Lunelle" },
      { name: "description", content: "Sign in or create your Lunelle account." },
      { property: "og:title", content: "Sign in — Lunelle" },
      { property: "og:description", content: "Access your Lunelle wardrobe and saved looks." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  useEffect(() => {
    if (user) navigate({ to: "/home", replace: true });
  }, [user, navigate]);

  const setMode = (m: "signin" | "signup" | "forgot") => {
    setSent(null);
    navigate({ to: "/auth", search: { mode: m }, replace: true });
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        if (form.password.length < 8) throw new Error("Use at least 8 characters for your password.");
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { emailRedirectTo: window.location.origin + "/home", data: { name: form.name } },
        });
        if (error) throw error;
        setSent("We've sent a confirmation link to your email. Open it to start your wardrobe.");
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (error) throw new Error("That email and password don't match.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        setSent("If that email has an account, a reset link is on its way.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) toast.error("Google sign-in didn't complete. Try again.");
  }

  const titles = { signin: "Welcome back", signup: "Create your account", forgot: "Reset your password" };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6 pt-safe-top pb-12">
      <div className="w-full max-w-sm animate-fade-up">
        <Link to="/" aria-label="Lunelle home"><Logo className="w-40" /></Link>
        <h1 className="mt-10 text-4xl">{titles[mode]}</h1>
        {sent ? (
          <div className="card-soft mt-8 p-6 text-sm leading-relaxed">
            {sent}
            <Button variant="link" className="mt-3 px-0" onClick={() => setMode("signin")}>Back to sign in</Button>
          </div>
        ) : (
          <>
            {mode !== "forgot" && (
              <>
                <Button variant="outline" className="mt-8 w-full" onClick={google} type="button">
                  <svg viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.66 4.1-5.35 4.1a5.98 5.98 0 0 1 0-11.96c1.84 0 3.07.78 3.78 1.46l2.58-2.49C16.71 3.67 14.56 2.7 12 2.7a9.3 9.3 0 0 0 0 18.6c5.37 0 8.93-3.77 8.93-9.09 0-.61-.07-1.08-.16-1.55Z"/></svg>
                  Continue with Google
                </Button>
                <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" />
                </div>
              </>
            )}
            <form onSubmit={submit} className={mode === "forgot" ? "mt-8 space-y-4" : "space-y-4"}>
              {mode === "signup" && (
                <Field label="Name" id="name">
                  <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11 rounded-xl bg-card" />
                </Field>
              )}
              <Field label="Email" id="email">
                <Input id="email" type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-11 rounded-xl bg-card" />
              </Field>
              {mode !== "forgot" && (
                <Field label="Password" id="password">
                  <Input id="password" type="password" required autoComplete={mode === "signup" ? "new-password" : "current-password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="h-11 rounded-xl bg-card" />
                </Field>
              )}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "One moment…" : mode === "signup" ? "Create account" : mode === "signin" ? "Sign in" : "Send reset link"}
              </Button>
            </form>
            <div className="mt-6 flex flex-col items-center gap-2 text-sm text-muted-foreground">
              {mode === "signin" && (
                <>
                  <button onClick={() => setMode("forgot")} className="hover:text-foreground">Forgot password?</button>
                  <button onClick={() => setMode("signup")} className="hover:text-foreground">New here? <span className="text-foreground underline underline-offset-4">Create an account</span></button>
                </>
              )}
              {mode !== "signin" && (
                <button onClick={() => setMode("signin")} className="hover:text-foreground">Already have an account? <span className="text-foreground underline underline-offset-4">Sign in</span></button>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
