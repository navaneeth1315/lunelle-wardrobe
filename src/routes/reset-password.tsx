import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — Lunelle" },
      { name: "description", content: "Choose a new password for your Lunelle account." },
      { property: "og:title", content: "Set a new password — Lunelle" },
      { property: "og:description", content: "Choose a new password for your Lunelle account." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (pw.length < 8) { toast.error("Use at least 8 characters."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { toast.error("This reset link has expired. Request a new one."); return; }
    toast.success("Password updated.");
    navigate({ to: "/home" });
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5">
        <p className="font-display text-3xl">Lunelle</p>
        <h1 className="text-4xl">Set a new password</h1>
        <Input type="password" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} className="h-11 rounded-xl bg-card" autoComplete="new-password" />
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Saving…" : "Update password"}</Button>
      </form>
    </main>
  );
}
