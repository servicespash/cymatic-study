import { useEffect, useState, useCallback, useMemo, type ReactNode } from "react";
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
    try {
      await supabase.auth.signOut();
      if (typeof window !== "undefined") {
        localStorage.removeItem("cymatic_school_id");
      }
      setSession(null);
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error("Sign-out error:", err);
    }
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
        fetchProfile(s.user.id, s.user);
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
        fetchProfile(initialSession.user.id, initialSession.user);
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

  const fetchProfile = async (userId: string, currentUser?: User | null) => {
    try {
      console.log("Fetching profile for userId:", userId);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      const activeUser = currentUser || user;
      const metaSchoolId =
        activeUser?.user_metadata?.school_id ||
        activeUser?.user_metadata?.org_id ||
        (typeof window !== "undefined" ? localStorage.getItem("cymatic_school_id") : null);

      const metaSchoolName =
        activeUser?.user_metadata?.school_name || activeUser?.user_metadata?.school;

      if (error) {
        console.error("Profile fetch error:", error);
      }

      if (data) {
        let schoolIdToUse = data.org_id || data.school_id || metaSchoolId || null;
        let schoolNameToUse = data.school_name || metaSchoolName || null;
        const role = data.role || "student";

        // Auto-generate for admin/org_admin if missing
        if ((role === "admin" || role === "org_admin") && !schoolIdToUse) {
          schoolIdToUse = `SCH-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
          if (!schoolNameToUse) {
            schoolNameToUse = `${data.display_name || "Admin"}'s Academy`;
          }
          // Persist back to profiles table
          supabase
            .from("profiles")
            .update({
              school_id: schoolIdToUse,
              org_id: schoolIdToUse,
              school_name: schoolNameToUse,
            })
            .eq("user_id", userId)
            .then(({ error }) => {
              if (error) console.error("Error auto-updating admin school ID:", error);
            });
        }

        if (schoolIdToUse && typeof window !== "undefined") {
          localStorage.setItem("cymatic_school_id", schoolIdToUse);
        }

        const constructedProfile: UserProfile = {
          user_id: data.user_id,
          display_name: data.display_name || activeUser?.email?.split("@")[0] || "Scholar",
          avatar_url: data.avatar_url,
          role: role,
          org_id: schoolIdToUse,
          school_name: schoolNameToUse,
          school_id: schoolIdToUse,
          teacher_license_id: data.teacher_license_id,
          full_name: data.display_name,
          username: data.username || activeUser?.email?.split("@")[0] || null,
          phone: data.phone || null,
        };
        setProfile(constructedProfile);
      } else {
        let schoolIdToUse = metaSchoolId || null;
        let schoolNameToUse = metaSchoolName || null;
        const role = activeUser?.user_metadata?.role || "student";

        // Auto-generate profile and school ID for missing admin profiles
        if ((role === "admin" || role === "org_admin") && !schoolIdToUse) {
          schoolIdToUse = `SCH-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
          schoolNameToUse = `${activeUser?.user_metadata?.full_name || "Admin"}'s Academy`;

          supabase
            .from("profiles")
            .upsert({
              user_id: userId,
              school_id: schoolIdToUse,
              org_id: schoolIdToUse,
              school_name: schoolNameToUse,
              role: role,
              display_name:
                activeUser?.user_metadata?.full_name ||
                activeUser?.email?.split("@")[0] ||
                "Scholar",
            })
            .then(({ error }) => {
              if (error)
                console.error("Error upserting admin profile with generated school ID:", error);
            });
        }

        if (schoolIdToUse && typeof window !== "undefined") {
          localStorage.setItem("cymatic_school_id", schoolIdToUse);
        }

        const fallbackProfile: UserProfile = {
          user_id: userId,
          display_name:
            activeUser?.user_metadata?.full_name || activeUser?.email?.split("@")[0] || "Scholar",
          avatar_url: activeUser?.user_metadata?.avatar_url || null,
          role: role,
          org_id: schoolIdToUse,
          school_name: schoolNameToUse,
          school_id: schoolIdToUse,
          teacher_license_id: null,
          full_name: activeUser?.user_metadata?.full_name || null,
          username: activeUser?.email?.split("@")[0] || null,
          phone: null,
        };
        setProfile(fallbackProfile);
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

  const value: AuthCtx = useMemo(
    () => ({
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
    }),
    [
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
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const AppProvider = AuthProvider;
