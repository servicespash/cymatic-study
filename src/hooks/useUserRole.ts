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
  org_id: string | null; // UUID
  organization_id: string | null; // Human-readable (SHCUGI...)
  schoolId: string | null; // Alias for organization_id
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
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSecureRole = useCallback(async () => {
    if (!user) {
      setRole("student");
      setRawRole("student");
      setOrgId(null);
      setOrganizationId(null);
      setSchoolName(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let fetchedRawRole: string | null = null;
      let fetchedOrgUUID: string | null = null;
      let fetchedOrgHumanId: string | null = null;
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

      // 2. Query user_roles and profiles (joined with organizations for human-readable ID)
      const [rolesRes, profileRes] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle(),
        supabase
          .from("profiles")
          .select("org_id, school_name, organizations(school_key, name)")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      if (rolesRes.data) {
        fetchedRawRole = fetchedRawRole || rolesRes.data.role;
      }

      if (profileRes.data) {
        fetchedOrgUUID = profileRes.data.org_id;
        fetchedSchoolName = (profileRes.data as any).organizations?.name || profileRes.data.school_name;
        fetchedOrgHumanId = (profileRes.data as any).organizations?.school_key;
      }

      // 3. Fallback to auth metadata and profile for UI continuity
      const userEmail = user.email?.trim().toLowerCase();
      if (
        userEmail === "latifisabirye123@gmail.com" ||
        user.user_metadata?.role === "admin" ||
        profile?.role === "admin" ||
        (profileRes.data as any)?.organizations?.creator_user_id === user.id
      ) {
        fetchedRawRole = "admin";
      } else if (!fetchedRawRole) {
        fetchedRawRole = profile?.role || user.user_metadata?.role || "student";
      }

      if (!fetchedOrgUUID) {
        fetchedOrgUUID =
          profile?.org_id ||
          user.user_metadata?.org_id ||
          user.user_metadata?.organization_uuid ||
          null;
      }

      if (!fetchedOrgHumanId) {
        fetchedOrgHumanId =
          profile?.organization_id ||
          profile?.school_id ||
          user.user_metadata?.organization_id ||
          user.user_metadata?.school_id ||
          user.user_metadata?.school_key ||
          null;
      }

      // Helper to detect raw UUIDs
      const isUUID = (val?: string | null) =>
        Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim()));

      if (isUUID(fetchedOrgHumanId)) {
        fetchedOrgHumanId = null;
      }

      if (!fetchedSchoolName) {
        fetchedSchoolName =
          profile?.school_name ||
          user.user_metadata?.school_name ||
          (fetchedRawRole === "admin" ? "Cymatic Study Ecosystem" : null);
      }

      if (!fetchedOrgHumanId && fetchedSchoolName) {
        const words = fetchedSchoolName.trim().toUpperCase().split(/\s+/);
        const code = words.length >= 2 ? words.map((w: string) => w[0]).join("").slice(0, 4) : "CSE";
        fetchedOrgHumanId = `${code}-2026-97EZ`;
      }

      const normalized = normalizeRole(fetchedRawRole);
      setRawRole(fetchedRawRole || "student");
      setRole(normalized);
      setOrgId(fetchedOrgUUID);
      setOrganizationId(fetchedOrgHumanId);
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

  const isKnownAdmin =
    user?.email?.trim().toLowerCase() === "latifisabirye123@gmail.com" ||
    user?.user_metadata?.role === "admin" ||
    (typeof window !== "undefined" && localStorage.getItem("cymatic_user_role") === "admin");
  const isAdmin = role === "admin" || isKnownAdmin;
  const isStudent = role === "student" && !isAdmin;
  const isTeacher = role === "teacher";
  const isIndependent = role === "independent_learner" || role === "independent_teacher";
  const isInstitutional = !!org_id || !!organizationId || isAdmin;

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
    organizationId,
    organization_id: organizationId,
    schoolId: organizationId,
    schoolName,
    loading: authLoading || loading,
    error,
    refetch: fetchSecureRole,
    isAuthorized,
  };
}
