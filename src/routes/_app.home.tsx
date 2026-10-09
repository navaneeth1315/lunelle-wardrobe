import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CloudSun, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, ItemImage, OutfitCard, SectionHeader } from "@/components/lunelle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { outfitsQuery, profileQuery, shareOutfit, toggleSaved, useImageUrls, wardrobeQuery, type OutfitWithItems } from "@/lib/data";
import { useWeather } from "@/lib/weather";

export const Route = createFileRoute("/_app/home")({
  head: () => ({
    meta: [
      { title: "Home — Lunelle" },
      { name: "description", content: "Today's look, weather and your latest wardrobe pieces." },
      { property: "og:title", content: "Home — Lunelle" },
      { property: "og:description", content: "Today's look, weather and your latest wardrobe pieces." },
    ],
  }),
  component: HomePage,
});

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export function useOutfitActions(uid: string) {
  const qc = useQueryClient();
  return {
    save: async (o: OutfitWithItems) => {
      try {
        await toggleSaved(uid, o.id, o.saved);
        toast.success(o.saved ? "Removed from saved" : "Saved to your looks");
        qc.invalidateQueries({ queryKey: ["outfits", uid] });
      } catch {
        toast.error("We couldn't update this look. Try again.");
      }
    },
    share: async (o: OutfitWithItems) => {
      const r = await shareOutfit(o).catch(() => "failed");
      if (r === "copied") toast.success("Outfit copied to clipboard");
      if (r === "failed") toast.error("Sharing isn't available here.");
    },
  };
}

function HomePage() {
  const { user } = useAuth();
  const uid = user!.id;
  const { data: profile } = useQuery(profileQuery(uid));
  const { data: wardrobe = [] } = useQuery(wardrobeQuery(uid));
  const { data: history = [] } = useQuery(outfitsQuery(uid, { limit: 12 }));
  const { weather, status } = useWeather();
  const recent = wardrobe.slice(0, 8);
  const { data: urls } = useImageUrls(recent.map((i) => i.image_path));
  const actions = useOutfitActions(uid);
  const today = history[0];
  const saved = history.filter((o) => o.saved);
  const name = profile?.name?.split(" ")[0] ?? "";

  return (
    <div className="space-y-10">
      <header className="animate-fade-up">
        <div className="flex items-center justify-between">
          <p className="eyebrow">{new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</p>
          <span className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-xs text-muted-foreground shadow-soft">
            <CloudSun className="size-3.5" strokeWidth={1.5} />
            {weather ? `${weather.temp}° · ${weather.label}` : status === "loading" ? "Checking weather…" : profile?.default_weather ?? "Weather off"}
          </span>
        </div>
        <h1 className="mt-3 text-4xl leading-tight lg:text-5xl">{greeting()}{name && `, ${name}`}</h1>
        <p className="mt-1 text-muted-foreground">What are you wearing today?</p>
        <Button asChild size="lg" className="mt-6 w-full sm:w-auto">
          <Link to="/style"><Sparkles /> Style Me</Link>
        </Button>
      </header>

      <section>
        <SectionHeader title="Today's look" />
        {today ? (
          <div className="max-w-md"><OutfitCard outfit={today} onSave={() => actions.save(today)} onShare={() => actions.share(today)} /></div>
        ) : wardrobe.length === 0 ? (
          <EmptyState title="Your wardrobe is waiting." body="Add a few pieces and let Lunelle start styling you." action={<Button asChild><Link to="/wardrobe/new">Add your first item</Link></Button>} />
        ) : (
          <EmptyState title="No look yet today" body="Tap Style Me and Lunelle will build three outfits from your wardrobe." action={<Button asChild variant="rose"><Link to="/style">Style Me</Link></Button>} />
        )}
      </section>

      {recent.length > 0 && (
        <section>
          <SectionHeader title="Recently added" to="/wardrobe" />
          <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2 lg:mx-0 lg:px-0">
            {recent.map((it) => (
              <Link key={it.id} to="/wardrobe/$id" params={{ id: it.id }} className="w-32 shrink-0">
                <ItemImage item={it} url={it.image_path ? urls?.[it.image_path] : undefined} className="aspect-[3/4] rounded-xl" />
                <p className="mt-2 truncate text-xs">{it.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {saved.length > 0 && (
        <section>
          <SectionHeader title="Saved looks" to="/saved" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {saved.slice(0, 3).map((o) => <OutfitCard key={o.id} outfit={o} compact />)}
          </div>
        </section>
      )}

      {history.length > 1 && (
        <section>
          <SectionHeader title="Outfit history" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {history.slice(1, 7).map((o) => <OutfitCard key={o.id} outfit={o} compact onSave={() => actions.save(o)} />)}
          </div>
        </section>
      )}
    </div>
  );
}
