import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context-core";

export type UserRole = "student" | "teacher" | "admin" | "org_admin" | "independent_learner" | "independent_teacher";

export interface UserRoleState {
  role: UserRole; rawRole: string; isStudent: boolean; isTeacher: boolean; isAdmin: boolean;
  isOrgAdmin: boolean; isIndependent: boolean; isInstitutional: boolean;
  organizationId: string | null; org_id: string | null; schoolName: string | null;
  loading: boolean; error: string | null; refetch: () => Promise<void>;
  isAuthorized: (allowedRoles: (UserRole | string)[]) => boolean;
}

export function normalizeRole(rawRole?: string | null): UserRole {
  if (!rawRole) return "student";
  const r = rawRole.toLowerCase().trim();
  if (r === "org_admin" || r === "school_admin") return "org_admin";
  if (r === "admin" || r === "administrator" || r === "institution_admin" || r === "superadmin") return "admin";
  if (r === "independent_learner") return "independent_learner";
  if (r === "independent_teacher") return "independent_teacher";
  if (r === "teacher" || r === "instructor" || r === "evaluator" || r === "faculty") return "teacher";
  return "student";
}

/** Authorization comes from user_roles. Tutor persona is never an authorization signal. */
export function useUserRole(): UserRoleState {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<UserRole>("student");
  const [rawRole, setRawRole] = useState("student");
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSecureRole = useCallback(async () => {
    if (!user) {
      setRole("student"); setRawRole("student"); setOrganizationId(null); setSchoolName(null); setLoading(false); return;
    }
    setLoading(true); setError(null);
    try {
      const [{ data: roles, error: roleError }, { data: profile, error: profileError }] = await Promise.all([
        supabase.from("user_roles").select("role, organization_id, created_at").eq("user_id", user.id).order("created_at", { ascending: true }),
        supabase.from("profiles").select("organization_id, school_name").eq("user_id", user.id).maybeSingle(),
      ]);
      if (roleError) throw roleError;
      if (profileError) throw profileError;
      const primary = roles?.[0];
      const authoritativeRole = String(primary?.role ?? "student");
      const authoritativeOrg = primary?.organization_id ?? profile?.organization_id ?? null;
      setRawRole(authoritativeRole);
      setRole(normalizeRole(authoritativeRole));
      setOrganizationId(authoritativeOrg);
      setSchoolName(profile?.school_name ?? null);
    } catch (err: any) {
      setError(err?.message || "Failed to verify secure role");
      setRole("student"); setRawRole("student"); setOrganizationId(null);
    } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { if (!authLoading) void fetchSecureRole(); }, [authLoading, fetchSecureRole]);

  const isStudent = role === "student";
  const isTeacher = role === "teacher";
  const isOrgAdmin = role === "org_admin";
  const isAdmin = role === "admin" || isOrgAdmin;
  const isIndependent = role === "independent_learner" || role === "independent_teacher";
  const isInstitutional = !isIndependent;
  const isAuthorized = useCallback((allowed: (UserRole | string)[]) => {
    if (!allowed?.length) return true;
    if (allowed.includes(role) || allowed.includes(rawRole)) return true;
    return isAdmin && (allowed.includes("teacher") || allowed.includes("student"));
  }, [role, rawRole, isAdmin]);

  return { role, rawRole, isStudent, isTeacher, isAdmin, isOrgAdmin, isIndependent, isInstitutional,
    organizationId, org_id: organizationId, schoolName, loading: authLoading || loading, error,
    refetch: fetchSecureRole, isAuthorized };
}
