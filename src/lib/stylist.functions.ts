import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const styleInput = z.object({
  occasion: z.string().min(1).max(60),
  style: z.string().min(1).max(60),
  weather: z.string().min(1).max(120),
  colorPreference: z.string().min(1).max(120),
  anchorItemId: z.string().uuid().nullable().optional(),
});

const outfitSchema = z.object({
  outfits: z
    .array(
      z.object({
        name: z.string(),
        occasion: z.string(),
        style: z.string(),
        weather_suitability: z.string(),
        item_ids: z.array(z.string()),
        explanation: z.string(),
        styling_tip: z.string(),
        color_harmony: z.string(),
      }),
    )
    .describe("Exactly 3 outfits"),
});

export const generateOutfits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => styleInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { generateStructured, AiError } = await import("./ai.server");

    const { data: items, error } = await supabase
      .from("wardrobe_items")
      .select("id,name,category,subcategory,color,pattern,material,season,formality,notes")
      .eq("user_id", userId)
      .limit(300);
    if (error) return { ok: false as const, error: "We couldn't read your wardrobe. Try again." };
    if (!items || items.length < 3)
      return { ok: false as const, error: "Please add at least 3 wardrobe items before generating an outfit." };

    const { data: history } = await supabase
      .from("outfits")
      .select("name, outfit_items(wardrobe_item_id)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(15);

    const recent = (history ?? []).map((h) =>
      (h.outfit_items as { wardrobe_item_id: string }[]).map((i) => i.wardrobe_item_id).sort().join(","),
    );

    const instructions = `You are Lunelle, a thoughtful personal stylist. Build outfits ONLY from the user's wardrobe items listed (reference them by exact id). Never invent clothing they do not own. Priorities: 1) existing wardrobe 2) occasion 3) weather 4) color coordination 5) style preference 6) garment compatibility 7) variety. Each outfit needs a sensible base (top+bottom, or a dress/one-piece), plus footwear and accessories only if owned. Avoid repeating the recent combinations given. Never call an outfit "perfect"; give concrete, useful reasons. Keep explanation to 1-2 sentences and the styling tip to 1 sentence. Return exactly 3 distinct outfits; if the wardrobe is small, vary them as much as possible.`;

    const prompt = JSON.stringify({
      request: data,
      wardrobe: items,
      recent_combinations_to_avoid: recent,
    });

    try {
      const result = await generateStructured({
        schema: outfitSchema,
        instructions,
        messages: [{ role: "user", content: prompt }],
      });
      const owned = new Set(items.map((i) => i.id));
      const created: string[] = [];
      for (const o of result.outfits.slice(0, 3)) {
        const ids = [...new Set(o.item_ids.filter((id) => owned.has(id)))];
        if (ids.length === 0) continue;
        const { data: row, error: insErr } = await supabase
          .from("outfits")
          .insert({
            user_id: userId,
            name: o.name,
            occasion: o.occasion || data.occasion,
            style: o.style || data.style,
            weather: o.weather_suitability || data.weather,
            explanation: o.explanation,
            styling_tip: o.styling_tip,
            color_harmony: o.color_harmony,
          })
          .select("id")
          .single();
        if (insErr || !row) continue;
        await supabase.from("outfit_items").insert(ids.map((wid) => ({ outfit_id: row.id, wardrobe_item_id: wid })));
        created.push(row.id);
      }
      if (!created.length)
        return { ok: false as const, error: "Something went wrong while generating your look. Try again." };
      return { ok: true as const, outfitIds: created };
    } catch (e) {
      const msg = e instanceof AiError ? e.userMessage : "Something went wrong while generating your look. Try again.";
      return { ok: false as const, error: msg };
    }
  });

const detectSchema = z.object({
  name: z.string(),
  category: z.enum(["Tops", "Bottoms", "Dresses", "Outerwear", "Shoes", "Accessories", "Traditional", "Other"]),
  subcategory: z.string(),
  color: z.string(),
  pattern: z.string(),
  material: z.string(),
  season: z.string(),
  formality: z.enum(["Casual", "Smart Casual", "Business", "Formal"]),
});

export const detectItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ image: z.string().startsWith("data:image/").max(2_000_000) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { generateStructured, AiError } = await import("./ai.server");
    try {
      const result = await generateStructured({
        schema: detectSchema,
        instructions:
          "Identify the single main clothing item in the photo. Give a short natural name (e.g. 'Cream linen shirt'), a simple color word, pattern (Solid, Striped, Floral, Checked, Printed...), likely material, best season (Spring, Summer, Autumn, Winter, All season).",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Describe this clothing item." },
              { type: "image", image: data.image },
            ],
          },
        ],
      });
      return { ok: true as const, item: result };
    } catch (e) {
      return {
        ok: false as const,
        error: e instanceof AiError ? e.userMessage : "We couldn't recognise this item. Please fill in the details.",
      };
    }
  });
