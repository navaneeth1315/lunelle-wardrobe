import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, FORMALITY, SEASONS } from "@/lib/options";

export type ItemDraft = {
  name: string;
  category: string;
  subcategory: string;
  color: string;
  pattern: string;
  material: string;
  brand: string;
  season: string;
  formality: string;
  notes: string;
};

export const emptyDraft: ItemDraft = {
  name: "", category: "Tops", subcategory: "", color: "", pattern: "", material: "", brand: "", season: "All season", formality: "Casual", notes: "",
};

export function ItemForm({ value, onChange }: { value: ItemDraft; onChange: (v: ItemDraft) => void }) {
  const set = (k: keyof ItemDraft) => (v: string) => onChange({ ...value, [k]: v });
  const text = (k: keyof ItemDraft, label: string, placeholder?: string) => (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input value={value[k]} placeholder={placeholder} onChange={(e) => set(k)(e.target.value)} className="h-10 rounded-xl bg-card" />
    </div>
  );
  const select = (k: keyof ItemDraft, label: string, opts: readonly string[]) => (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value[k]} onValueChange={set(k)}>
        <SelectTrigger className="h-10 rounded-xl bg-card"><SelectValue /></SelectTrigger>
        <SelectContent>{opts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2">{text("name", "Name", "e.g. Cream linen shirt")}</div>
      {select("category", "Category", CATEGORIES)}
      {text("subcategory", "Type", "Shirt, jeans…")}
      {text("color", "Colour")}
      {text("pattern", "Pattern", "Solid, striped…")}
      {text("material", "Material")}
      {text("brand", "Brand")}
      {select("season", "Season", SEASONS)}
      {select("formality", "Formality", FORMALITY)}
      <div className="col-span-2 space-y-1.5">
        <Label className="text-xs text-muted-foreground">Notes</Label>
        <Textarea value={value.notes} onChange={(e) => set("notes")(e.target.value)} className="rounded-xl bg-card" rows={2} />
      </div>
    </div>
  );
}
