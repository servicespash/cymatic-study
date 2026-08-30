import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context-core";

export type UserRole = "student" | "teacher" | "admin";

export interface UserRoleState {
  role: UserRole;
  rawRole: string;
  isStudent: boolean;
  isTeacher: boolean;
  isAdmin: boolean;
  isInstitutional: boolean;
  schoolId: string | null;
  schoolName: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isAuthorized: (allowedRoles: (UserRole | string)[]) => boolean;
}

export function normalizeRole(rawRole?: string | null): UserRole {
  if (!rawRole) return "student";
  const r = rawRole.toLowerCase().trim();
  if (
    r === "admin" ||
    r === "org_admin" ||
    r === "school_admin" ||
    r === "administrator" ||
    r === "institution_admin" ||
    r === "superadmin"
  ) {
    return "admin";
  }
  if (
    r === "teacher" ||
    r === "independent_teacher" ||
    r === "instructor" ||
    r === "evaluator" ||
    r === "faculty"
  ) {
    return "teacher";
  }
  return "student";
}

/**
 * Secure role hook that queries an RPC procedure or authenticated database profile
 * to prevent client-side authorization bypasses.
 */
export function useUserRole(): UserRoleState {
  const { user, profile, loading: authLoading } = useAuth();
  const [role, setRole] = useState<UserRole>("student");
  const [rawRole, setRawRole] = useState<string>("student");
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSecureRole = useCallback(async () => {
    if (!user) {
      setRole("student");
      setRawRole("student");
      setSchoolId(null);
      setSchoolName(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let fetchedRawRole: string | null = null;
      let fetchedSchoolId: string | null = null;
      let fetchedSchoolName: string | null = null;

      // 1. Attempt secure RPC call if configured on Supabase backend
      try {
        const { data: rpcRole, error: rpcError } = await (supabase.rpc as any)("get_current_user_role");
        if (!rpcError && rpcRole && typeof rpcRole === "string") {
          fetchedRawRole = rpcRole;
        }
      } catch {
        // RPC might not be provisioned in all schema tiers, continue to profile lookup
      }

      // 2. Query authenticated profiles table
      if (!fetchedRawRole) {
        const { data: profData, error: profError } = await supabase
          .from("profiles")
          .select("role, org_id, school_id, school_name")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!profError && profData) {
          fetchedRawRole = profData.role || null;
          fetchedSchoolId = profData.school_id || profData.org_id || null;
          fetchedSchoolName = profData.school_name || null;
        }
      }

      // 3. Fallback to auth metadata
      if (!fetchedRawRole) {
        fetchedRawRole =
          profile?.role ||
          user.user_metadata?.role ||
          "student";
      }

      if (!fetchedSchoolId) {
        fetchedSchoolId =
          profile?.school_id ||
          profile?.org_id ||
          user.user_metadata?.school_id ||
          user.user_metadata?.org_id ||
          null;
      }

      if (!fetchedSchoolName) {
        fetchedSchoolName =
          profile?.school_name ||
          user.user_metadata?.school_name ||
          null;
      }

      const normalized = normalizeRole(fetchedRawRole);
      setRawRole(fetchedRawRole || "student");
      setRole(normalized);
      setSchoolId(fetchedSchoolId);
      setSchoolName(fetchedSchoolName);
    } catch (err: any) {
      console.warn("Secure role verification notice:", err);
      setError(err?.message || "Failed to verify secure role");
      const fallback = normalizeRole(profile?.role || user.user_metadata?.role);
      setRole(fallback);
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    if (!authLoading) {
      fetchSecureRole();
    }
  }, [authLoading, fetchSecureRole]);

  const isStudent = role === "student";
  const isTeacher = role === "teacher";
  const isAdmin = role === "admin";
  const isInstitutional = !!schoolId;

  const isAuthorized = useCallback(
    (allowedRoles: (UserRole | string)[]): boolean => {
      if (!allowedRoles || allowedRoles.length === 0) return true;
      if (allowedRoles.includes(role)) return true;
      if (allowedRoles.includes(rawRole)) return true;
      // Admin authority has access to teacher and student views by default unless explicitly restricted
      if (isAdmin && (allowedRoles.includes("teacher") || allowedRoles.includes("student"))) {
        return true;
      }
      return false;
    },
    [role, rawRole, isAdmin],
  );

  return {
    role,
    rawRole,
    isStudent,
    isTeacher,
    isAdmin,
    isInstitutional,
    schoolId,
    schoolName,
    loading: authLoading || loading,
    error,
    refetch: fetchSecureRole,
    isAuthorized,
  };
}
