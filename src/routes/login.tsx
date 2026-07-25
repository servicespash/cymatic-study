import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import {
  Loader2,
  LogIn,
  Sparkles,
  Building,
  User,
  School,
  ArrowLeft,
  Eye,
  EyeOff,
  Gauge,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth-context";
import { useRoleRedirect } from "@/hooks/useRoleRedirect";
import { determineUserDashboardRoute } from "@/lib/auth-router";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Cymatic Study" }] }),
  component: LoginPage,
});

type LoginMode = "init" | "institutional" | "independent";
type Role = string;

const ROLES = {
  institutional: ["School Organization/Admin", "Teacher", "Student"],
  independent: ["Independent Student", "Independent Teacher/Private Tutor", "Independent Parent"],
};

function LoginPage() {
  const navigate = useNavigate();
  const { user, loading, profile } = useAuth();
  useRoleRedirect();

  const [mode, setMode] = useState<LoginMode>("init");
  const [role, setRole] = useState<Role | null>(null);
  const [schoolId, setSchoolId] = useState("");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirection is now handled by useRoleRedirect hook

  const saveToSession = () => {
    sessionStorage.setItem("login_mode", mode);
    if (role) sessionStorage.setItem("login_role", role);
    if (schoolId) sessionStorage.setItem("login_school_id", schoolId);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (mode === "institutional" && !role) {
      setError("Please select a role.");
      toast.error("Please select a role before proceeding.");
      return;
    }
    if (mode === "independent" && !role) {
      setError("Please select a role.");
      toast.error("Please select a role before proceeding.");
      return;
    }

    setError(null);
    setSubmitting(true);
    saveToSession();

    const toastId = toast.loading("Authenticating and verifying session...");

    const cleanIdentifier = identifier.trim();
    let emailToUse = cleanIdentifier;

    // Save School ID to local storage immediately if provided in institutional mode
    if (schoolId.trim()) {
      localStorage.setItem("cymatic_school_id", schoolId.trim());
    }

    // Resolve identifier if it's not an email
    if (!cleanIdentifier.includes("@")) {
      try {
        const { data: resolution, error: resolveError } = await supabase.rpc("resolve_identifier", {
          identifier: cleanIdentifier,
        });

        if (resolveError) {
          console.error("Resolution RPC error:", resolveError);
          const msg = resolveError.message?.includes("not found")
            ? "Auth System Error: Resolution function missing. Please apply SQL migrations in Supabase Dashboard."
            : `Account resolution failed: ${resolveError.message}`;
          setError(msg);
          toast.error(msg, { id: toastId });
          setSubmitting(false);
          return;
        }

        if (!resolution) {
          const msg = "No account found with that username or phone. Use your email to sign in.";
          setError(msg);
          toast.error(msg, { id: toastId });
          setSubmitting(false);
          return;
        }

        const res = resolution as { type: string; email?: string };

        if (typeof res === "string") {
          emailToUse = res;
        } else if (res.type === "email") {
          emailToUse = res.email || "";
        } else if (res.type === "organization") {
          const msg = "That looks like a School ID, not a login username. Please sign in with the associated email address.";
          setError(msg);
          toast.error(msg, { id: toastId });
          setSubmitting(false);
          return;
        } else {
          const msg = "No account found with that username or phone. Use your email to sign in.";
          setError(msg);
          toast.error(msg, { id: toastId });
          setSubmitting(false);
          return;
        }
      } catch (err: any) {
        console.error("Resolution unexpected error:", err);
        const msg = "An unexpected error occurred. Please use your email to sign in directly.";
        setError(msg);
        toast.error(msg, { id: toastId });
        setSubmitting(false);
        return;
      }
    }

    try {
      const { data: signInData, error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: password.trim(),
      });

      setSubmitting(false);

      if (error) {
        let errMsg = error.message;
        if (
          error.message?.toLowerCase().includes("failed to fetch") ||
          error.message?.toLowerCase().includes("fetch failed") ||
          error.message?.toLowerCase().includes("networkerror")
        ) {
          errMsg = "Authentication server unreachable (Failed to fetch). Check your Supabase environment variables or continue as Guest.";
        } else if (error.message.includes("Invalid login credentials")) {
          errMsg = "Invalid email, username or password. Please check your credentials and try again.";
        } else if (error.message.includes("Email not confirmed")) {
          errMsg = "Your email address has not been confirmed yet. Please check your inbox for the confirmation link.";
        }
        setError(errMsg);
        toast.error(errMsg, { id: toastId });
      } else if (signInData.user) {
        toast.success("Successfully authenticated! Verifying metadata & role...", { id: toastId });

        // Normalize selected role if provided in UI or session
        const selectedRoleStr = role || sessionStorage.getItem("login_role");
        let metaRole = signInData.user.user_metadata?.role;

        if (selectedRoleStr) {
          const rLower = selectedRoleStr.toLowerCase();
          if (rLower.includes("admin") || rLower.includes("org")) {
            metaRole = "admin";
          } else if (rLower.includes("teacher") || rLower.includes("tutor")) {
            metaRole = "teacher";
          } else {
            metaRole = "student";
          }
        }

        // Sync school ID & role to user metadata and profiles table immediately
        try {
          const updateData: Record<string, any> = {};
          if (schoolId.trim()) {
            updateData.school_id = schoolId.trim();
            updateData.org_id = schoolId.trim();
          }
          if (metaRole) {
            updateData.role = metaRole;
          }

          if (Object.keys(updateData).length > 0) {
            await supabase.auth.updateUser({ data: updateData });
            await supabase
              .from("profiles")
              .update({
                org_id: schoolId.trim() || undefined,
                role: metaRole || undefined,
              })
              .eq("user_id", signInData.user.id);
          }
        } catch (e) {
          console.warn("Notice syncing metadata role after login:", e);
        }

        // Fetch latest profile & compute destination route
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", signInData.user.id)
          .maybeSingle();

        const mergedMeta = { ...signInData.user.user_metadata, role: metaRole || signInData.user.user_metadata?.role };
        const decision = determineUserDashboardRoute(profileData, mergedMeta);

        if (decision.schoolId) {
          localStorage.setItem("cymatic_school_id", decision.schoolId);
        }

        toast.info(`Welcome, ${decision.roleLabel}! Redirecting to ${decision.dashboardTitle}...`);
        navigate({ to: decision.targetPath });
      }
    } catch (err: any) {
      setSubmitting(false);
      console.error("Sign-in exception:", err);
      const msg = "Network or authentication error (Failed to fetch). You can continue to explore as Guest.";
      setError(msg);
      toast.error(msg, { id: toastId });
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    saveToSession();
    setError(null);
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError(result.error.message ?? "Sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  };

  if (mode === "init") {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-md items-center px-4 py-10 animate-fade-in">
        <div className="w-full rounded-3xl border border-border bg-zinc-950 p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-cyan-500/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl" />

          <h1 className="text-2xl font-black mb-1 text-white tracking-tight">Choose Access Mode</h1>
          <p className="text-xs text-zinc-500 mb-6">
            Master Uganda's new NCDC curriculum with active study
          </p>

          <div className="grid gap-4">
            <button
              onClick={() => {
                setMode("institutional");
                setRole(null);
              }}
              className="p-5 rounded-2xl border border-zinc-800 hover:border-cyan-500/60 bg-zinc-900/60 text-left transition group"
            >
              <Building className="h-6 w-6 text-cyan-400 mb-2 group-hover:scale-105 transition-transform" />
              <h3 className="font-bold text-white text-sm">Institutional Connection</h3>
              <p className="text-xs text-zinc-400 mt-1">
                For students, teachers, and admins part of a registered school.
              </p>
            </button>

            <button
              onClick={() => {
                setMode("independent");
                setRole(null);
              }}
              className="p-5 rounded-2xl border border-zinc-800 hover:border-indigo-500/60 bg-zinc-900/60 text-left transition group"
            >
              <User className="h-6 w-6 text-indigo-400 mb-2 group-hover:scale-105 transition-transform" />
              <h3 className="font-bold text-white text-sm">Independent / Solo Mode</h3>
              <p className="text-xs text-zinc-400 mt-1">
                For self-directed scholars and single-user study environments.
              </p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-md items-center px-4 py-10">
      <div className="w-full animate-fade-in-up rounded-3xl border border-border bg-card p-8 shadow-card">
        <button
          onClick={() => setMode("init")}
          className="flex items-center gap-1 text-xs text-muted-foreground mb-6 hover:text-primary"
        >
          <ArrowLeft className="h-3 w-3" /> Back
        </button>

        <div className="mb-6 space-y-4">
          <div className="rounded-3xl border border-primary/20 bg-primary/5 p-4 text-sm">
            <p className="font-semibold text-primary">Quick sign in with Google or Apple</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Use social login to avoid extra password or email verification friction and get into
              the Hub faster.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              className="border p-3 rounded-lg text-sm font-semibold hover:bg-muted"
            >
              Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuth("apple")}
              className="border p-3 rounded-lg text-sm font-semibold hover:bg-muted"
            >
              Apple
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {ROLES[mode as "institutional" | "independent"].map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`p-3 rounded-xl border text-sm font-bold ${role === r ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
              >
                {r}
              </button>
            ))}
          </div>
          {mode === "institutional" && (
            <div>
              <input
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value.toUpperCase())}
                placeholder="Enter School ID (Optional)"
                className="w-full rounded-lg border p-3 text-sm font-mono tracking-wider"
              />
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                Add your institution's <span className="font-semibold text-primary">School ID</span>{" "}
                to keep your account in sync with your school's records. Skip it if you don't have
                one yet — you can link it later from Settings.
              </p>
            </div>
          )}
          {mode === "independent" && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
              Independent Learning Space selected. You do not need a School ID to continue.
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full rounded-lg border p-3 text-sm"
            placeholder="Email, username or phone"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border p-3 text-sm pr-10"
              placeholder="Password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-primary-foreground p-3 rounded-lg font-bold"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/dashboard" })}
            className="w-full bg-muted hover:bg-muted/80 text-foreground p-3 rounded-lg font-semibold text-xs border border-border transition-colors mt-2"
          >
            Continue as Guest (Offline Mode)
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/signup" className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
