import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTutor } from "@/lib/TutorService";
import { useTheme } from "@/lib/theme-context";
import { useAuth } from "@/lib/auth-context";
import { useState, useEffect } from "react";
import {
  Sparkles,
  Moon,
  Sun,
  ShieldAlert,
  ShieldCheck,
  User,
  Mail,
  Phone as PhoneIcon,
  AtSign,
  Loader2,
  Save,
  Volume2,
} from "lucide-react";
import { PermissionsPanel } from "@/components/PermissionsPanel";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Cymatic Hub" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, profile: authProfile } = useAuth();
  const navigate = useNavigate();
  const {
    voice,
    setVoice,
    ttsEnabled,
    setTtsEnabled,
    speak,
    availableVoices,
    voiceURI,
    setVoiceURI,
    pitchAdj,
    setPitchAdj,
    rateAdj,
    setRateAdj,
  } = useTutor();
  const { theme, setTheme } = useTheme();

  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    display_name: "",
    username: "",
    phone: "",
    email: user?.email || "",
  });

  useEffect(() => {
    if (authProfile) {
      setProfile({
        display_name: authProfile.display_name || "",
        username: authProfile.username || "",
        phone: authProfile.phone || "",
        email: user?.email || "",
      });
    }
  }, [authProfile, user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: profile.display_name,
        username: profile.username || null,
        phone: profile.phone || null,
      })
      .eq("user_id", user.id);

    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated successfully!");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 animate-fade-in space-y-8">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
          <Sparkles className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">System Settings</h1>
      </div>

      {/* PROFILE MANAGEMENT */}
      <section className="rounded-3xl border border-border/60 bg-card/80 p-6 backdrop-blur shadow-sm space-y-6">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Profile Management</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
          <div className="space-y-4 min-w-0">
            <div className="space-y-1.5">
              <Label
                htmlFor="display_name"
                className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"
              >
                <User className="h-3 w-3" /> Legal Name
              </Label>
              <Input
                id="display_name"
                value={profile.display_name}
                onChange={(e) => setProfile((p) => ({ ...p, display_name: e.target.value }))}
                className="bg-background/50 border-border/40 focus:ring-primary/20 break-words"
                placeholder="Full Legal Name"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="username"
                className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"
              >
                <AtSign className="h-3 w-3" /> Username
              </Label>
              <Input
                id="username"
                value={profile.username}
                onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value }))}
                className="bg-background/50 border-border/40 focus:ring-primary/20"
                placeholder="unique_username"
              />
            </div>
          </div>

          <div className="space-y-4 min-w-0">
            <div className="space-y-1.5">
              <Label
                htmlFor="phone"
                className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"
              >
                <PhoneIcon className="h-3 w-3" /> Phone Number
              </Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                className="bg-background/50 border-border/40 focus:ring-primary/20"
                placeholder="07..."
              />
            </div>

            <div className="space-y-1.5 opacity-60">
              <Label
                htmlFor="email"
                className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"
              >
                <Mail className="h-3 w-3" /> Primary Email (Locked)
              </Label>
              <Input
                id="email"
                value={profile.email}
                disabled
                className="bg-background/20 border-border/20 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <Button
          onClick={handleSaveProfile}
          disabled={loading}
          className="w-full h-12 rounded-2xl font-bold shadow-glow"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Update Profile Registry
        </Button>
      </section>

      {/* TUTOR IDENTITY */}
      <section className="rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur shadow-sm">
        <h2 className="text-lg font-bold flex items-center gap-2">Tutor Identity</h2>
        <p className="mb-4 text-xs text-muted-foreground italic">
          Choose who walks the grind with you.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              { id: "male", name: "Adams", desc: "Big Bro · Sharp · Energy", icon: "💪" },
              { id: "female", name: "Hawa", desc: "Mama · Gentle · Poetic", icon: "🌸" },
            ] as const
          ).map((o) => (
            <button
              key={o.id}
              onClick={() => {
                setVoice(o.id);
                speak(
                  o.id === "female"
                    ? "I am here, walking with you."
                    : "Yo fam, Adams in the building. Let's move!",
                  { force: true },
                );
              }}
              className={`relative overflow-hidden rounded-2xl border-2 p-5 text-left transition-all ${
                voice === o.id
                  ? "border-primary bg-primary/5 shadow-glow"
                  : "border-border/40 hover:border-primary/30 hover:bg-muted/30"
              }`}
            >
              <span className="absolute right-4 top-4 text-xl opacity-20">{o.icon}</span>
              <p className="font-bold text-lg">{o.name}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{o.desc}</p>
            </button>
          ))}
        </div>

        {/* System voice picker + tone sliders */}
        <div className="mt-5 space-y-4 rounded-xl border border-border/40 bg-background/40 p-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">
              System voice (from your phone)
            </label>
            <select
              value={voiceURI ?? ""}
              onChange={(e) => setVoiceURI(e.target.value || null)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Auto-pick (matches {voice === "female" ? "Hawa" : "Adams"})</option>
              {Array.isArray(availableVoices) &&
                availableVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} · {v.lang}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-muted-foreground">Pitch</span>
              <span className="text-muted-foreground">
                {(pitchAdj ?? 0) > 0 ? "+" : ""}
                {(pitchAdj ?? 0).toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={-0.6}
              max={0.6}
              step={0.05}
              value={pitchAdj ?? 0}
              onChange={(e) => setPitchAdj(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-muted-foreground">Speed</span>
              <span className="text-muted-foreground">
                {(rateAdj ?? 0) > 0 ? "+" : ""}
                {(rateAdj ?? 0).toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={-0.4}
              max={0.4}
              step={0.05}
              value={rateAdj ?? 0}
              onChange={(e) => setRateAdj(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <button
            onClick={() =>
              speak(
                voice === "female"
                  ? "Hello my dear, this is how I sound now."
                  : "Yo fam, peep this voice — fresh tone, locked in.",
                { force: true },
              )
            }
            className="mt-5 w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-glow active:scale-95 transition-transform"
          >
            🔊 Test System Audio
          </button>
        </div>
      </section>

      {/* DEVICE PERMISSIONS */}
      <PermissionsPanel />

      {/* THEME SELECTOR */}
      <section className="rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur shadow-sm">
        <h2 className="text-lg font-bold mb-4">Display Theme</h2>
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant={theme === "light" ? "default" : "outline"}
            onClick={() => setTheme("light")}
            className="h-12 rounded-xl"
          >
            <Sun className="mr-2 h-4 w-4" /> Academic Paper
          </Button>
          <Button
            variant={theme === "dark" ? "default" : "outline"}
            onClick={() => setTheme("dark")}
            className="h-12 rounded-xl"
          >
            <Moon className="mr-2 h-4 w-4" /> Deep Space
          </Button>
        </div>
      </section>
    </div>
  );
}
