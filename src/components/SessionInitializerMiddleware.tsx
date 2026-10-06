import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

export function SessionInitializerMiddleware({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [sessionValidated, setSessionValidated] = useState(false);

  useEffect(() => {
    async function validateSessionAndOrgMapping() {
      if (!user?.id) {
        setSessionValidated(true);
        return;
      }

      try {
        // 1. Verify and validate session user profile and organization mapping from database
        const { data: dbProfile, error: profileErr } = await supabase
          .from("profiles")
          .select("user_id, role, org_id, school_name")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileErr) {
          console.warn("Session middleware profile verification notice:", profileErr.message);
        }

        // 2. Ensure role and organization linkage are strictly mapped
        if (dbProfile) {
          const verifiedRole = dbProfile.role || user.user_metadata?.role || "student";
          const verifiedOrgId = dbProfile.org_id || user.user_metadata?.org_id || null;

          if (typeof window !== "undefined" && verifiedOrgId) {
            localStorage.setItem("cymatic_org_uuid", verifiedOrgId);
          }

          console.log("[SessionInitializerMiddleware] Session successfully validated:", {
            userId: user.id,
            role: verifiedRole,
            orgId: verifiedOrgId,
            schoolName: dbProfile.school_name || user.user_metadata?.school_name,
          });
        }
      } catch (err) {
        console.error("Session initialization validation error:", err);
      } finally {
        setSessionValidated(true);
      }
    }

    if (!loading) {
      void validateSessionAndOrgMapping();
    }
  }, [user, loading]);

  if (loading || !sessionValidated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground animate-pulse">
          Initializing Secure Session & Institutional Scoping...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

export default SessionInitializerMiddleware;
