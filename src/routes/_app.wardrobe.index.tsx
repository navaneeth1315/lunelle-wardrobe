import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Chip, EmptyState, ItemImage } from "@/components/lunelle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { useImageUrls, wardrobeQuery } from "@/lib/data";
import { CATEGORIES } from "@/lib/options";

export const Route = createFileRoute("/_app/wardrobe/")({
  head: () => ({
    meta: [
      { title: "Wardrobe — Lunelle" },
      { name: "description", content: "Browse, search and organise every piece you own." },
      { property: "og:title", content: "Wardrobe — Lunelle" },
      { property: "og:description", content: "Browse, search and organise every piece you own." },
    ],
  }),
  component: WardrobePage,
});

function WardrobePage() {
  const { user } = useAuth();
  const { data = [], isLoading } = useQuery(wardrobeQuery(user!.id));
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");
  const [favOnly, setFavOnly] = useState(false);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return data.filter(
      (i) =>
        (cat === "All" || i.category === cat) &&
        (!favOnly || i.is_favorite) &&
        (!s || [i.name, i.color, i.brand, i.subcategory, i.material].some((v) => v?.toLowerCase().includes(s))),
    );
  }, [data, q, cat, favOnly]);
  const { data: urls } = useImageUrls(filtered.map((i) => i.image_path));

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <p className="eyebrow">{data.length} pieces</p>
          <h1 className="mt-1 text-4xl">Wardrobe</h1>
        </div>
        <Button asChild size="sm"><Link to="/wardrobe/new"><Plus /> Add</Link></Button>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, colour, brand…" className="h-11 rounded-full bg-card pl-11" />
      </div>
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:flex-wrap lg:px-0">
        <Chip active={favOnly} onClick={() => setFavOnly(!favOnly)}><Heart className="mr-1 inline size-3.5" />Favourites</Chip>
        {["All", ...CATEGORIES].map((c) => <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Chip>)}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />)}
        </div>
      ) : data.length === 0 ? (
        <EmptyState title="Your wardrobe is waiting." body="Add a few pieces and let Lunelle start styling you." action={<Button asChild><Link to="/wardrobe/new">Add your first item</Link></Button>} />
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Nothing matches that search.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((it) => (
            <Link key={it.id} to="/wardrobe/$id" params={{ id: it.id }} className="group animate-fade-up">
              <div className="relative">
                <ItemImage item={it} url={it.image_path ? urls?.[it.image_path] : undefined} className="aspect-[3/4] rounded-2xl transition-transform group-hover:scale-[1.01]" />
                {it.is_favorite && <Heart className="absolute right-3 top-3 size-4 fill-accent text-accent" />}
              </div>
              <p className="mt-2 truncate text-sm">{it.name}</p>
              <p className="text-xs text-muted-foreground">{[it.category, it.color].filter(Boolean).join(" · ")}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
