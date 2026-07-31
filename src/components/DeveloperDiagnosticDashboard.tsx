import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Terminal,
  Key,
  Database,
  Lock,
  Unlock,
} from "lucide-react";
import { toast } from "sonner";

export function DeveloperDiagnosticDashboard() {
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<{
    connection: { status: "idle" | "ok" | "error"; message?: string };
    authSession: { status: "idle" | "ok" | "error"; details?: any; message?: string };
    staffTableQuery: { status: "idle" | "ok" | "error"; record?: any; message?: string };
    rlsValidation: { status: "idle" | "ok" | "warning" | "error"; message?: string };
  }>({
    connection: { status: "idle" },
    authSession: { status: "idle" },
    staffTableQuery: { status: "idle" },
    rlsValidation: { status: "idle" },
  });

  const runDiagnostics = async () => {
    setLoading(true);
    const newResults = { ...results };

    // 1. Connection Health
    try {
      const start = Date.now();
      const { data, error } = await supabase
        .from("profiles")
        .select("count", { count: "exact", head: true });
      const duration = Date.now() - start;
      if (error && !error.message.includes("does not exist")) {
        newResults.connection = {
          status: "error",
          message: `Supabase connected with error: ${error.message} (${duration}ms)`,
        };
      } else {
        newResults.connection = {
          status: "ok",
          message: `Supabase connection active (${duration}ms response time).`,
        };
      }
    } catch (err: any) {
      newResults.connection = { status: "error", message: err.message || "Connection failed." };
    }

    // 2. Auth Session & Token Check
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (sessionError || userError) {
        newResults.authSession = {
          status: "error",
          message: sessionError?.message || userError?.message,
        };
      } else if (sessionData.session) {
        newResults.authSession = {
          status: "ok",
          details: {
            email: sessionData.session.user.email,
            role: sessionData.session.user.role || "authenticated",
            expiresAt: new Date(sessionData.session.expires_at! * 1000).toLocaleString(),
          },
          message: `Active session token verified for ${sessionData.session.user.email}`,
        };
      } else {
        newResults.authSession = {
          status: "ok",
          message: "No active user session found (Anonymous / Unauthenticated visitor).",
        };
      }
    } catch (err: any) {
      newResults.authSession = { status: "error", message: err.message };
    }

    // 3. Fetch single record from staff / profiles table
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, role")
        .limit(1)
        .maybeSingle();

      if (error) {
        newResults.staffTableQuery = {
          status: "error",
          message: `Query failed: ${error.message} (RLS policy check)`,
        };
      } else if (data) {
        newResults.staffTableQuery = {
          status: "ok",
          record: data,
          message: `Successfully fetched personnel record: ${data.full_name || data.email} (${data.role})`,
        };
      } else {
        newResults.staffTableQuery = {
          status: "ok",
          message: "Profiles/Staff table is accessible but currently empty.",
        };
      }
    } catch (err: any) {
      newResults.staffTableQuery = { status: "error", message: err.message };
    }

    // 4. RLS Policy Validation for Staff & Admin Roles
    try {
      // Test if querying user_roles or profiles triggers recursion or errors
      const { error: roleCheckError } = await supabase.from("user_roles").select("role").limit(1);
      if (roleCheckError && roleCheckError.message.includes("infinite recursion")) {
        newResults.rlsValidation = {
          status: "error",
          message:
            "CRITICAL: Infinite recursion detected in 'user_roles' RLS policy! Needs SECURITY DEFINER fix.",
        };
      } else {
        newResults.rlsValidation = {
          status: "ok",
          message:
            "Personnel and role RLS policies evaluated successfully without recursion lockups.",
        };
      }
    } catch (err: any) {
      newResults.rlsValidation = {
        status: "warning",
        message: `RLS check note: ${err.message}`,
      };
    }

    setResults(newResults);
    setLoading(false);
    toast.success("Developer diagnostics completed.");
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Terminal className="w-6 h-6 text-primary" />
            Developer Diagnostic & Supabase Health Console
          </h2>
          <p className="text-sm text-muted-foreground">
            Verify Supabase connection health, token persistence, personnel table RLS access, and
            policy safety.
          </p>
        </div>
        <button
          onClick={() => void runDiagnostics()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Running Diagnostics..." : "Run Diagnostics Check"}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Connection Health */}
        <div className="p-4 rounded-lg border border-border bg-background/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm flex items-center gap-2 text-foreground">
                <Database className="w-4 h-4 text-blue-500" />
                Supabase Connection Health
              </span>
              {results.connection.status === "ok" ? (
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Operational
                </span>
              ) : results.connection.status === "error" ? (
                <span className="flex items-center gap-1 text-xs text-rose-500 font-medium">
                  <AlertTriangle className="w-4 h-4" /> Issue Detected
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Pending</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {results.connection.message || "Click 'Run Diagnostics Check' to test database ping."}
            </p>
          </div>
        </div>

        {/* Auth Token & Session */}
        <div className="p-4 rounded-lg border border-border bg-background/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm flex items-center gap-2 text-foreground">
                <Key className="w-4 h-4 text-amber-500" />
                Auth Token & Session Status
              </span>
              {results.authSession.status === "ok" ? (
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Verified
                </span>
              ) : results.authSession.status === "error" ? (
                <span className="flex items-center gap-1 text-xs text-rose-500 font-medium">
                  <AlertTriangle className="w-4 h-4" /> Token Error
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Pending</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              {results.authSession.message || "Checks active session token and expiration."}
            </p>
            {results.authSession.details && (
              <div className="text-[11px] font-mono bg-muted p-2 rounded text-muted-foreground">
                Email: {results.authSession.details.email} <br />
                Expires: {results.authSession.details.expiresAt}
              </div>
            )}
          </div>
        </div>

        {/* Staff Table Query */}
        <div className="p-4 rounded-lg border border-border bg-background/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm flex items-center gap-2 text-foreground">
                <Shield className="w-4 h-4 text-purple-500" />
                Staff Table Policy Access
              </span>
              {results.staffTableQuery.status === "ok" ? (
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Accessible
                </span>
              ) : results.staffTableQuery.status === "error" ? (
                <span className="flex items-center gap-1 text-xs text-rose-500 font-medium">
                  <AlertTriangle className="w-4 h-4" /> RLS Blocked
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Pending</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              {results.staffTableQuery.message ||
                "Fetches a single record from 'profiles' to confirm policy access."}
            </p>
            {results.staffTableQuery.record && (
              <div className="text-[11px] font-mono bg-muted p-2 rounded text-muted-foreground">
                Record: {JSON.stringify(results.staffTableQuery.record, null, 2)}
              </div>
            )}
          </div>
        </div>

        {/* RLS Policy Validation */}
        <div className="p-4 rounded-lg border border-border bg-background/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm flex items-center gap-2 text-foreground">
                <Lock className="w-4 h-4 text-emerald-500" />
                RLS Recursion & Role Safety
              </span>
              {results.rlsValidation.status === "ok" ? (
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Safe
                </span>
              ) : results.rlsValidation.status === "error" ? (
                <span className="flex items-center gap-1 text-xs text-rose-500 font-medium">
                  <AlertTriangle className="w-4 h-4" /> Recursion Error
                </span>
              ) : results.rlsValidation.status === "warning" ? (
                <span className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                  <Unlock className="w-4 h-4" /> Note
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Pending</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {results.rlsValidation.message ||
                "Validates staff and admin role policies against infinite loops."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
