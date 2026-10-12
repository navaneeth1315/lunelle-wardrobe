import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Heart, Share2, Sparkles } from "lucide-react";
import { ItemImage } from "@/components/lunelle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { outfitsQuery, useImageUrls } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useOutfitActions } from "./_app.home";

export const Route = createFileRoute("/_app/outfit/$id")({
  head: () => ({
    meta: [
      { title: "Outfit — Lunelle" },
      { name: "description", content: "Outfit details, styling notes and pieces from your wardrobe." },
      { property: "og:title", content: "Outfit — Lunelle" },
      { property: "og:description", content: "Outfit details and styling notes." },
    ],
  }),
  component: OutfitDetail,
});

function OutfitDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const uid = user!.id;
  const navigate = useNavigate();
  const { data, isLoading } = useQuery(outfitsQuery(uid, { ids: [id] }));
  const o = data?.[0];
  const { data: urls } = useImageUrls(o?.items.map((i) => i.image_path) ?? []);
  const actions = useOutfitActions(uid);
  if (isLoading) return null;
  if (!o) return <p className="py-20 text-center text-muted-foreground">This look isn't available.</p>;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <button onClick={() => window.history.length > 1 ? window.history.back() : navigate({ to: "/saved" })} aria-label="Back" className="rounded-full p-2 hover:bg-secondary"><ArrowLeft className="size-5" strokeWidth={1.5} /></button>
        <div className="flex gap-1">
          <button onClick={() => actions.share(o)} aria-label="Share" className="rounded-full p-2 hover:bg-secondary"><Share2 className="size-5" strokeWidth={1.5} /></button>
          <button onClick={() => actions.save(o)} aria-label="Save" className="rounded-full p-2 hover:bg-secondary"><Heart className={cn("size-5", o.saved && "fill-accent text-accent")} strokeWidth={1.5} /></button>
        </div>
      </header>
      <div>
        <p className="eyebrow">{[o.occasion, o.style].filter(Boolean).join(" · ")}</p>
        <h1 className="mt-1 text-5xl leading-tight">{o.name}</h1>
        {o.weather && <p className="mt-2 text-sm text-muted-foreground">{o.weather}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {o.items.map((it) => (
          <Link key={it.id} to="/wardrobe/$id" params={{ id: it.id }}>
            <ItemImage item={it} url={it.image_path ? urls?.[it.image_path] : undefined} className="aspect-[3/4] rounded-2xl" />
            <p className="mt-2 truncate text-sm">{it.name}</p>
            <p className="text-xs text-muted-foreground">{it.category}</p>
          </Link>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[["Why it works", o.explanation], ["Styling tip", o.styling_tip], ["Colour harmony", o.color_harmony]].map(([t, v]) =>
          v ? (
            <div key={t} className="card-soft p-5">
              <p className="eyebrow">{t}</p>
              <p className="mt-2 text-sm leading-relaxed">{v}</p>
            </div>
          ) : null,
        )}
      </div>
      <Button asChild variant="outline"><Link to="/style" search={{ anchor: o.items[0]?.id }}><Sparkles /> Reuse as a starting point</Link></Button>
    </div>
  );
}
