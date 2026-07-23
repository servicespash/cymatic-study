import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Sparkles, UserPlus, Copy, Check, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Database } from "@/integrations/supabase/types";
import { useRoleRedirect } from "@/hooks/useRoleRedirect";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Join the Hub — Cymatic Study" }] }),
  component: SignupPage,
});

type Mode = "register-institution" | "student-teacher" | "independent";

const REFERRAL_STORAGE_KEY = "cymatic_signup_referral_code";

// School ID is generated server-side by register_institution RPC.

function SignupPage() {
  const navigate = useNavigate();
  useRoleRedirect();
  const [mode, setMode] = useState<Mode>("student-teacher");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [schoolName, setSchoolName] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [generatedSchoolId, setGeneratedSchoolId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("referral") ?? params.get("referral_code") ?? params.get("ref");
    if (code) {
      const trimmed = code.trim();
      setReferralCode(trimmed);
      window.localStorage.setItem(REFERRAL_STORAGE_KEY, trimmed);
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);

    const cleanEmail = email.trim();
    const cleanUsername = username.trim();
    const cleanPhone = phoneNumber.trim();
    const cleanName = name.trim();
    const cleanSchoolName = schoolName.trim();
    const cleanSchoolId = schoolId.trim().toUpperCase();
    const redirectTo = window.location.origin;
    if (typeof window !== "undefined" && referralCode) {
      window.localStorage.setItem(REFERRAL_STORAGE_KEY, referralCode.trim());
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            username: cleanUsername || null,
            school_name: mode === "register-institution" ? cleanSchoolName : null,
            phone_number: cleanPhone,
            referral_code: referralCode.trim(),
            onboarding_path: mode,
          },
          emailRedirectTo: redirectTo,
        },
      });

      if (signUpError) throw signUpError;
      if (!data.user) throw new Error("Signup did not return a user.");

      // Non-privileged profile patch (username/phone/display_name only)
      const profilePatch: Partial<Database["public"]["Tables"]["profiles"]["Update"]> = {
        username: cleanUsername || null,
        phone: cleanPhone || null,
        display_name: cleanName || null,
      };

      let afterSignupInfo: string | null = null;

      let issuedSchoolId: string | null = null;

      if (mode === "register-institution") {
        // Server-side: creates organization with auto-generated school_key
        // AND sets profile.role + org_id atomically (privileged update bypasses trigger).
        const { data: orgRes, error: rpcErr } = await supabase.rpc("register_institution", {
          _name: cleanSchoolName,
          _email: cleanEmail,
          _phone: cleanPhone || null,
        });
        if (rpcErr) throw rpcErr;
        issuedSchoolId = orgRes?.school_key ?? null;
        if (!issuedSchoolId) throw new Error("Server did not return a School ID. Please retry.");
      } else if (mode === "student-teacher") {
        if (cleanSchoolId) {
          // Use SECURITY DEFINER RPC to validate & enroll (privileged columns trigger-protected).
          const { error: enrollErr } = await supabase.rpc("enroll_self_in_school", {
            _school_key: cleanSchoolId,
            _level: "S1",
            _phone: cleanPhone || null,
          });
          if (enrollErr) {
            setInfo(
              `We couldn't link to School ID "${cleanSchoolId}". You can add it later from Settings.`,
            );
          }
        }
      }

      // Safe non-privileged profile fields
      await supabase.from("profiles").update(profilePatch).eq("user_id", data.user.id);

      if (referralCode) {
        if (data.session) {
          await supabase.rpc("record_referral", { referrer_code: referralCode.trim() });
          window.localStorage.removeItem(REFERRAL_STORAGE_KEY);
        } else {
          await supabase.rpc("record_referral", { referrer_code: referralCode.trim() });
          afterSignupInfo =
            "Your referral code is valid. Check your email to confirm your account, and the referral will be recorded once you sign in.";
        }
      }

      if (issuedSchoolId) {
        void sendInstitutionWelcomeEmail(cleanSchoolName, issuedSchoolId, cleanName, cleanEmail);
        setGeneratedSchoolId(issuedSchoolId);
        setSubmitting(false);
        return; // Block navigation so admin can copy the ID
      }

      if (data.session) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", data.user.id)
          .single();

        const role = profileData?.role || "";

        if (role === "admin" || role === "org_admin") {
          navigate({ to: "/admin/dashboard" });
        } else {
          navigate({ to: "/dashboard" });
        }
      } else {
        setInfo(
          afterSignupInfo ?? "Success! Check your email to confirm your account and join the hub.",
        );
      }
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // School ID success screen for institution admins
  if (generatedSchoolId) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-md items-center px-4 py-10">
        <div className="w-full rounded-3xl border border-primary/40 bg-card/90 p-8 shadow-card backdrop-blur animate-fade-in-up">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-hero shadow-glow">
            <Check className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Your School is registered.</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Share this <strong className="text-foreground">School ID</strong> with your teachers and
            students so they can link their accounts to{" "}
            <strong className="text-foreground">{schoolName.trim()}</strong>.
          </p>

          <div className="mt-6 rounded-2xl border-2 border-dashed border-primary/60 bg-primary/5 p-5 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              School ID
            </p>
            <p className="mt-2 font-mono text-3xl font-black tracking-widest text-foreground">
              {generatedSchoolId}
            </p>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(generatedSchoolId);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-background/60 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy ID"}
            </button>
          </div>

          <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
            Save this ID now — it's used by your school's data sync and is only generated once.
          </p>

          <button
            type="button"
            onClick={() => navigate({ to: "/settings" })}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
          >
            Continue to Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-md items-center px-4 py-10">
      <div className="w-full animate-fade-in-up rounded-3xl border border-border/60 bg-card/80 p-8 shadow-card backdrop-blur">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-hero shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Create your account</h1>
            <p className="text-xs text-muted-foreground">
              {mode === "register-institution" &&
                "Register your school and get a unique School ID."}
              {mode === "student-teacher" && "Join your school and track progress together."}
              {mode === "independent" && "Start your independent learning journey today."}
            </p>
          </div>
        </div>

        {/* 3-way mode toggle */}
        <div className="mb-6 grid grid-cols-3 p-1 bg-muted/50 rounded-xl gap-1">
          <ModeButton
            active={mode === "register-institution"}
            onClick={() => setMode("register-institution")}
          >
            Institution
          </ModeButton>
          <ModeButton
            active={mode === "student-teacher"}
            onClick={() => setMode("student-teacher")}
          >
            Student / Teacher
          </ModeButton>
          <ModeButton active={mode === "independent"} onClick={() => setMode("independent")}>
            Independent
          </ModeButton>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field
            label={mode === "register-institution" ? "Admin full name" : "Full name"}
            value={name}
            onChange={setName}
            type="text"
            required
            placeholder="e.g. Latty Adams"
          />

          {mode !== "register-institution" && (
            <Field
              label="Username (Optional)"
              value={username}
              onChange={setUsername}
              type="text"
              placeholder="e.g. latty_adams"
            />
          )}

          <Field
            label={mode === "register-institution" ? "Institution email" : "Email"}
            value={email}
            onChange={setEmail}
            type="email"
            required
            placeholder={
              mode === "register-institution" ? "admin@yourschool.ac.ug" : "you@example.com"
            }
          />

          <Field
            label={mode === "register-institution" ? "Institution phone" : "Phone Number"}
            value={phoneNumber}
            onChange={setPhoneNumber}
            type="tel"
            required={mode === "register-institution"}
            placeholder="e.g. +256 700 000000"
          />

          {mode === "register-institution" && (
            <div>
              <Field
                label="School Name"
                value={schoolName}
                onChange={setSchoolName}
                type="text"
                required
                placeholder="e.g. Latty's Cymatic SS"
              />
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                Used as your school's identity inside the Hub. A unique{" "}
                <span className="font-semibold text-primary">School ID</span> will be generated from
                this name and used by all your students, teachers and project submissions to stay
                synchronised with your institution's records.
              </p>
            </div>
          )}

          {mode === "student-teacher" && (
            <div>
              <Field
                label="School ID (Optional)"
                value={schoolId}
                onChange={(v: string) => setSchoolId(v.toUpperCase())}
                type="text"
                placeholder="e.g. LCSS-4821"
              />
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                Ask your school administrator for this ID to link your account to your institution.
                You can skip this and add it later from Settings.
              </p>
            </div>
          )}

          <div className="relative">
            <Field
              label="Password"
              value={password}
              onChange={setPassword}
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              placeholder="At least 6 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {mode !== "register-institution" && (
            <Field
              label="Referral Code (Optional)"
              value={referralCode}
              onChange={setReferralCode}
              type="text"
              placeholder="Enter friend's code"
            />
          )}

          {error && (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}
          {info && (
            <p className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth hover:scale-[1.02] disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {mode === "register-institution" ? "Register school" : "Create account"}
          </button>
        </form>

        {mode !== "register-institution" && (
          <>
            <div>
              <div className="mb-5 rounded-3xl border border-primary/20 bg-primary/5 p-4 text-sm">
                <p className="font-semibold text-primary">Quick sign up with Google or Apple</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Choose social login to skip the email confirmation bottleneck and join the Hub
                  faster.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={async () => {
                  const r = await lovable.auth.signInWithOAuth("google", {
                    redirect_uri: window.location.origin,
                  });
                  if (r.error) setError(r.error.message ?? "Google sign-in failed");
                }}
                className="border p-3 rounded-lg text-sm font-semibold hover:bg-muted"
              >
                Google
              </button>
              <button
                type="button"
                onClick={async () => {
                  const r = await lovable.auth.signInWithOAuth("apple", {
                    redirect_uri: window.location.origin,
                  });
                  if (r.error) setError(r.error.message ?? "Apple sign-in failed");
                }}
                className="border p-3 rounded-lg text-sm font-semibold hover:bg-muted"
              >
                Apple
              </button>
            </div>
          </>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`py-2 text-[11px] font-bold rounded-lg transition-all leading-tight ${
        active ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Field({ label, value, onChange, ...rest }: { label: string; value: string; onChange: (v: string) => void; [key: string]: any }) {
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

async function sendInstitutionWelcomeEmail(
  orgName: string,
  schoolKey: string,
  adminName: string,
  adminEmail: string,
) {
  try {
    await supabase.functions.invoke("welcome-institution", {
      body: JSON.stringify({
        org_name: orgName,
        school_key: schoolKey,
        admin_name: adminName,
        admin_email: adminEmail,
      }),
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Welcome email dispatch failed:", err);
  }
}
