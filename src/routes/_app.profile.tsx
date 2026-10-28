import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Chip } from "@/components/lunelle";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { compressImage, outfitsQuery, profileQuery, useImageUrls, wardrobeQuery } from "@/lib/data";
import { ONBOARD_OCCASIONS, ONBOARD_STYLES } from "@/lib/options";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Lunelle" },
      { name: "description", content: "Your Lunelle profile, style preferences and settings." },
      { property: "og:title", content: "Profile — Lunelle" },
      { property: "og:description", content: "Your Lunelle profile and settings." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const uid = user!.id;
  const qc = useQueryClient();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: profile } = useQuery(profileQuery(uid));
  const { data: wardrobe = [] } = useQuery(wardrobeQuery(uid));
  const { data: outfits = [] } = useQuery(outfitsQuery(uid));
  const avatarPath = profile?.avatar_url?.startsWith(uid) ? profile.avatar_url : null;
  const { data: urls } = useImageUrls([avatarPath]);
  const avatarSrc = avatarPath ? urls?.[avatarPath] : profile?.avatar_url ?? undefined;

  const [name, setName] = useState("");
  const [styles, setStyles] = useState<string[]>([]);
  const [occ, setOcc] = useState<string[]>([]);
  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setStyles(profile.preferred_styles);
      setOcc(profile.preferred_occasions);
    }
  }, [profile]);

  const refresh = () => qc.invalidateQueries({ queryKey: ["profile", uid] });

  async function save() {
    const { error } = await supabase.from("profiles").update({ name, preferred_styles: styles, preferred_occasions: occ }).eq("id", uid);
    await supabase.from("style_preferences").upsert({ user_id: uid, preferred_styles: styles, preferred_occasions: occ }, { onConflict: "user_id" });
    if (error) { toast.error("We couldn't save your profile."); return; }
    toast.success("Profile updated");
    refresh();
  }
  async function upload(f?: File) {
    if (!f) return;
    try {
      const blob = await compressImage(f, 400);
      const path = `${uid}/avatar/avatar-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("wardrobe").upload(path, blob, { contentType: "image/jpeg" });
      if (error) throw error;
      await supabase.from("profiles").update({ avatar_url: path }).eq("id", uid);
      refresh();
    } catch {
      toast.error("Your photo couldn't be uploaded.");
    }
  }
  async function setNotify(v: boolean) {
    await supabase.from("profiles").update({ notifications: v }).eq("id", uid);
    refresh();
  }
  async function logout() {
    await supabase.auth.signOut();
    qc.clear();
    navigate({ to: "/" });
  }
  async function deleteAccount() {
    const paths = wardrobe.map((w) => w.image_path).filter(Boolean) as string[];
    if (paths.length) await supabase.storage.from("wardrobe").remove(paths);
    const { error } = await supabase.rpc("delete_my_account");
    if (error) { toast.error("We couldn't delete your account. Try again."); return; }
    await supabase.auth.signOut();
    qc.clear();
    navigate({ to: "/" });
  }
  const toggle = (arr: string[], set: (v: string[]) => void, v: string) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-5">
        <button onClick={() => fileRef.current?.click()} className="relative size-20 shrink-0 overflow-hidden rounded-full bg-secondary" aria-label="Change profile photo">
          {avatarSrc && !avatarFailed ? <img src={avatarSrc} alt="" onError={() => setAvatarFailed(true)} className="h-full w-full object-cover" /> : <span className="font-display flex h-full items-center justify-center text-3xl">{(profile?.name ?? "L")[0]}</span>}
          <span className="absolute bottom-0 right-0 rounded-full bg-card p-1.5 shadow-soft"><Camera className="size-3" /></span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
        <div className="min-w-0">
          <h1 className="text-2xl leading-snug sm:text-3xl">{profile?.name}</h1>
          <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-3">
        {[["Pieces", wardrobe.length], ["Looks", outfits.length], ["Saved", outfits.filter((o) => o.saved).length]].map(([l, v]) => (
          <div key={l} className="card-soft p-4 text-center">
            <p className="font-display text-3xl">{v}</p>
            <p className="eyebrow mt-1">{l}</p>
          </div>
        ))}
      </div>

      <section className="card-soft space-y-5 p-5">
        <h2 className="text-2xl">Edit profile</h2>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="h-10 rounded-xl bg-card" />
        <div>
          <p className="eyebrow mb-2">Preferred styles</p>
          <div className="flex flex-wrap gap-2">{ONBOARD_STYLES.map((s) => <Chip key={s} active={styles.includes(s)} onClick={() => toggle(styles, setStyles, s)}>{s}</Chip>)}</div>
        </div>
        <div>
          <p className="eyebrow mb-2">Preferred occasions</p>
          <div className="flex flex-wrap gap-2">{ONBOARD_OCCASIONS.map((s) => <Chip key={s} active={occ.includes(s)} onClick={() => toggle(occ, setOcc, s)}>{s}</Chip>)}</div>
        </div>
        <Button onClick={save}>Save profile</Button>
      </section>

      <section className="card-soft divide-y divide-border">
        <div className="flex items-center justify-between p-5">
          <div><p className="text-sm">Style reminders</p><p className="text-xs text-muted-foreground">Occasional tips and outfit nudges</p></div>
          <Switch checked={profile?.notifications ?? true} onCheckedChange={setNotify} />
        </div>
        <div className="p-5">
          <p className="text-sm">Privacy</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Your wardrobe photos are private to your account and never shared. Only you can see your clothes, looks and preferences.</p>
        </div>
        <button onClick={logout} className="flex w-full items-center gap-2 p-5 text-left text-sm hover:bg-secondary"><LogOut className="size-4" strokeWidth={1.5} /> Log out</button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="w-full p-5 text-left text-sm text-destructive hover:bg-secondary">Delete account</button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>This permanently removes your wardrobe, photos and saved looks.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={deleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  );
}
