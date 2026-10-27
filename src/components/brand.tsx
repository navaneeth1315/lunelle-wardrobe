import lunelleLogo from "@/assets/lunelle-logo.png.asset.json";
import { cn } from "@/lib/utils";

export function Logo({ className, alt = "Lunelle — Style, your way" }: { className?: string; alt?: string }) {
  return <img src={lunelleLogo.url} alt={alt} className={cn("h-auto w-auto", className)} />;
}
