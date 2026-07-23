import { useEffect, useState, useCallback, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Ctx, type AuthCtx, type UserProfile } from "./auth-context-core";

const REFERRAL_STORAGE_KEY = "cymatic_signup_referral_code";

export { useAuth } from "./auth-context-core";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  useEffect(() => {
    console.log("AuthProvider: Initializing standard flow...");

    // 1. Set up listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      console.log("AuthProvider: Auth state changed:", _event, !!s?.user);
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    // 2. Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      console.log("AuthProvider: Initial session found:", !!initialSession);
      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        fetchProfile(initialSession.user.id);
      } else {
        console.log("AuthProvider: No initial session, setting loading false");
        setLoading(false);
      }
    });

    return () => {
      console.log("AuthProvider: Unsubscribing...");
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user || typeof window === "undefined") return;
    const pendingReferralCode = window.localStorage.getItem(REFERRAL_STORAGE_KEY);
    if (!pendingReferralCode?.trim()) return;

    const applyPendingReferral = async () => {
      try {
        await supabase.rpc("record_referral", {
          referrer_code: pendingReferralCode.trim(),
        });
      } catch (err) {
        console.warn("Failed to apply stored referral code:", err);
      } finally {
        window.localStorage.removeItem(REFERRAL_STORAGE_KEY);
      }
    };

    void applyPendingReferral();
  }, [user]);

  const fetchProfile = async (userId: string) => {
    try {
      console.log("Fetching profile for userId:", userId);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Profile fetch error:", error);
      } else {
        console.log("Profile fetch result:", data);
        if (data) {
          setProfile(data);
        }
      }
    } catch (err) {
      console.error("Profile fetch exception:", err);
    } finally {
      console.log("Setting loading to false");
      setLoading(false);
    }
  };

  // Determine actual roles based on actual DB profile
  const finalRole = profile?.role || "";
  const isInstitutional = !!profile?.org_id;
  const isStudent = finalRole === "student" || (!finalRole && isInstitutional);
  const isTeacher =
    finalRole === "teacher" || finalRole === "independent_teacher" || finalRole === "instructor";
  const isAdmin =
    finalRole === "admin" ||
    finalRole === "school_admin" ||
    finalRole === "org_admin" ||
    finalRole === "administrator" ||
    finalRole === "institution_admin";

  const isGuestMode = !loading && !user;

  const value: AuthCtx = {
    user,
    session,
    loading,
    profile,
    isInstitutional,
    isStudent,
    isTeacher,
    isAdmin,
    isGuestMode,
    signOut,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
