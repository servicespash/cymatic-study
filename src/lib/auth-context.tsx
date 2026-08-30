import { useEffect, useState, useCallback, useMemo, useRef, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { Ctx, type AuthCtx, type UserProfile } from "./auth-context-core";
import { normalizeRole, type UserRole } from "@/hooks/useUserRole";
import { notifications } from "@/lib/notifications";

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
      notifications.signOutSuccess();
    } catch (err) {
      console.error("Sign-out error:", err);
    }
  }, []);

  const userRef = useRef<User | null>(null);
  userRef.current = user;

  const fetchProfile = useCallback(async (userId: string, currentUser?: User | null) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      const activeUser = currentUser || userRef.current;
      const metaSchoolId =
        activeUser?.user_metadata?.school_id ||
        activeUser?.user_metadata?.org_id ||
        (typeof window !== "undefined" ? localStorage.getItem("cymatic_school_id") : null);

      const metaSchoolName =
        activeUser?.user_metadata?.school_name || activeUser?.user_metadata?.school;

      if (error) {
        console.warn("Profile query notice:", error.message);
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
          supabase
            .from("profiles")
            .update({
              school_id: schoolIdToUse,
              org_id: schoolIdToUse,
              school_name: schoolNameToUse,
            })
            .eq("user_id", userId)
            .then(({ error: updateErr }) => {
              if (updateErr) console.warn("Error auto-updating admin school ID:", updateErr);
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
            .then(({ error: upsertErr }) => {
              if (upsertErr)
                console.warn("Error upserting admin profile with generated school ID:", upsertErr);
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
      console.warn("Profile fetch exception:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id, user);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id, s.user);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        fetchProfile(initialSession.user.id, initialSession.user);
      } else {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  useEffect(() => {
    if (!user || typeof window === "undefined") return;
    const pendingReferralCode = window.localStorage.getItem(REFERRAL_STORAGE_KEY);
    if (!pendingReferralCode?.trim()) return;

    const applyPendingReferral = async () => {
      try {
        await (supabase.rpc as any)("record_referral", {
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

  // Derive granular role flags
  const rawRole = profile?.role || user?.user_metadata?.role || "student";
  const role: UserRole = normalizeRole(rawRole);

  const schoolId = profile?.school_id || profile?.org_id || user?.user_metadata?.school_id || null;
  const schoolName = profile?.school_name || user?.user_metadata?.school_name || null;

  const isStudent = role === "student";
  const isTeacher = role === "teacher";
  const isAdmin = role === "admin";
  const isInstitutional = !!schoolId;
  const isGuestMode = !loading && !user;

  const hasRole = useCallback(
    (allowed: UserRole | string | (UserRole | string)[]) => {
      const list = Array.isArray(allowed) ? allowed : [allowed];
      if (list.includes(role)) return true;
      if (list.includes(rawRole)) return true;
      if (isAdmin && (list.includes("teacher") || list.includes("student"))) return true;
      return false;
    },
    [role, rawRole, isAdmin],
  );

  const isAuthorized = useCallback(
    (allowed: (UserRole | string)[]) => {
      return hasRole(allowed);
    },
    [hasRole],
  );

  const value: AuthCtx = useMemo(
    () => ({
      user,
      session,
      loading,
      profile,
      role,
      rawRole,
      isInstitutional,
      isStudent,
      isTeacher,
      isAdmin,
      isGuestMode,
      schoolId,
      schoolName,
      signOut,
      refreshProfile,
      hasRole,
      isAuthorized,
    }),
    [
      user,
      session,
      loading,
      profile,
      role,
      rawRole,
      isInstitutional,
      isStudent,
      isTeacher,
      isAdmin,
      isGuestMode,
      schoolId,
      schoolName,
      signOut,
      refreshProfile,
      hasRole,
      isAuthorized,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const AppProvider = AuthProvider;
export default AuthProvider;
