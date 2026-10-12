import { Link } from "@tanstack/react-router";
import { Heart, Share2, Shirt } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useImageUrls, type OutfitWithItems, type WardrobeItem } from "@/lib/data";

export function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-full border px-4 py-2 text-sm transition-all",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:border-accent",
      )}
    >
      {children}
    </button>
  );
}

export function ItemImage({
  item,
  url,
  className,
}: {
  item: Pick<WardrobeItem, "name" | "image_path">;
  url?: string | undefined;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-secondary", className)}>
      {url ? (
        <img src={url} alt={item.name} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          <Shirt className="size-6" strokeWidth={1.2} />
        </div>
      )}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="card-soft flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-5 h-px w-10 bg-accent" />
      <h3 className="text-2xl">{title}</h3>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function SectionHeader({ title, to, label = "See all" }: { title: string; to?: string; label?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h2 className="text-2xl">{title}</h2>
      {to && (
        <Link to={to} className="text-xs tracking-wide text-muted-foreground hover:text-foreground">
          {label}
        </Link>
      )}
    </div>
  );
}

export function OutfitCollage({ items, urls }: { items: WardrobeItem[]; urls?: Record<string, string> | undefined }) {
  const shown = items.slice(0, 4);
  return (
    <div className={cn("grid gap-1 overflow-hidden rounded-xl", shown.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
      {shown.map((it, i) => (
        <ItemImage
          key={it.id}
          item={it}
          url={it.image_path ? urls?.[it.image_path] : undefined}
          className={cn("aspect-square", shown.length === 3 && i === 0 && "row-span-2 aspect-auto h-full")}
        />
      ))}
    </div>
  );
}

export function OutfitCard({
  outfit,
  index,
  onSave,
  onShare,
  compact,
}: {
  outfit: OutfitWithItems;
  index?: number;
  onSave?: () => void;
  onShare?: () => void;
  compact?: boolean;
}) {
  const { data: urls } = useImageUrls(outfit.items.map((i) => i.image_path));
  return (
    <article className="card-soft animate-fade-up overflow-hidden p-3">
      <Link to="/outfit/$id" params={{ id: outfit.id }}>
        <OutfitCollage items={outfit.items} urls={urls} />
      </Link>
      <div className="px-1 pb-1 pt-4">
        {index !== undefined && <p className="eyebrow">Look {String(index + 1).padStart(2, "0")}</p>}
        <div className="flex items-start justify-between gap-2">
          <Link to="/outfit/$id" params={{ id: outfit.id }}>
            <h3 className={cn("leading-tight", compact ? "text-xl" : "text-2xl")}>{outfit.name}</h3>
          </Link>
          <div className="flex shrink-0 gap-1">
            {onShare && (
              <button onClick={onShare} aria-label="Share outfit" className="rounded-full p-2 hover:bg-secondary">
                <Share2 className="size-4" strokeWidth={1.5} />
              </button>
            )}
            {onSave && (
              <button
                onClick={onSave}
                aria-label={outfit.saved ? "Remove from saved" : "Save outfit"}
                className="rounded-full p-2 hover:bg-secondary"
              >
                <Heart className={cn("size-4", outfit.saved && "fill-accent text-accent")} strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {[outfit.occasion, outfit.style].filter(Boolean).join(" · ")}
        </p>
        {!compact && outfit.explanation && <p className="mt-3 text-sm leading-relaxed">{outfit.explanation}</p>}
      </div>
    </article>
  );
}
