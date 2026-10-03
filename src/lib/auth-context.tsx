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
        localStorage.removeItem("cymatic_org_id");
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
      const activeUser = currentUser || userRef.current || (await supabase.auth.getUser()).data.user;
      const userEmail = activeUser?.email?.trim().toLowerCase();

      // Helper to detect raw UUIDs
      const isUUID = (val?: string | null) =>
        Boolean(
          val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim()),
        );

      // 1. Fetch user's DB profile
      const { data, error } = await supabase
        .from("profiles")
        .select("*, organizations(id, school_key, name, creator_user_id, email)")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.warn("Profile query notice:", error.message);
      }

      // 2. Check for organization ownership or admin registration
      let matchedOrg: any = (data as any)?.organizations;
      if (!matchedOrg && data?.org_id && isUUID(data.org_id)) {
        try {
          const { data: orgById } = await supabase
            .from("organizations")
            .select("*")
            .eq("id", data.org_id)
            .maybeSingle();
          if (orgById) {
            matchedOrg = orgById;
          }
        } catch (orgByIdErr) {
          console.warn("Direct org lookup by org_id notice:", orgByIdErr);
        }
      }

      if (!matchedOrg) {
        try {
          const { data: orgQuery } = await supabase
            .from("organizations")
            .select("*")
            .or(`creator_user_id.eq.${userId},email.ilike.${userEmail || "none"}`)
            .maybeSingle();
          if (orgQuery) {
            matchedOrg = orgQuery;
          }
        } catch (orgErr) {
          console.warn("Org query fallback notice:", orgErr);
        }
      }

      // Check if user has admin intent from metadata, email, or profile
      const isUserAdminOwner =
        Boolean(
          matchedOrg &&
          (matchedOrg.creator_user_id === userId || matchedOrg.email?.toLowerCase() === userEmail),
        ) ||
        activeUser?.user_metadata?.role === "admin" ||
        activeUser?.user_metadata?.role === "org_admin" ||
        activeUser?.user_metadata?.role === "superadmin" ||
        activeUser?.user_metadata?.onboarding_path === "register-institution" ||
        data?.role === "admin" ||
        data?.role === "org_admin" ||
        userEmail === "latifisabirye123@gmail.com";

      // 3. School Name derivation
      let schoolNameToUse =
        matchedOrg?.name ||
        data?.school_name ||
        activeUser?.user_metadata?.school_name ||
        activeUser?.user_metadata?.school ||
        (typeof window !== "undefined" ? localStorage.getItem("cymatic_school_name") : null);

      if (isUserAdminOwner && (!schoolNameToUse || schoolNameToUse === "Your Institution")) {
        schoolNameToUse = "Cymatic Study Ecosystem";
      }

      // 4. Role derivation (ensuring admin role is strictly assigned if owner)
      const role = isUserAdminOwner
        ? "admin"
        : data?.role || activeUser?.user_metadata?.role || "student";

      // 5. Derive Database Org UUID (Relational Foreign Key)
      let orgUUID = matchedOrg?.id || data?.org_id || activeUser?.user_metadata?.org_id || null;
      if (!isUUID(orgUUID)) {
        // If org_id in metadata was accidentally a human ID, don't use it as UUID
        orgUUID =
          matchedOrg?.id ||
          (typeof window !== "undefined" ? localStorage.getItem("cymatic_org_uuid") : null);
      }

      // 6. Derive Human-Readable Organization ID (Single Source of Truth, e.g. CSE-2026-97EZ)
      let orgHumanId = matchedOrg?.school_key;
      if (isUUID(orgHumanId)) orgHumanId = null; // Filter out erroneous UUIDs

      if (!orgHumanId) {
        const candidate =
          activeUser?.user_metadata?.organization_id ||
          activeUser?.user_metadata?.school_id ||
          activeUser?.user_metadata?.school_key ||
          (typeof window !== "undefined"
            ? localStorage.getItem("cymatic_org_id") || localStorage.getItem("cymatic_school_id")
            : null);

        if (candidate && !isUUID(candidate)) {
          orgHumanId = candidate;
        }
      }

      // Auto-generate clean human-readable code if missing or for admin of known school
      if (!orgHumanId && schoolNameToUse) {
        orgHumanId = generateNcdcBoardingSchoolId(schoolNameToUse);
      }

      // 7. Ensure organization row exists in database for this admin if needed
      if (isUserAdminOwner && schoolNameToUse) {
        try {
          if (!matchedOrg) {
            // Check if organization with this school_key already exists
            const { data: existingOrgByKey } = await supabase
              .from("organizations")
              .select("*")
              .eq("school_key", orgHumanId)
              .maybeSingle();

            if (existingOrgByKey) {
              matchedOrg = existingOrgByKey;
              orgUUID = existingOrgByKey.id;
            } else {
              const newOrgUUID =
                typeof crypto !== "undefined" && crypto.randomUUID
                  ? crypto.randomUUID()
                  : undefined;
              const { data: createdOrg } = await supabase
                .from("organizations")
                .insert({
                  id: newOrgUUID,
                  name: schoolNameToUse,
                  school_key: orgHumanId,
                  creator_user_id: userId,
                  email: userEmail,
                })
                .select()
                .maybeSingle();

              if (createdOrg) {
                matchedOrg = createdOrg;
                orgUUID = createdOrg.id;
              }
            }
          } else if (
            matchedOrg &&
            (!matchedOrg.school_key ||
              isUUID(matchedOrg.school_key) ||
              matchedOrg.school_key !== orgHumanId)
          ) {
            // Update organization school_key to match current clean ID
            await supabase
              .from("organizations")
              .update({ school_key: orgHumanId, name: schoolNameToUse })
              .eq("id", matchedOrg.id);
          }
        } catch (orgSyncErr) {
          console.warn("Admin organization sync notice:", orgSyncErr);
        }
      }

      // 8. Update profiles table to ensure consistency if role or org_id changed
      if (data) {
        if (
          data.role !== role ||
          (orgUUID && data.org_id !== orgUUID) ||
          (schoolNameToUse && data.school_name !== schoolNameToUse)
        ) {
          try {
            await (supabase as any).from("profiles").upsert(
              {
                user_id: userId,
                role: role,
                org_id: orgUUID || data.org_id,
                school_name: schoolNameToUse || data.school_name,
              },
              { onConflict: "user_id" },
            );
          } catch (upsertErr) {
            console.warn("Profile sync upsert notice:", upsertErr);
          }
        }
      } else if (isUserAdminOwner) {
        // Create profile row for admin if missing
        try {
          await (supabase as any).from("profiles").upsert(
            {
              user_id: userId,
              role: "admin",
              org_id: orgUUID,
              school_name: schoolNameToUse,
              display_name:
                activeUser?.user_metadata?.full_name || userEmail?.split("@")[0] || "Admin",
            },
            { onConflict: "user_id" },
          );
        } catch (pErr) {
          console.warn("New admin profile creation notice:", pErr);
        }
      }

      // 9. Sync localStorage with clean IDs
      if (typeof window !== "undefined") {
        if (orgUUID) localStorage.setItem("cymatic_org_uuid", orgUUID);
        if (orgHumanId) {
          localStorage.setItem("cymatic_org_id", orgHumanId);
          localStorage.setItem("cymatic_school_id", orgHumanId);
        }
        if (schoolNameToUse) {
          localStorage.setItem("cymatic_school_name", schoolNameToUse);
        }
      }

      const constructedProfile: UserProfile = {
        user_id: userId,
        display_name:
          data?.display_name ||
          activeUser?.user_metadata?.full_name ||
          userEmail?.split("@")[0] ||
          "Scholar",
        avatar_url: data?.avatar_url || activeUser?.user_metadata?.avatar_url || null,
        role: role,
        org_id: orgUUID,
        organization_id: orgHumanId,
        school_id: orgHumanId,
        school_name: schoolNameToUse,
        teacher_license_id: data?.teacher_license_id || null,
        full_name:
          data?.display_name ||
          (data as any)?.full_name ||
          activeUser?.user_metadata?.full_name ||
          null,
        username: data?.username || activeUser?.email?.split("@")[0] || null,
        phone: data?.phone || activeUser?.user_metadata?.phone_number || null,
      };

      setProfile(constructedProfile);

      // 10. Sync user metadata in session
      if (
        activeUser &&
        (activeUser.user_metadata?.role !== role ||
          activeUser.user_metadata?.organization_id !== orgHumanId ||
          activeUser.user_metadata?.school_id !== orgHumanId ||
          activeUser.user_metadata?.school_name !== schoolNameToUse)
      ) {
        void supabase.auth.updateUser({
          data: {
            role: role,
            org_id: orgUUID,
            organization_uuid: orgUUID,
            organization_id: orgHumanId,
            school_id: orgHumanId,
            school_name: schoolNameToUse,
          },
        });
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
  const userEmail = user?.email?.trim().toLowerCase();
  const isKnownAdmin =
    userEmail === "latifisabirye123@gmail.com" ||
    user?.user_metadata?.role === "admin" ||
    profile?.role === "admin" ||
    user?.user_metadata?.onboarding_path === "register-institution" ||
    (typeof window !== "undefined" && localStorage.getItem("cymatic_user_role") === "admin");

  const rawRole =
    (isKnownAdmin ? "admin" : profile?.role || user?.user_metadata?.role) ||
    (typeof window !== "undefined" ? localStorage.getItem("cymatic_user_role") : null) ||
    "student";
  const role: UserRole = isKnownAdmin ? "admin" : normalizeRole(rawRole);

  const org_id =
    profile?.org_id ||
    user?.user_metadata?.org_id ||
    (typeof window !== "undefined" ? localStorage.getItem("cymatic_org_uuid") : null);

  let schoolName =
    profile?.school_name ||
    user?.user_metadata?.school_name ||
    (typeof window !== "undefined" ? localStorage.getItem("cymatic_school_name") : null);
  if (isKnownAdmin && (!schoolName || schoolName === "Your Institution")) {
    schoolName = "Cymatic Study Ecosystem";
  }

  let organizationId =
    profile?.organization_id ||
    profile?.school_id ||
    user?.user_metadata?.organization_id ||
    user?.user_metadata?.school_id ||
    (typeof window !== "undefined"
      ? localStorage.getItem("cymatic_org_id") || localStorage.getItem("cymatic_school_id")
      : null);

  const isUUID = (val?: string | null) =>
    Boolean(
      val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim()),
    );
  if (isUUID(organizationId)) {
    organizationId = null;
  }
  if (!organizationId && isKnownAdmin) {
    organizationId = generateNcdcBoardingSchoolId(schoolName || "Cymatic Study Ecosystem");
  }

  const isAdmin = role === "admin" || isKnownAdmin;
  const isStudent = role === "student" && !isAdmin;
  const isTeacher = role === "teacher";
  const isInstitutional = !!org_id || !!organizationId || isAdmin;
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
      org_id,
      organizationId,
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
      org_id,
      organizationId,
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
