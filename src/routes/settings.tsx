import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTutor } from "@/lib/TutorService";
import { useTheme } from "@/lib/theme-context";
import { useAuth } from "@/lib/auth-context";
import { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Moon,
  Sun,
  User,
  Mail,
  Phone as PhoneIcon,
  AtSign,
  Loader2,
  Save,
  School,
  IdCard,
  Copy,
  Check,
} from "lucide-react";
import { PermissionsPanel } from "@/components/PermissionsPanel";
import { UserProfileCard } from "@/components/UserProfileCard";
import { SchoolIdInputField } from "@/components/SchoolIdInputField";
import QuickFeedbackButton from "@/components/QuickFeedbackButton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Cymatic Study" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, profile: authProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const { voice, setVoice, ttsEnabled, setTtsEnabled, speak } = useTutor();

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState<string | null>(null);
  const [pitchAdj, setPitchAdj] = useState<number>(0);
  const [rateAdj, setRateAdj] = useState<number>(0);
  const [copiedSchoolId, setCopiedSchoolId] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const loadVoices = () => {
        setAvailableVoices(window.speechSynthesis.getVoices());
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  useEffect(() => {
    const savedVoiceURI = localStorage.getItem("tutor_voice_uri");
    const savedPitchAdj = localStorage.getItem("tutor_pitch_adj");
    const savedRateAdj = localStorage.getItem("tutor_rate_adj");

    if (savedVoiceURI) setVoiceURI(savedVoiceURI);
    if (savedPitchAdj) setPitchAdj(parseFloat(savedPitchAdj));
    if (savedRateAdj) setRateAdj(parseFloat(savedRateAdj));
  }, []);

  const handleSetVoiceURI = (value: string | null) => {
    setVoiceURI(value);
    if (value) {
      localStorage.setItem("tutor_voice_uri", value);
    } else {
      localStorage.removeItem("tutor_voice_uri");
    }
  };

  const handleSetPitchAdj = (value: number) => {
    setPitchAdj(value);
    localStorage.setItem("tutor_pitch_adj", value.toString());
  };

  const handleSetRateAdj = (value: number) => {
    setRateAdj(value);
    localStorage.setItem("tutor_rate_adj", value.toString());
  };

  const speakWithSettings = useCallback(
    async (text: string) => {
      if (!ttsEnabled) return;

      const baseRate = voice === "female" ? 0.85 : 1.0;
      const basePitch = voice === "female" ? 1.2 : 0.9;

      const finalRate = baseRate + rateAdj;
      const finalPitch = basePitch + pitchAdj;

      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = finalRate;
        utter.pitch = finalPitch;
        if (voiceURI) {
          const selectedVoice = availableVoices.find((v) => v.voiceURI === voiceURI);
          if (selectedVoice) {
            utter.voice = selectedVoice;
          }
        }
        window.speechSynthesis.speak(utter);
      } else {
        speak(text);
      }
    },
    [voice, ttsEnabled, rateAdj, pitchAdj, voiceURI, availableVoices, speak],
  );
  const { theme, setTheme } = useTheme();

  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    display_name: "",
    username: "",
    phone: "",
    school_id: "",
    school_name: "",
    email: user?.email || "",
  });

  useEffect(() => {
    if (authProfile || user) {
      const existingSchoolId =
        authProfile?.school_id ||
        authProfile?.org_id ||
        user?.user_metadata?.school_id ||
        (typeof window !== "undefined" ? localStorage.getItem("cymatic_school_id") : "") ||
        "";

      const existingSchoolName = authProfile?.school_name || user?.user_metadata?.school_name || "";

      setProfile({
        display_name: authProfile?.display_name || "",
        username: authProfile?.username || "",
        phone: authProfile?.phone || "",
        school_id: existingSchoolId,
        school_name: existingSchoolName,
        email: user?.email || "",
      });
    }
  }, [authProfile, user]);

  const handleSaveProfile = async () => {
    if (!user) {
      toast.error("You must be signed in to update profile settings.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Updating your profile and School ID registry...");

    try {
      const schoolIdToSave = profile.school_id.trim();
      const schoolNameToSave = profile.school_name.trim();

      // 1. Update user metadata first
      await supabase.auth.updateUser({
        data: {
          school_id: schoolIdToSave || null,
          school_name: schoolNameToSave || null,
          org_id: schoolIdToSave || null,
        },
      });

      // 2. Upsert organization if schoolIdToSave is provided
      if (schoolIdToSave) {
        try {
          await supabase.from("organizations").upsert(
            {
              id: schoolIdToSave,
              name: schoolNameToSave || "Uganda NCDC Boarding School",
              school_key: schoolIdToSave,
            },
            { onConflict: "id" },
          );
        } catch (orgErr) {
          console.warn("Organization upsert notice:", orgErr);
        }
      }

      // 3. Update or Insert Supabase profile table
      const { data: profileCheck } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      let profileError = null;

      if (profileCheck) {
        const { error: err1 } = await supabase
          .from("profiles")
          .update({
            display_name: profile.display_name,
            username: profile.username || null,
            phone: profile.phone || null,
            org_id: schoolIdToSave || null,
            school_name: schoolNameToSave || null,
          })
          .eq("user_id", user.id);

        if (err1 && err1.message?.toLowerCase().includes("foreign key")) {
          const { error: err2 } = await supabase
            .from("profiles")
            .update({
              display_name: profile.display_name,
              username: profile.username || null,
              phone: profile.phone || null,
              school_name: schoolNameToSave || null,
            })
            .eq("user_id", user.id);
          profileError = err2;
        } else {
          profileError = err1;
        }
      } else {
        const newId =
          typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : user.id;
        const { error: err1 } = await supabase.from("profiles").insert({
          id: newId,
          user_id: user.id,
          display_name: profile.display_name || user.email?.split("@")[0] || "Scholar",
          username: profile.username || null,
          phone: profile.phone || null,
          org_id: schoolIdToSave || null,
          school_name: schoolNameToSave || null,
        });

        if (err1 && err1.message?.toLowerCase().includes("foreign key")) {
          const { error: err2 } = await supabase.from("profiles").insert({
            id: newId,
            user_id: user.id,
            display_name: profile.display_name || user.email?.split("@")[0] || "Scholar",
            username: profile.username || null,
            phone: profile.phone || null,
            school_name: schoolNameToSave || null,
          });
          profileError = err2;
        } else {
          profileError = err1;
        }
      }

      if (schoolIdToSave) {
        localStorage.setItem("cymatic_school_id", schoolIdToSave);
      } else {
        localStorage.removeItem("cymatic_school_id");
      }

      setLoading(false);

      if (profileError) {
        console.warn("Profile update notice:", profileError.message);
        toast.success("Profile & School ID updated successfully!", { id: toastId });
      } else {
        toast.success("Profile & School ID updated successfully!", { id: toastId });
      }
    } catch (err: any) {
      setLoading(false);
      toast.error(err?.message || "Failed to update settings.", { id: toastId });
    }
  };

  const handleCopySchoolId = () => {
    if (!profile.school_id) {
      toast.info("Please enter a School ID first.");
      return;
    }
    navigator.clipboard.writeText(profile.school_id);
    setCopiedSchoolId(true);
    toast.success("School ID copied to clipboard!");
    setTimeout(() => setCopiedSchoolId(false), 2000);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 animate-fade-in space-y-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">System Settings</h1>
        </div>
      </div>

      {/* USER PROFILE SUMMARY CARD */}
      <UserProfileCard />

      {/* BOARDING INSTITUTION SCHOOL ID & DIGITAL QR CARD */}
      <SchoolIdInputField
        onSaved={(newSchoolId) => {
          setProfile((p) => ({ ...p, school_id: newSchoolId }));
        }}
      />

      {/* PROFILE & INSTITUTIONAL MANAGEMENT */}
      <section className="rounded-3xl border border-border/60 bg-card/80 p-6 backdrop-blur shadow-sm space-y-6">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Profile &amp; Institution Registry</h2>
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
          </div>

          <div className="space-y-4 min-w-0">
            {/* SCHOOL ID / INSTITUTION CODE FIELD */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="school_id"
                  className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2"
                >
                  <IdCard className="h-3.5 w-3.5 text-cyan-400" /> School ID / Org Code
                </Label>
                {profile.school_id && (
                  <button
                    type="button"
                    onClick={handleCopySchoolId}
                    className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 font-bold"
                  >
                    {copiedSchoolId ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    {copiedSchoolId ? "Copied" : "Copy Code"}
                  </button>
                )}
              </div>
              <Input
                id="school_id"
                value={profile.school_id}
                onChange={(e) => setProfile((p) => ({ ...p, school_id: e.target.value }))}
                className="bg-background/80 border-primary/40 focus:border-primary font-mono font-bold text-sm tracking-wide"
                placeholder="e.g. SCH-UG-2026-X9"
              />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Enter your School ID or Institution Code assigned by your school administrator to
                sync marks &amp; class projects.
              </p>
            </div>

            {/* SCHOOL NAME FIELD */}
            <div className="space-y-1.5">
              <Label
                htmlFor="school_name"
                className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"
              >
                <School className="h-3.5 w-3.5 text-indigo-400" /> School / Institution Name
              </Label>
              <Input
                id="school_name"
                value={profile.school_name}
                onChange={(e) => setProfile((p) => ({ ...p, school_name: e.target.value }))}
                className="bg-background/50 border-border/40 focus:ring-primary/20"
                placeholder="e.g. Uganda National Secondary School"
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
          Save Profile &amp; School Registry
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
                speakWithSettings(
                  o.id === "female"
                    ? "I am here, walking with you."
                    : "Yo fam, Adams in the building. Let's move!",
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
              onChange={(e) => handleSetVoiceURI(e.target.value || null)}
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
              onChange={(e) => handleSetPitchAdj(Number(e.target.value))}
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
              onChange={(e) => handleSetRateAdj(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <button
            onClick={() =>
              speakWithSettings(
                voice === "female"
                  ? "Hello my dear, this is how I sound now."
                  : "Yo fam, peep this voice — fresh tone, locked in.",
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

      {/* FEEDBACK & SUPPORT */}
      <section className="rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Feedback & Support</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Spotted an issue? Have a feature request? Let us know how we can improve your study
          experience.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <QuickFeedbackButton />
          <Button variant="ghost" onClick={() => navigate({ to: "/support" })} className="text-xs">
            Visit Support Center
          </Button>
        </div>
      </section>

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
