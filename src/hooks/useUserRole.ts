import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context-core";

export type UserRole =
  "student" | "teacher" | "admin" | "independent_learner" | "independent_teacher";

export interface UserRoleState {
  role: UserRole;
  rawRole: string;
  isStudent: boolean;
  isTeacher: boolean;
  isAdmin: boolean;
  isIndependent: boolean;
  isInstitutional: boolean;
  org_id: string | null;
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
  if (r === "independent_learner") return "independent_learner";
  if (r === "independent_teacher") return "independent_teacher";

  if (r === "teacher" || r === "instructor" || r === "evaluator" || r === "faculty") {
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
  const [org_id, setOrgId] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSecureRole = useCallback(async () => {
    if (!user) {
      setRole("student");
      setRawRole("student");
      setOrgId(null);
      setSchoolName(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let fetchedRawRole: string | null = null;
      let fetchedOrgId: string | null = null;
      let fetchedSchoolName: string | null = null;

      // 1. Attempt secure RPC call (Source of Truth)
      try {
        const { data: rpcRole, error: rpcError } = await supabase.rpc("get_current_user_role");
        if (!rpcError && rpcRole) {
          fetchedRawRole = rpcRole;
        }
      } catch (rpcErr) {
        console.warn("RPC role lookup failed, falling back to table query", rpcErr);
      }

      // 2. Query user_roles and profiles
      const [rolesRes, profileRes] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle(),
        supabase
          .from("profiles")
          .select("org_id, school_name")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      if (rolesRes.data) {
        fetchedRawRole = fetchedRawRole || rolesRes.data.role;
      }

      if (profileRes.data) {
        fetchedOrgId = (profileRes.data as any).org_id;
        fetchedSchoolName = profileRes.data.school_name;
      }

      // 3. Fallback to auth metadata for UI continuity
      if (!fetchedRawRole) {
        fetchedRawRole = profile?.role || user.user_metadata?.role || "student";
      }

      if (!fetchedOrgId) {
        fetchedOrgId =
          profile?.org_id ||
          user.user_metadata?.org_id ||
          user.user_metadata?.organization_id ||
          user.user_metadata?.school_id ||
          null;
      }

      const normalized = normalizeRole(fetchedRawRole);
      setRawRole(fetchedRawRole || "student");
      setRole(normalized);
      setOrgId(fetchedOrgId);
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
  const isIndependent = role === "independent_learner" || role === "independent_teacher";
  const isInstitutional = !isIndependent;

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
    isIndependent,
    isInstitutional,
    org_id,
    schoolId: org_id,
    schoolName,
    loading: authLoading || loading,
    error,
    refetch: fetchSecureRole,
    isAuthorized,
  };
}
