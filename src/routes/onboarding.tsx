import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Chip } from "@/components/lunelle";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { CLIMATES, ONBOARD_OCCASIONS, ONBOARD_STYLES, STYLE_FOR } from "@/lib/options";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Welcome — Lunelle" },
      { name: "description", content: "Tell Lunelle about your style so outfits fit you." },
      { property: "og:title", content: "Welcome — Lunelle" },
      { property: "og:description", content: "Set up your Lunelle style profile." },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [styles, setStyles] = useState<string[]>([]);
  const [occasions, setOccasions] = useState<string[]>([]);
  const [styleFor, setStyleFor] = useState<string | null>(null);
  const [climate, setClimate] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "signin" } });
  }, [user, loading, navigate]);

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  async function finish() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ preferred_styles: styles, preferred_occasions: occasions, style_gender: styleFor, default_weather: climate, onboarded: true })
      .eq("id", user.id);
    await supabase.from("style_preferences").upsert({ user_id: user.id, preferred_styles: styles, preferred_occasions: occasions }, { onConflict: "user_id" });
    setSaving(false);
    if (error) return toast.error("We couldn't save your preferences. Try again.");
    await qc.invalidateQueries({ queryKey: ["profile"] });
    setStep(5);
  }

  const steps = [
    <Intro key="0" />,
    <Pick key="1" title="Which styles feel like you?" hint="Choose as many as you like.">
      {ONBOARD_STYLES.map((s) => <Chip key={s} active={styles.includes(s)} onClick={() => toggle(styles, setStyles, s)}>{s}</Chip>)}
    </Pick>,
    <Pick key="2" title="Where do you usually go?" hint="We'll prioritise these occasions.">
      {ONBOARD_OCCASIONS.map((s) => <Chip key={s} active={occasions.includes(s)} onClick={() => toggle(occasions, setOccasions, s)}>{s}</Chip>)}
    </Pick>,
    <Pick key="3" title="Style me for…" hint="Optional — helps tailor recommendations.">
      {STYLE_FOR.map((s) => <Chip key={s} active={styleFor === s} onClick={() => setStyleFor(styleFor === s ? null : s)}>{s}</Chip>)}
    </Pick>,
    <Pick key="4" title="What's your weather usually like?" hint="You can always set it per look.">
      {CLIMATES.map((s) => <Chip key={s} active={climate === s} onClick={() => setClimate(climate === s ? null : s)}>{s}</Chip>)}
    </Pick>,
    <div key="5" className="animate-fade-up text-center">
      <div className="mx-auto mb-8 h-px w-12 bg-accent" />
      <h1 className="text-5xl leading-tight">Your Lunelle wardrobe is ready.</h1>
      <p className="mt-4 text-muted-foreground">Add a few pieces and start styling.</p>
    </div>,
  ];

  return (
    <main className="flex min-h-dvh flex-col bg-background px-6 pb-10 pt-6">
      <div className="mx-auto flex w-full max-w-md items-center justify-between">
        {step > 0 && step < 5 ? (
          <button onClick={() => setStep(step - 1)} aria-label="Back" className="rounded-full p-2 hover:bg-secondary"><ArrowLeft className="size-5" strokeWidth={1.5} /></button>
        ) : <span className="size-9" />}
        <div className="flex gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className={`h-1 rounded-full transition-all ${i <= step ? "w-6 bg-primary" : "w-3 bg-border"}`} />
          ))}
        </div>
        <span className="size-9" />
      </div>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">{steps[step]}</div>
      <div className="mx-auto w-full max-w-md">
        {step < 4 && <Button className="w-full" size="lg" onClick={() => setStep(step + 1)}>{step === 0 ? "Begin" : "Continue"}</Button>}
        {step === 4 && <Button className="w-full" size="lg" onClick={finish} disabled={saving}>{saving ? "Saving…" : "Finish"}</Button>}
        {step === 5 && <Button className="w-full" size="lg" onClick={() => navigate({ to: "/wardrobe/new" })}>Add your first item</Button>}
        {step === 5 && <Button variant="ghost" className="mt-2 w-full" onClick={() => navigate({ to: "/home" })}>Go to home</Button>}
      </div>
    </main>
  );
}

function Intro() {
  return (
    <div className="animate-fade-up">
      <p className="eyebrow">Welcome</p>
      <h1 className="mt-3 text-5xl leading-[1.05]">Welcome to Lunelle</h1>
      <p className="mt-4 text-lg text-muted-foreground">Your wardrobe, styled intelligently.</p>
    </div>
  );
}

function Pick({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="animate-fade-up">
      <h1 className="text-4xl leading-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
      <div className="mt-8 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
