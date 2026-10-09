import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ImagePlus, Loader2, Sparkles, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { emptyDraft, ItemForm, type ItemDraft } from "@/components/item-form";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { blobToDataUrl, compressImage } from "@/lib/data";
import { detectItem } from "@/lib/stylist.functions";

export const Route = createFileRoute("/_app/wardrobe/new")({
  head: () => ({
    meta: [
      { title: "Add clothing — Lunelle" },
      { name: "description", content: "Photograph your clothes and add them to your Lunelle wardrobe." },
      { property: "og:title", content: "Add clothing — Lunelle" },
      { property: "og:description", content: "Photograph your clothes and add them to your wardrobe." },
    ],
  }),
  component: AddItem,
});

type Pending = { key: string; blob: Blob; preview: string; draft: ItemDraft; detecting: boolean };

function AddItem() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Pending[]>([]);
  const [saving, setSaving] = useState(false);

  const update = (key: string, patch: Partial<Pending>) =>
    setItems((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));

  async function detect(p: Pending) {
    update(p.key, { detecting: true });
    try {
      const small = await compressImage(new File([p.blob], "i.jpg"), 640, 0.7);
      const res = await detectItem({ data: { image: await blobToDataUrl(small) } });
      if (res.ok) {
        setItems((prev) => prev.map((x) => (x.key === p.key ? { ...x, detecting: false, draft: { ...x.draft, ...res.item, brand: x.draft.brand, notes: x.draft.notes } } : x)));
      } else {
        update(p.key, { detecting: false });
        toast.error(res.error);
      }
    } catch {
      update(p.key, { detecting: false });
      toast.error("We couldn't recognise this item. Please fill in the details.");
    }
  }

  async function onFiles(files: FileList | null) {
    if (!files) return;
    const added: Pending[] = [];
    for (const f of Array.from(files).slice(0, 10)) {
      if (!f.type.startsWith("image/")) continue;
      try {
        const blob = await compressImage(f);
        added.push({ key: crypto.randomUUID(), blob, preview: URL.createObjectURL(blob), draft: { ...emptyDraft, name: "" }, detecting: false });
      } catch {
        toast.error("Your wardrobe image couldn't be uploaded.");
      }
    }
    setItems((prev) => [...prev, ...added]);
    added.forEach(detect);
  }

  async function saveAll() {
    if (!user) return;
    if (items.some((i) => !i.draft.name.trim())) return toast.error("Give each piece a name before saving.");
    setSaving(true);
    let ok = 0;
    for (const p of items) {
      const id = crypto.randomUUID();
      const path = `${user.id}/${id}/image.jpg`;
      const up = await supabase.storage.from("wardrobe").upload(path, p.blob, { contentType: "image/jpeg", upsert: true });
      if (up.error) {
        toast.error("Your wardrobe image couldn't be uploaded.");
        continue;
      }
      const { error } = await supabase.from("wardrobe_items").insert({ id, user_id: user.id, image_path: path, image_url: path, ...p.draft });
      if (error) toast.error(`Couldn't save ${p.draft.name}.`);
      else ok++;
    }
    setSaving(false);
    await qc.invalidateQueries({ queryKey: ["wardrobe", user.id] });
    if (ok) {
      toast.success(ok === 1 ? "Added to your wardrobe" : `${ok} pieces added`);
      navigate({ to: "/wardrobe" });
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-2">
        <button onClick={() => navigate({ to: "/wardrobe" })} aria-label="Back" className="rounded-full p-2 hover:bg-secondary"><ArrowLeft className="size-5" strokeWidth={1.5} /></button>
        <h1 className="text-3xl">Add clothing</h1>
      </header>

      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />

      {items.length === 0 ? (
        <button onClick={() => input.current?.click()} className="card-soft flex w-full flex-col items-center gap-3 border-dashed py-20 text-center transition-colors hover:border-accent">
          <ImagePlus className="size-8 text-accent" strokeWidth={1.2} />
          <span className="font-display text-2xl">Upload photos</span>
          <span className="max-w-xs text-sm text-muted-foreground">Choose one or several. Lunelle will detect the category, colour and pattern for you.</span>
        </button>
      ) : (
        <div className="space-y-5">
          {items.map((p) => (
            <div key={p.key} className="card-soft grid gap-4 p-4 sm:grid-cols-[180px_1fr]">
              <div className="relative">
                <img src={p.preview} alt="Preview" className="aspect-[3/4] w-full rounded-xl object-cover" />
                <button onClick={() => setItems(items.filter((x) => x.key !== p.key))} aria-label="Remove photo" className="absolute right-2 top-2 rounded-full bg-card/90 p-1.5"><X className="size-4" /></button>
                <Button size="sm" variant="secondary" className="mt-2 w-full" onClick={() => detect(p)} disabled={p.detecting}>
                  {p.detecting ? <><Loader2 className="animate-spin" /> Detecting…</> : <><Sparkles /> Auto-detect</>}
                </Button>
              </div>
              <ItemForm value={p.draft} onChange={(draft) => update(p.key, { draft })} />
            </div>
          ))}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => input.current?.click()}><ImagePlus /> Add more photos</Button>
            <Button onClick={saveAll} disabled={saving || items.some((i) => i.detecting)} className="sm:ml-auto">
              {saving ? "Saving…" : `Save ${items.length > 1 ? `${items.length} pieces` : "item"}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
