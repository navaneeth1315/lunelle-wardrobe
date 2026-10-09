import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Heart, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ItemImage } from "@/components/lunelle";
import { emptyDraft, ItemForm, type ItemDraft } from "@/components/item-form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useImageUrls, wardrobeQuery } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/wardrobe/$id")({
  head: () => ({
    meta: [
      { title: "Wardrobe piece — Lunelle" },
      { name: "description", content: "View and edit a piece in your wardrobe." },
      { property: "og:title", content: "Wardrobe piece — Lunelle" },
      { property: "og:description", content: "View and edit a piece in your wardrobe." },
    ],
  }),
  component: ItemDetail,
});

function ItemDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const uid = user!.id;
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data = [], isLoading } = useQuery(wardrobeQuery(uid));
  const item = data.find((i) => i.id === id);
  const { data: urls } = useImageUrls([item?.image_path]);
  const [draft, setDraft] = useState<ItemDraft>(emptyDraft);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (item) {
      const d = { ...emptyDraft };
      (Object.keys(d) as (keyof ItemDraft)[]).forEach((k) => (d[k] = (item[k] as string | null) ?? d[k]));
      setDraft(d);
    }
  }, [item]);

  if (isLoading) return null;
  if (!item) return <p className="py-20 text-center text-muted-foreground">This piece isn't in your wardrobe.</p>;

  const refresh = () => qc.invalidateQueries({ queryKey: ["wardrobe", uid] });

  async function save() {
    setBusy(true);
    const { error } = await supabase.from("wardrobe_items").update(draft).eq("id", id);
    setBusy(false);
    if (error) return toast.error("We couldn't save your changes.");
    toast.success("Saved");
    refresh();
  }
  async function fav() {
    const { error } = await supabase.from("wardrobe_items").update({ is_favorite: !item!.is_favorite }).eq("id", id);
    if (error) return toast.error("Couldn't update favourite.");
    refresh();
  }
  async function remove() {
    const { error } = await supabase.from("wardrobe_items").delete().eq("id", id);
    if (error) return toast.error("Couldn't delete this piece.");
    if (item!.image_path) await supabase.storage.from("wardrobe").remove([item!.image_path]);
    await refresh();
    qc.invalidateQueries({ queryKey: ["outfits", uid] });
    toast.success("Removed from wardrobe");
    navigate({ to: "/wardrobe" });
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <button onClick={() => navigate({ to: "/wardrobe" })} aria-label="Back" className="rounded-full p-2 hover:bg-secondary"><ArrowLeft className="size-5" strokeWidth={1.5} /></button>
        <div className="flex gap-1">
          <button onClick={fav} aria-label="Toggle favourite" className="rounded-full p-2 hover:bg-secondary">
            <Heart className={cn("size-5", item.is_favorite && "fill-accent text-accent")} strokeWidth={1.5} />
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button aria-label="Delete" className="rounded-full p-2 hover:bg-secondary"><Trash2 className="size-5" strokeWidth={1.5} /></button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove this piece?</AlertDialogTitle>
                <AlertDialogDescription>It will also disappear from any looks that use it.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep</AlertDialogCancel>
                <AlertDialogAction onClick={remove}>Remove</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        <ItemImage item={item} url={item.image_path ? urls?.[item.image_path] : undefined} className="aspect-[3/4] rounded-2xl" />
        <div className="space-y-5">
          <div>
            <p className="eyebrow">{item.category}</p>
            <h1 className="text-4xl">{item.name}</h1>
          </div>
          <ItemForm value={draft} onChange={setDraft} />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>
            <Button variant="outline" onClick={() => navigate({ to: "/style", search: { anchor: item.id } })}><Sparkles /> Style around this</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
