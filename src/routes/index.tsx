import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import hero from "@/assets/hero.jpg";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lunelle — Your wardrobe, styled intelligently" },
      { name: "description", content: "Upload your clothes and let Lunelle style outfits from pieces you already own, tuned to the occasion and weather." },
      { property: "og:title", content: "Lunelle — Your wardrobe, styled intelligently" },
      { property: "og:description", content: "An AI stylist that builds outfits from your own wardrobe." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && user) navigate({ to: "/home", replace: true });
  }, [user, loading, navigate]);

  return (
    <main className="min-h-dvh bg-background lg:grid lg:grid-cols-2">
      <div className="relative h-[58dvh] lg:h-dvh">
        <img src={hero} alt="Pencil sketch of a folded blouse, pleated trousers and loafers beneath a clothes hanger" width={1024} height={1280} className="h-full w-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent lg:hidden" />
      </div>
      <section className="flex flex-col justify-center px-7 pb-12 pt-2 lg:px-20">
        <p className="eyebrow animate-fade-up">AI wardrobe stylist</p>
        <h1 className="animate-fade-up mt-2"><Logo className="w-64 max-w-full" /></h1>
        <p className="animate-fade-up mt-4 max-w-sm text-lg text-muted-foreground">
          Your wardrobe, styled intelligently. Outfits built from the clothes you already own.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:max-w-xs">
          <Button asChild size="lg">
            <Link to="/auth" search={{ mode: "signup" }}>Create your wardrobe</Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <Link to="/auth" search={{ mode: "signin" }}>I already have an account</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
