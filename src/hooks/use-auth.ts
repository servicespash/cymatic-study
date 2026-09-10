import { useCallback, useMemo } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useAuth as useCoreAuth } from "@/lib/auth-context-core";
import { normalizeRole, type UserRole } from "./useUserRole";
import { notifications } from "@/lib/notifications";

export interface SignUpParams {
  email: string;
  password?: string;
  role?: UserRole | string;
  fullName?: string;
  schoolId?: string;
  schoolName?: string;
  level?: string;
}

export interface SignInCredentials {
  email: string;
  password?: string;
  redirectTo?: string;
}

export function useAuth() {
  const core = useCoreAuth();

  const user = core.user;
  const session = core.session;
  const loading = core.loading;
  const profile = core.profile;

  const rawRole = profile?.role || user?.user_metadata?.role || "student";
  const role: UserRole = normalizeRole(rawRole);

  const organizationId = core.organizationId;

  const isStudent = role === "student";
  const isTeacher = role === "teacher";
  const isAdmin = role === "admin";
  const isInstitutional = !!organizationId;
  const isGuestMode = !loading && !user;

  // Sign In with password or OTP magic link
  const signIn = useCallback(async ({ email, password, redirectTo }: SignInCredentials) => {
    try {
      if (password) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          notifications.authError(error);
          return { data: null, error };
        }
        notifications.authSuccess(
          data.user?.user_metadata?.full_name || email.split("@")[0],
          data.user?.user_metadata?.role || "student",
        );
        return { data, error: null };
      } else {
        const { data, error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo:
              redirectTo || (typeof window !== "undefined" ? window.location.origin : undefined),
          },
        });
        if (error) {
          notifications.authError(error);
          return { data: null, error };
        }
        notifications.info("Magic link sent", "Check your email for the instant login link.");
        return { data, error: null };
      }
    } catch (err: any) {
      notifications.authError(err);
      return { data: null, error: err };
    }
  }, []);

  // Sign Up with custom metadata and role attribution
  const signUp = useCallback(
    async ({
      email,
      password,
      role = "student",
      fullName,
      schoolId,
      schoolName,
      level,
    }: SignUpParams) => {
      try {
        const metadata = {
          role,
          full_name: fullName,
          school_id: schoolId,
          school_name: schoolName,
          level: level || "Senior 3",
        };

        if (password) {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: metadata,
            },
          });
          if (error) {
            notifications.authError(error);
            return { data: null, error };
          }
          notifications.signUpSuccess(email, role);
          return { data, error: null };
        } else {
          const { data, error } = await supabase.auth.signInWithOtp({
            email,
            options: {
              data: metadata,
              emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
            },
          });
          if (error) {
            notifications.authError(error);
            return { data: null, error };
          }
          notifications.info(
            "Confirmation email sent",
            "Check your inbox to complete your account setup.",
          );
          return { data, error: null };
        }
      } catch (err: any) {
        notifications.authError(err);
        return { data: null, error: err };
      }
    },
    [],
  );

  // Sign Out cleanly
  const signOut = useCallback(async () => {
    await core.signOut();
    notifications.signOutSuccess();
  }, [core]);

  // Helper to test if active user has permitted role
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

  return useMemo(
    () => ({
      user,
      session,
      profile,
      role,
      rawRole,
      loading,
      isStudent,
      isTeacher,
      isAdmin,
      isInstitutional,
      isGuestMode,
      organizationId,
      signIn,
      signUp,
      signOut,
      hasRole,
    }),
    [
      user,
      session,
      profile,
      role,
      rawRole,
      loading,
      isStudent,
      isTeacher,
      isAdmin,
      isInstitutional,
      isGuestMode,
      organizationId,
      signIn,
      signUp,
      signOut,
      hasRole,
    ],
  );
}

export type { UserRole };
export default useAuth;
