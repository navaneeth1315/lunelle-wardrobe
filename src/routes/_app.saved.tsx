import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { EmptyState, OutfitCard } from "@/components/lunelle";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { outfitsQuery } from "@/lib/data";
import { useOutfitActions } from "./_app.home";

export const Route = createFileRoute("/_app/saved")({
  head: () => ({
    meta: [
      { title: "Saved looks — Lunelle" },
      { name: "description", content: "The outfits you've saved in Lunelle." },
      { property: "og:title", content: "Saved looks — Lunelle" },
      { property: "og:description", content: "The outfits you've saved in Lunelle." },
    ],
  }),
  component: SavedPage,
});

function SavedPage() {
  const { user } = useAuth();
  const uid = user!.id;
  const { data = [], isLoading } = useQuery(outfitsQuery(uid, { savedOnly: true }));
  const actions = useOutfitActions(uid);
  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">{data.length} looks</p>
        <h1 className="mt-1 text-4xl">Saved</h1>
      </header>
      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)}</div>
      ) : data.length === 0 ? (
        <EmptyState title="No saved looks yet." body="Save outfits you love and they'll appear here." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((o) => <OutfitCard key={o.id} outfit={o} onSave={() => actions.save(o)} onShare={() => actions.share(o)} />)}
        </div>
      )}
    </div>
  );
}
