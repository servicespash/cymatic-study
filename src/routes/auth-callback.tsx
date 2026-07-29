import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ShieldCheck, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { determineUserDashboardRoute } from "@/lib/auth-router";

export const Route = createFileRoute("/auth-callback")({
  head: () => ({ meta: [{ title: "Verifying Authentication — Cymatic Study" }] }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function handleAuthCallback() {
      try {
        console.log("AuthCallbackPage: Processing authentication tokens...");

        // 1. Check for 'code' query parameter (PKCE flow)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");

        if (code) {
          const { data: exchangeData, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error("Code exchange error:", exchangeError);
            if (isMounted) {
              setStatus("error");
              setErrorMessage(exchangeError.message);
            }
            return;
          }
          if (exchangeData.session) {
            console.log("Session established via PKCE code exchange.");
          }
        }

        // 2. Get active session (Supabase client automatically parses hash tokens like #access_token=...)
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session fetch error:", sessionError);
          if (isMounted) {
            setStatus("error");
            setErrorMessage(sessionError.message);
          }
          return;
        }

        if (session?.user) {
          const currentUser = session.user;
          console.log("Verified user session:", currentUser.id);

          // Fetch or sync school ID and profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", currentUser.id)
            .maybeSingle();

          const decision = determineUserDashboardRoute(profile, currentUser.user_metadata);

          if (decision.schoolId) {
            localStorage.setItem("cymatic_school_id", decision.schoolId);
          }

          if (isMounted) {
            setStatus("success");
            toast.success(
              `Session verified! Welcome, ${decision.roleLabel}. Redirecting to ${decision.dashboardTitle}...`,
            );

            setTimeout(() => {
              navigate({ to: decision.targetPath });
            }, 800);
          }
        } else {
          // If no session found in callback
          if (isMounted) {
            setStatus("error");
            setErrorMessage("No active session found. Please sign in with your email or username.");
          }
        }
      } catch (err: any) {
        console.error("Unexpected callback error:", err);
        if (isMounted) {
          setStatus("error");
          setErrorMessage(err?.message || "Authentication verification failed.");
        }
      }
    }

    handleAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-md items-center justify-center px-4 py-12 animate-fade-in">
      <div className="w-full rounded-3xl border border-border/80 bg-zinc-950 p-8 shadow-2xl relative overflow-hidden text-center space-y-6">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-primary border border-primary/30">
          {status === "loading" && <Loader2 className="h-8 w-8 animate-spin" />}
          {status === "success" && <CheckCircle2 className="h-8 w-8 text-emerald-400" />}
          {status === "error" && <AlertCircle className="h-8 w-8 text-red-400" />}
        </div>

        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            {status === "loading" && "Verifying Credentials..."}
            {status === "success" && "Session Verified!"}
            {status === "error" && "Verification Notice"}
          </h1>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
            {status === "loading" &&
              "Connecting to security node, fetching your profile and School ID..."}
            {status === "success" && "Redirecting you to your NCDC study dashboard..."}
            {status === "error" && (errorMessage || "Could not complete session verification.")}
          </p>
        </div>

        {status === "error" && (
          <div className="pt-2">
            <button
              onClick={() => navigate({ to: "/login" })}
              className="w-full rounded-2xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground shadow-glow hover:scale-105 transition-transform"
            >
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
