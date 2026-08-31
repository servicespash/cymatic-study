import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import {
  Loader2,
  Sparkles,
  UserPlus,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  QrCode,
  ArrowLeft,
  GraduationCap,
  Briefcase,
  ShieldAlert,
  Compass,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useRoleRedirect } from "@/hooks/useRoleRedirect";
import { toast } from "sonner";
import { QRScannerModal } from "@/components/QRScannerModal";
import { validateNcdcSchoolId } from "@/lib/school-id-validator";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Join the Hub — Cymatic Study" }] }),
  component: SignupPage,
});

type Mode = "register-institution" | "join-teacher" | "join-student" | "independent_learner" | "independent_teacher";

const REFERRAL_STORAGE_KEY = "cymatic_signup_referral_code";

function SignupPage() {
  const navigate = useNavigate();
  useRoleRedirect();
  
  // Multi-step state: step 1 = Choose Path, step 2 = Fill Details
  const [step, setStep] = useState<1 | 2>(1);
  const [mode, setMode] = useState<Mode>("join-student");
  
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
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("referral") ?? params.get("referral_code") ?? params.get("ref");
    if (code) {
      const trimmed = code.trim();
      setReferralCode(trimmed);
      window.localStorage.setItem(REFERRAL_STORAGE_KEY, trimmed);
    }

    const schoolIdParam = params.get("school_id") ?? params.get("schoolId") ?? params.get("school");
    if (schoolIdParam) {
      const cleanedId = schoolIdParam.trim();
      setSchoolId(cleanedId);
      setMode("join-student");
      setStep(2); // Jump straight to step 2 if URL contains school_id
      window.localStorage.setItem("cymatic_school_id", cleanedId);
      toast.info(`Pre-filled School ID: ${cleanedId}`);
    }
  }, []);

  const handleModeSelection = (selectedMode: Mode) => {
    setMode(selectedMode);
    setStep(2);
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    setError(null);
    setInfo(null);

    // Strict school ID validation for student and teacher signups
    if (mode === "join-teacher" || mode === "join-student") {
      const validation = validateNcdcSchoolId(schoolId);
      if (!validation.isValid) {
        setError(validation.error || "Invalid School ID");
        toast.error(validation.error || "Please enter a valid School ID");
        return;
      }
    }

    setSubmitting(true);
    const toastId = toast.loading("Creating your account on the Hub...");

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
      const mappedRole = 
        mode === "register-institution" ? "admin" :
        mode === "join-teacher" ? "teacher" :
        mode === "join-student" ? "student" :
        mode === "independent_teacher" ? "independent_teacher" : "independent_learner";

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
            role: mappedRole,
          },
          emailRedirectTo: redirectTo,
        },
      });

      if (signUpError) throw signUpError;
      if (!data.user) throw new Error("Signup did not return a user.");

      // Safe non-privileged profile values update
      const profilePatch: any = {
        username: cleanUsername || null,
        phone: cleanPhone || null,
        display_name: cleanName || null,
        role: mappedRole,
      };

      let afterSignupInfo: string | null = null;
      let issuedSchoolId: string | null = null;

      if (mode === "register-institution") {
        const { data: orgRes, error: rpcErr } = await (supabase as any).rpc("register_institution", {
          _name: cleanSchoolName,
          _email: cleanEmail,
          _phone: cleanPhone || null,
        });
        if (rpcErr) throw rpcErr;
        issuedSchoolId = (orgRes as any)?.school_key ?? (orgRes as any)?.key ?? null;
        if (!issuedSchoolId) throw new Error("Server did not return a School ID. Please retry.");
      } else if (mode === "join-teacher" || mode === "join-student") {
        if (cleanSchoolId) {
          const { error: enrollErr } = await (supabase as any).rpc("enroll_self_in_school", {
            _school_key: cleanSchoolId,
            _level: "S1",
            _phone: cleanPhone || null,
          });
          if (enrollErr) {
            setInfo(`We couldn't link to School ID "${cleanSchoolId}". You can bind manually later inside Settings.`);
          }
        }
      }

      await (supabase as any).from("profiles").update(profilePatch).eq("user_id", data.user.id);

      if (referralCode) {
        if (data.session) {
          await (supabase as any).rpc("record_referral", { referrer_code: referralCode.trim() });
          window.localStorage.removeItem(REFERRAL_STORAGE_KEY);
        } else {
          await (supabase as any).rpc("record_referral", { referrer_code: referralCode.trim() });
          afterSignupInfo = "Referral code recorded. Check your email to confirm your account and sync your referral status.";
        }
      }

      if (issuedSchoolId) {
        void sendInstitutionWelcomeEmail(cleanSchoolName, issuedSchoolId, cleanName, cleanEmail);
        setGeneratedSchoolId(issuedSchoolId);
        setSubmitting(false);
        toast.success("School registered successfully!", { id: toastId });
        return;
      }

      if (data.session) {
        toast.success("Account created successfully!", { id: toastId });
        if (mappedRole === "admin" || mappedRole === "org_admin") {
          navigate({ to: "/admin/dashboard" });
        } else {
          navigate({ to: "/dashboard" });
        }
      } else {
        const msg = afterSignupInfo ?? "Success! Check your email to confirm your account and join the Hub.";
        setInfo(msg);
        toast.success(msg, { id: toastId });
      }
    } catch (err: any) {
      const errMsg = err?.message ?? "Something went wrong. Please try again.";
      setError(errMsg);
      toast.error(errMsg, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  if (generatedSchoolId) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-md items-center px-4 py-10">
        <div className="w-full rounded-3xl border border-primary/40 bg-card/90 p-8 shadow-card backdrop-blur animate-fade-in-up">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-hero shadow-glow">
            <Check className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Institution Registered</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Share this professional <strong className="text-foreground">School ID</strong> with your teachers and
            students so they can securely link their profiles to <strong className="text-foreground">{schoolName.trim()}</strong>.
          </p>

          <div className="mt-6 rounded-2xl border-2 border-dashed border-primary/60 bg-primary/5 p-5 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Institution Code</p>
            <p className="mt-2 font-mono text-3xl font-black tracking-widest text-foreground">{generatedSchoolId}</p>
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
            Save this ID. It represents your high-integrity institutional data silo.
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
    <div className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-lg items-center px-4 py-10">
      <div className="w-full animate-fade-in-up rounded-3xl border border-border/60 bg-card/80 p-8 shadow-card backdrop-blur">
        
        {step === 1 ? (
          <div>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-hero shadow-glow">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Select Your Path</h1>
                <p className="text-xs text-muted-foreground">Choose how you wish to register on the Cymatic Study Hub</p>
              </div>
            </div>

            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Institutional Roles</h3>
            <div className="grid gap-3 mb-6">
              <PathCard
                title="Student Registry Path"
                desc="Join your school classes, review project rubrics and build your continuous portfolio."
                icon={GraduationCap}
                onClick={() => handleModeSelection("join-student")}
              />
              <PathCard
                title="Teacher Verification Path"
                desc="Assess continuous activities, submit grades and manage students under your school's ID."
                icon={Briefcase}
                onClick={() => handleModeSelection("join-teacher")}
              />
              <PathCard
                title="Institutional Administrator"
                desc="Register your school, manage active rosters, verify teachers and secure academic silos."
                icon={ShieldAlert}
                onClick={() => handleModeSelection("register-institution")}
              />
            </div>

            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Independent Paths</h3>
            <div className="grid gap-3">
              <PathCard
                title="Independent Global Learner"
                desc="Access advanced study resources, continuous self-assessments and grow independently."
                icon={Compass}
                onClick={() => handleModeSelection("independent_learner")}
              />
              <PathCard
                title="Independent Educator"
                desc="Teach, review public curriculum alignment, and evaluate academic content globally."
                icon={Briefcase}
                onClick={() => handleModeSelection("independent_teacher")}
              />
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
            </p>
          </div>
        ) : (
          <div>
            <button
              onClick={() => {
                setStep(1);
                setError(null);
              }}
              className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Choose a different role
            </button>

            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-hero shadow-glow">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Account Details</h1>
                <p className="text-xs text-muted-foreground">
                  {mode === "register-institution" && "Provide institutional details to generate your School ID."}
                  {mode === "join-teacher" && "Sign up and link directly to your school's verified space."}
                  {mode === "join-student" && "Complete details and enter your student credentials."}
                  {(mode === "independent_learner" || mode === "independent_teacher") && "Provide details to establish your independent workspace."}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Field
                label={mode === "register-institution" ? "Administrator Full Name" : "Your Full Name"}
                value={name}
                onChange={setName}
                type="text"
                required
                placeholder="e.g. Latty Adams"
              />

              {mode !== "register-institution" && (
                <Field
                  label="Unique Username"
                  value={username}
                  onChange={setUsername}
                  type="text"
                  required
                  placeholder="e.g. latty_adams"
                />
              )}

              <Field
                label={mode === "register-institution" ? "Official Institution Email" : "Your Email Address"}
                value={email}
                onChange={setEmail}
                type="email"
                required
                placeholder={mode === "register-institution" ? "admin@yourschool.ac.ug" : "you@example.com"}
              />

              <Field
                label="Primary Phone Number"
                value={phoneNumber}
                onChange={setPhoneNumber}
                type="tel"
                required={mode === "register-institution"}
                placeholder="e.g. +256 700 000000"
              />

              {mode === "register-institution" && (
                <div>
                  <Field
                    label="School/Institution Name"
                    value={schoolName}
                    onChange={setSchoolName}
                    type="text"
                    required
                    placeholder="e.g. Cymatic Secondary Academy"
                  />
                  <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                    Your institutional space will generate a clean alphanumeric code (e.g. <span className="font-semibold text-primary">CSAA-1234</span>) that binds students and teachers directly to your database silo.
                  </p>
                </div>
              )}

              {(mode === "join-student" || mode === "join-teacher") && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      School ID / Code <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsScannerOpen(true)}
                      className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      Scan Badge QR
                    </button>
                  </div>
                  <input
                    value={schoolId}
                    onChange={(e) => {
                      setSchoolId(e.target.value.toUpperCase());
                      setError(null);
                    }}
                    type="text"
                    required
                    placeholder="e.g. LCSS-4128"
                    className="w-full rounded-lg border border-input bg-background/60 px-3.5 py-2.5 text-sm text-foreground outline-none transition-smooth focus:border-primary focus:ring-2 focus:ring-primary/30 font-mono tracking-wider uppercase"
                  />
                  <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                    Must follow format <span className="font-semibold">XXXX-0000</span>. Ask your administrator for the alphanumeric code.
                  </p>
                </div>
              )}

              <div className="relative">
                <Field
                  label="Choose Secure Password"
                  value={password}
                  onChange={setPassword}
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
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
                  placeholder="Referral alphanumeric code"
                />
              )}

              {error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3 text-left">
                  <p className="text-xs font-medium text-destructive leading-relaxed">{error}</p>
                </div>
              )}
              {info && (
                <p className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary leading-normal">
                  {info}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth hover:scale-[1.02] disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                {mode === "register-institution" ? "Register Institution" : "Create Account"}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
            </p>
          </div>
        )}
      </div>

      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(scannedId) => {
          setSchoolId(scannedId);
          setIsScannerOpen(false);
          toast.success("School ID scanned successfully!");
        }}
      />
    </div>
  );
}

function PathCard({
  title,
  desc,
  icon: Icon,
  onClick,
}: {
  title: string;
  desc: string;
  icon: any;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      className="flex items-start text-left gap-4 p-4 border border-border/60 hover:border-primary/50 hover:bg-primary/5 rounded-2xl transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
    >
      <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h4 className="font-bold text-sm text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  [key: string]: any;
}) {
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
