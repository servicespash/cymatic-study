import { UserProfile } from "./auth-context-core";

export type UserRoleType =
  "admin" | "org_admin" | "teacher" | "instructor" | "independent_teacher" | "student";

export interface RouteDecision {
  targetPath: string;
  roleLabel: string;
  isInstitutional: boolean;
  schoolId: string | null;
  dashboardTitle: string;
  isAuthorized: boolean;
  mismatchReason?: string;
}

/**
 * Service to calculate appropriate destination route based on User Profile & Role
 */
export function determineUserDashboardRoute(
  profile: UserProfile | null,
  userMetadata?: Record<string, any>,
): RouteDecision {
  const rawRole = (profile?.role || userMetadata?.role || "student").toLowerCase();
  
  // Relational Anchor (UUID)
  const profileOrgUUID = profile?.org_id;
  const metaOrgUUID = userMetadata?.org_id || userMetadata?.organization_uuid;

  // Identity Anchor (SHCUGI...)
  const profileOrgHumanId = profile?.organization_id || profile?.school_id;
  const metaOrgHumanId = userMetadata?.organization_id || userMetadata?.school_id || userMetadata?.school_key;

  const orgUUID = profileOrgUUID || metaOrgUUID || null;
  const orgHumanId = 
    profileOrgHumanId || 
    metaOrgHumanId || 
    (typeof window !== "undefined" ? localStorage.getItem("cymatic_org_id") || localStorage.getItem("cymatic_school_id") : null) ||
    null;

  const isInstitutional = Boolean(orgUUID || (orgHumanId && orgHumanId.trim().length > 0));

  // VALIDATION: Strict org identification check for institutional users
  const isInstitutionalRole = ["admin", "org_admin", "teacher", "instructor", "faculty"].includes(
    rawRole,
  );
  let isAuthorized = true;
  let mismatchReason: string | undefined;

  if (isInstitutionalRole && !orgUUID && !orgHumanId) {
    isAuthorized = false;
    mismatchReason = "Institutional role detected without valid School ID or Organization linkage.";
  }

  // 1. Institutional Administrator
  if (rawRole === "admin" || rawRole === "org_admin" || rawRole === "administrator") {
    return {
      targetPath: isAuthorized ? "/admin/dashboard" : "/onboarding",
      roleLabel: "Institutional Administrator",
      isInstitutional: true,
      schoolId: orgHumanId || orgUUID,
      dashboardTitle: "Institutional Admin Console",
      isAuthorized,
      mismatchReason,
    };
  }

  // 2. Faculty / Educator / Teacher
  if (
    rawRole === "teacher" ||
    rawRole === "instructor" ||
    rawRole === "independent_teacher" ||
    rawRole === "faculty"
  ) {
    return {
      targetPath: isAuthorized ? "/dashboard" : "/onboarding",
      roleLabel: isInstitutional ? "Institutional Educator" : "Independent Educator",
      isInstitutional,
      schoolId: orgHumanId || orgUUID,
      dashboardTitle: "Teacher Evaluation & Marking Station",
      isAuthorized,
      mismatchReason,
    };
  }

  // 3. Student / Boarding Scholar / Independent Scholar
  return {
    targetPath: "/dashboard",
    roleLabel: isInstitutional ? "Boarding Scholar" : "Independent Scholar",
    isInstitutional,
    schoolId: orgHumanId || orgUUID,
    dashboardTitle: isInstitutional ? "Institutional Student Hub" : "Personal Learning Workspace",
    isAuthorized: true, // Students are usually authorized to see dashboard even if not institutional
  };
}

/**
 * Automatic School Registry binding trigger for students joining a school.
 * Generates official Student Identity Code automatically upon binding.
 */
export function generateStudentRegistryCode(schoolId: string, userId: string): string {
  const cleanSchool = schoolId
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase()
    .slice(-6);
  const cleanUser = userId
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase()
    .slice(-4);
  return `STD-${cleanSchool}-${cleanUser}`;
}
