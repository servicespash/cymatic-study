import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent, useEffect } from "react";
import { Loader2, Sparkles, School, Phone, Trophy, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Complete Your Profile — Cymatic Hub" }] }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [schoolKey, setSchoolKey] = useState("");
  const [level, setLevel] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
    if (user?.user_metadata?.org_id && user?.user_metadata?.level) {
      navigate({ to: "/dashboard" });
    }
  }, [user, loading, navigate]);

  const isInstitutional =
    typeof window !== "undefined" && sessionStorage.getItem("login_mode") === "institutional";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { data, error: rpcError } = await (supabase.rpc as any)("enroll_self_in_school", {
      _school_key: isInstitutional ? schoolKey.trim() : null,
      _level: level,
      _phone: phoneNumber.trim() || null,
    });

    if (rpcError) {
      setError(rpcError.message || "Could not complete onboarding.");
      setSubmitting(false);
      return;
    }

    await supabase.auth.updateUser({
      data: {
        school_name: data?.org_name ?? null,
        phone_number: phoneNumber.trim(),
        level,
      },
    });

    setSubmitting(false);
    navigate({ to: "/dashboard" });
  };

  if (loading) return null;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-md items-center px-4 py-10">
      <div className="w-full animate-fade-in-up rounded-3xl border border-border/60 bg-card/80 p-8 shadow-card backdrop-blur">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-hero shadow-glow">
            <Trophy className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Make Your School Proud</h1>
            <p className="text-xs text-muted-foreground">
              Map your profile to your school and stream.
            </p>
          </div>
        </div>
        {!isInstitutional && (
          <div className="mb-4 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary">
            Independent Learning Space — no School ID is required for your onboarding.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isInstitutional && (
            <div className="relative">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                School ID
              </label>
              <input
                value={schoolKey}
                onChange={(e) => setSchoolKey(e.target.value.toUpperCase())}
                required
                placeholder="Enter the School ID issued by your institution"
                className="w-full rounded-lg border border-input bg-background/60 px-3.5 py-2.5 text-sm font-mono tracking-wider text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">
                Ask your head teacher / school admin for the official School ID.
              </p>
            </div>
          )}

          <div className="relative">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Academic Level (Stream)
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              required
              className="w-full rounded-lg border border-input bg-background/60 px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            >
              <option value="">-- Select Level --</option>
              {["S1", "S2", "S3", "S4", "S5", "S6"].map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Field
              label="Phone Number"
              value={phoneNumber}
              onChange={setPhoneNumber}
              type="tel"
              required
              placeholder="07..."
            />
            <p className="mt-1 text-[10px] text-primary italic">
              Unlock exclusive reward access. 📱
            </p>
          </div>

          {error && (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !level || !phoneNumber || (isInstitutional && !schoolKey)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth hover:scale-[1.02] disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Finish & Enter Hub
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, ...rest }: any) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-input bg-background/60 px-3.5 py-2.5 text-sm text-foreground outline-none transition-smooth focus:border-primary focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}
