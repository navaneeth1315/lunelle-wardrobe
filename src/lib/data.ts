import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type WardrobeItem = Tables<"wardrobe_items">;
export type Profile = Tables<"profiles">;
export type OutfitWithItems = Tables<"outfits"> & { items: WardrobeItem[]; saved: boolean };

export const profileQuery = (uid: string) =>
  queryOptions({
    queryKey: ["profile", uid],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const wardrobeQuery = (uid: string) =>
  queryOptions({
    queryKey: ["wardrobe", uid],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wardrobe_items")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

async function fetchOutfits(uid: string, filter: { ids?: string[]; savedOnly?: boolean; limit?: number }) {
  let q = supabase
    .from("outfits")
    .select("*, outfit_items(wardrobe_items(*)), saved_outfits(id)")
    .eq("user_id", uid)
    .order("created_at", { ascending: false });
  if (filter.ids) q = q.in("id", filter.ids);
  if (filter.limit) q = q.limit(filter.limit);
  const { data, error } = await q;
  if (error) throw error;
  type Row = Tables<"outfits"> & {
    outfit_items: { wardrobe_items: WardrobeItem | null }[];
    saved_outfits: { id: string }[];
  };
  const rows = (data as unknown as Row[]).map(({ outfit_items, saved_outfits, ...o }) => ({
    ...o,
    items: outfit_items.map((i) => i.wardrobe_items).filter(Boolean) as WardrobeItem[],
    saved: saved_outfits.length > 0,
  }));
  return filter.savedOnly ? rows.filter((r) => r.saved) : rows;
}

export const outfitsQuery = (uid: string, opts: { ids?: string[]; savedOnly?: boolean; limit?: number } = {}) =>
  queryOptions({
    queryKey: ["outfits", uid, opts],
    queryFn: () => fetchOutfits(uid, opts),
  });

/** Signed URLs for private wardrobe images, batched and cached. */
export function useImageUrls(paths: (string | null | undefined)[]) {
  const list = [...new Set(paths.filter(Boolean) as string[])].sort();
  return useQuery({
    queryKey: ["signed", list],
    enabled: list.length > 0,
    staleTime: 50 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("wardrobe").createSignedUrls(list, 3600);
      if (error) throw error;
      const map: Record<string, string> = {};
      data.forEach((d) => d.path && d.signedUrl && (map[d.path] = d.signedUrl));
      return map;
    },
  });
}

export async function toggleSaved(uid: string, outfitId: string, saved: boolean) {
  if (saved) {
    const { error } = await supabase.from("saved_outfits").delete().eq("outfit_id", outfitId).eq("user_id", uid);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("saved_outfits").insert({ user_id: uid, outfit_id: outfitId });
    if (error) throw error;
  }
}

/** Resize + compress an image file client-side before upload. */
export async function compressImage(file: File, max = 1400, quality = 0.82): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("compress"))), "image/jpeg", quality));
}

export function blobToDataUrl(b: Blob): Promise<string> {
  return new Promise((res) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.readAsDataURL(b);
  });
}

export function shareOutfit(o: { name: string; items: { name: string }[]; explanation?: string | null }) {
  const text = `${o.name} — styled by Lunelle\n${o.items.map((i) => `• ${i.name}`).join("\n")}${o.explanation ? `\n\n${o.explanation}` : ""}`;
  if (navigator.share) return navigator.share({ title: o.name, text }).then(() => "shared").catch(() => "cancelled");
  return navigator.clipboard.writeText(text).then(() => "copied");
}
