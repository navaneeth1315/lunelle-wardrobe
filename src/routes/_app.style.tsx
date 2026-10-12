import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, RotateCw } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Chip, EmptyState, ItemImage, OutfitCard } from "@/components/lunelle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { outfitsQuery, useImageUrls, wardrobeQuery } from "@/lib/data";
import { COLOR_PREFS, OCCASIONS, STYLES, SWATCHES, WEATHER } from "@/lib/options";
import { generateOutfits } from "@/lib/stylist.functions";
import { useWeather } from "@/lib/weather";
import { cn } from "@/lib/utils";
import { useOutfitActions } from "./_app.home";

export const Route = createFileRoute("/_app/style")({
  validateSearch: z.object({ anchor: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Style Me — Lunelle" },
      { name: "description", content: "Get three outfit ideas built from your own wardrobe." },
      { property: "og:title", content: "Style Me — Lunelle" },
      { property: "og:description", content: "Get three outfit ideas built from your own wardrobe." },
    ],
  }),
  component: StylePage,
});

const LOADING = ["Analyzing your wardrobe…", "Matching colors…", "Building your look…", "Almost ready…"];

function StylePage() {
  const { anchor } = Route.useSearch();
  const { user } = useAuth();
  const uid = user!.id;
  const qc = useQueryClient();
  const { data: wardrobe = [], isLoading } = useQuery(wardrobeQuery(uid));
  const { data: urls } = useImageUrls(wardrobe.map((i) => i.image_path));
  const { weather } = useWeather();
  const actions = useOutfitActions(uid);

  const [occasion, setOccasion] = useState("Casual");
  const [customOccasion, setCustomOccasion] = useState("");
  const [style, setStyle] = useState("Minimal");
  const [weatherSel, setWeatherSel] = useState<string | null>(null);
  const [colorPref, setColorPref] = useState("Any");
  const [colors, setColors] = useState<string[]>([]);
  const [anchorId, setAnchorId] = useState<string | null>(anchor ?? null);
  const [phase, setPhase] = useState<"form" | "loading" | "result">("form");
  const [msgIdx, setMsgIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [resultIds, setResultIds] = useState<string[]>([]);

  const { data: results = [] } = useQuery({ ...outfitsQuery(uid, { ids: resultIds }), enabled: resultIds.length > 0 });
  const liveWeather = weather ? `${weather.bucket} (${weather.temp}°C, ${weather.label})` : null;
  const effectiveWeather = weatherSel ?? liveWeather ?? "Mild";

  useEffect(() => {
    if (phase !== "loading") return;
    const t = setInterval(() => setMsgIdx((i) => Math.min(i + 1, LOADING.length - 1)), 2200);
    return () => clearInterval(t);
  }, [phase]);

  async function run() {
    setError(null);
    if (wardrobe.length < 3) return setError("Please add at least 3 wardrobe items before generating an outfit.");
    setMsgIdx(0);
    setPhase("loading");
    try {
      const res = await generateOutfits({
        data: {
          occasion: occasion === "Other" && customOccasion.trim() ? customOccasion.trim() : occasion,
          style,
          weather: effectiveWeather,
          colorPreference: colors.length ? `${colorPref}; favour ${colors.join(", ")}` : colorPref,
          anchorItemId: anchorId,
        },
      });
      if (!res.ok) {
        setError(res.error);
        setPhase("form");
        return;
      }
      setResultIds(res.outfitIds);
      qc.invalidateQueries({ queryKey: ["outfits", uid] });
      setPhase("result");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Something went wrong while generating your look. Try again.");
      setPhase("form");
    }
  }

  if (!isLoading && wardrobe.length === 0)
    return <EmptyState title="Your wardrobe is waiting." body="Add a few pieces and let Lunelle start styling you." action={<Button asChild><Link to="/wardrobe/new">Add your first item</Link></Button>} />;

  if (phase === "loading")
    return (
      <div className="flex min-h-[70dvh] flex-col items-center justify-center text-center">
        <div className="relative mb-10 size-20">
          <span className="absolute inset-0 animate-breathe rounded-full bg-accent-soft" />
          <span className="absolute inset-5 rounded-full bg-accent" />
        </div>
        <p className="eyebrow">Lunelle is styling your look…</p>
        <p key={msgIdx} className="animate-fade-up mt-3 font-display text-3xl">{LOADING[msgIdx]}</p>
      </div>
    );

  if (phase === "result")
    return (
      <div className="space-y-6">
        <header className="flex items-end justify-between gap-3">
          <div>
            <p className="eyebrow">{occasion} · {style} · {effectiveWeather.split(" (")[0]}</p>
            <h1 className="mt-1 text-4xl">Your looks</h1>
          </div>
          <Button variant="outline" size="sm" onClick={run}><RotateCw /> Regenerate</Button>
        </header>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {results.map((o, i) => (
            <div key={o.id} className="space-y-3">
              <OutfitCard outfit={o} index={i} onSave={() => actions.save(o)} onShare={() => actions.share(o)} />
              {o.styling_tip && <p className="px-2 text-sm text-muted-foreground"><span className="eyebrow mr-2">Tip</span>{o.styling_tip}</p>}
            </div>
          ))}
        </div>
        <Button variant="ghost" onClick={() => setPhase("form")}>Change preferences</Button>
      </div>
    );

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">Style Me</p>
        <h1 className="mt-1 text-4xl">What's the plan?</h1>
      </header>

      <Group n="01" title="Occasion">
        {OCCASIONS.map((o) => <Chip key={o} active={occasion === o} onClick={() => setOccasion(o)}>{o}</Chip>)}
        {occasion === "Other" && <Input value={customOccasion} onChange={(e) => setCustomOccasion(e.target.value)} placeholder="Describe it — e.g. gallery opening" className="mt-1 h-10 w-full rounded-full bg-card" />}
      </Group>
      <Group n="02" title="Style">
        {STYLES.map((s) => <Chip key={s} active={style === s} onClick={() => setStyle(s)}>{s}</Chip>)}
      </Group>
      <Group n="03" title="Weather">
        {liveWeather && <Chip active={weatherSel === null} onClick={() => setWeatherSel(null)}>Live · {weather!.temp}° {weather!.label}</Chip>}
        {WEATHER.map((w) => <Chip key={w} active={weatherSel === w || (!liveWeather && weatherSel === null && w === "Mild")} onClick={() => setWeatherSel(w)}>{w}</Chip>)}
      </Group>
      <Group n="04" title="Colour">
        {COLOR_PREFS.map((c) => <Chip key={c} active={colorPref === c} onClick={() => setColorPref(c)}>{c}</Chip>)}
        <div className="mt-1 flex w-full flex-wrap gap-2">
          {SWATCHES.map((c) => (
            <Chip key={c} active={colors.includes(c)} onClick={() => setColors(colors.includes(c) ? colors.filter((x) => x !== c) : [...colors, c])}>{c}</Chip>
          ))}
        </div>
      </Group>
      <section>
        <p className="eyebrow">05 · Optional</p>
        <h2 className="mb-3 text-2xl">Build an outfit around something specific?</h2>
        <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2 lg:mx-0 lg:px-0">
          {wardrobe.map((it) => (
            <button key={it.id} onClick={() => setAnchorId(anchorId === it.id ? null : it.id)} className="relative w-24 shrink-0 text-left">
              <ItemImage item={it} url={it.image_path ? urls?.[it.image_path] : undefined} className={cn("aspect-[3/4] rounded-xl ring-2 ring-transparent transition", anchorId === it.id && "ring-accent")} />
              {anchorId === it.id && <span className="absolute right-1.5 top-1.5 rounded-full bg-accent p-1 text-accent-foreground"><Check className="size-3" /></span>}
              <p className="mt-1.5 truncate text-xs">{it.name}</p>
            </button>
          ))}
        </div>
      </section>

      {error && <p className="rounded-xl bg-accent-soft px-4 py-3 text-sm">{error}</p>}
      <div className="sticky bottom-24 z-10 lg:bottom-6">
        <Button size="lg" className="w-full shadow-lift" onClick={run}>Style my look</Button>
      </div>
    </div>
  );
}

function Group({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="eyebrow">{n}</p>
      <h2 className="mb-3 text-2xl">{title}</h2>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  );
}
