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
  const profileSchoolId = profile?.school_id || profile?.org_id;
  const metaSchoolId = userMetadata?.school_id || userMetadata?.org_id;
  
  const schoolId =
    profileSchoolId ||
    metaSchoolId ||
    (typeof window !== "undefined" ? localStorage.getItem("cymatic_school_id") : null) ||
    null;

  const isInstitutional = Boolean(schoolId && schoolId.trim().length > 0);
  
  // VALIDATION: Strict school_id check for institutional users
  const isInstitutionalRole = ["admin", "org_admin", "teacher", "instructor", "faculty"].includes(rawRole);
  let isAuthorized = true;
  let mismatchReason: string | undefined;

  if (isInstitutionalRole && !schoolId) {
    isAuthorized = false;
    mismatchReason = "Institutional role detected without valid School ID or Organization linkage.";
  }

  if (profileSchoolId && metaSchoolId && profileSchoolId !== metaSchoolId) {
    // Optional: Log potential role/org mismatch
    console.warn("Security Notice: Profile school_id does not match Auth metadata school_id.");
  }

  // 1. Institutional Administrator
  if (rawRole === "admin" || rawRole === "org_admin" || rawRole === "administrator") {
    return {
      targetPath: isAuthorized ? "/admin/dashboard" : "/onboarding",
      roleLabel: "Institutional Administrator",
      isInstitutional: true,
      schoolId,
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
      schoolId,
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
    schoolId,
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
