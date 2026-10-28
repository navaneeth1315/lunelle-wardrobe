import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, Home, Shirt, Sparkles, User } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { profileQuery } from "@/lib/data";
import { Logo } from "@/components/brand";

export const Route = createFileRoute("/_app")({ component: AppLayout });

const NAV = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/wardrobe", label: "Wardrobe", icon: Shirt },
  { to: "/style", label: "Style", icon: Sparkles },
  { to: "/saved", label: "Saved", icon: Heart },
  { to: "/profile", label: "Profile", icon: User },
] as const;

function AppLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: profile, isSuccess } = useQuery({ ...profileQuery(user?.id ?? ""), enabled: !!user });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "signin" }, replace: true });
  }, [loading, user, navigate]);
  useEffect(() => {
    if (isSuccess && profile && !profile.onboarded) navigate({ to: "/onboarding", replace: true });
  }, [isSuccess, profile, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <span className="animate-breathe"><Logo className="w-44" /></span>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background lg:flex">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-sidebar px-6 py-8 lg:flex">
        <Link to="/home" aria-label="Lunelle home"><Logo className="w-36" /></Link>
        <nav className="mt-12 flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 rounded-full px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-accent-soft text-foreground" }}
            >
              <Icon className="size-4" strokeWidth={1.5} />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="pt-safe-top pb-safe mx-auto w-full max-w-5xl px-5 lg:px-10 lg:pb-12 lg:pt-10">
        <Outlet />
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur select-none lg:hidden">
        <div className="mx-auto flex max-w-md justify-around">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] tracking-wide text-muted-foreground"
              activeProps={{ className: "text-foreground [&_svg]:text-accent" }}
            >
              <Icon className="size-5" strokeWidth={1.5} />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
