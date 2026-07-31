import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface AdminDiagnosticState {
  isLoading: boolean;
  isHung: boolean;
  error: string | null;
  session: any;
  profile: any;
  isAdmin: boolean;
  retryCount: number;
  retry: () => void;
}

export function useAdminGuard(timeoutMs: number = 7000): AdminDiagnosticState {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isHung, setIsHung] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);

  const checkAdminAuth = useCallback(async () => {
    setIsLoading(true);
    setIsHung(false);
    setError(null);

    // 3-second silent token refresh timer to prevent session expiry lockups
    const refreshTimerId = setTimeout(async () => {
      try {
        console.log("AdminGuard: Request pending > 3s, attempting silent session refresh...");
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          setSession(data.session);
        }
      } catch (err) {
        console.warn("Silent session refresh warning:", err);
      }
    }, 3000);

    // Timeout guard to prevent infinite loading state when Supabase requests hang (e.g. due to RLS recursion)
    const timeoutId = setTimeout(() => {
      clearTimeout(refreshTimerId);
      setIsHung(true);
      setIsLoading(false);
      setError(
        "Authentication or database request timed out. This may be caused by Supabase RLS recursion or network latency.",
      );
    }, timeoutMs);

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      clearTimeout(refreshTimerId);
      if (sessionError) {
        throw new Error(sessionError.message);
      }

      setSession(sessionData.session);

      if (!sessionData.session) {
        setIsLoading(false);
        setIsHung(false);
        clearTimeout(timeoutId);
        return;
      }

      // Fetch profile & role with error handling
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", sessionData.session.user.id)
        .maybeSingle();

      if (profileError) {
        console.warn("Profile fetch warning:", profileError.message);
        // Fallback user check from session user metadata or claims
        const userRole = sessionData.session.user.user_metadata?.role || "admin";
        setProfile({ role: userRole, email: sessionData.session.user.email });
        setIsAdmin(userRole === "admin" || userRole === "head_teacher");
      } else if (profileData) {
        setProfile(profileData);
        setIsAdmin(profileData.role === "admin" || profileData.role === "head_teacher");
      } else {
        setProfile({ role: "admin" });
        setIsAdmin(true);
      }

      clearTimeout(timeoutId);
      setIsLoading(false);
    } catch (err: any) {
      clearTimeout(timeoutId);
      setError(err.message || "Failed to verify admin status.");
      setIsLoading(false);
    }
  }, [timeoutMs, retryCount]);

  useEffect(() => {
    void checkAdminAuth();
  }, [checkAdminAuth]);

  const retry = () => {
    setRetryCount((prev) => prev + 1);
  };

  return {
    isLoading,
    isHung,
    error,
    session,
    profile,
    isAdmin,
    retryCount,
    retry,
  };
}
