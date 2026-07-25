import { UserProfile } from "./auth-context-core";

export type UserRoleType = "admin" | "org_admin" | "teacher" | "instructor" | "independent_teacher" | "student";

export interface RouteDecision {
  targetPath: string;
  roleLabel: string;
  isInstitutional: boolean;
  schoolId: string | null;
  dashboardTitle: string;
}

/**
 * Service to calculate appropriate destination route based on User Profile & Role
 */
export function determineUserDashboardRoute(
  profile: UserProfile | null,
  userMetadata?: Record<string, any>
): RouteDecision {
  const rawRole = (profile?.role || userMetadata?.role || "student").toLowerCase();
  const schoolId =
    profile?.school_id ||
    profile?.org_id ||
    userMetadata?.school_id ||
    userMetadata?.org_id ||
    (typeof window !== "undefined" ? localStorage.getItem("cymatic_school_id") : null) ||
    null;

  const isInstitutional = Boolean(schoolId && schoolId.trim().length > 0);

  // 1. Institutional Administrator
  if (rawRole === "admin" || rawRole === "org_admin" || rawRole === "administrator") {
    return {
      targetPath: "/admin/dashboard",
      roleLabel: "Institutional Administrator",
      isInstitutional: true,
      schoolId,
      dashboardTitle: "Institutional Admin Console",
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
      targetPath: "/dashboard",
      roleLabel: isInstitutional ? "Institutional Educator" : "Independent Educator",
      isInstitutional,
      schoolId,
      dashboardTitle: "Teacher Evaluation & Marking Station",
    };
  }

  // 3. Student / Boarding Scholar / Independent Scholar
  return {
    targetPath: "/dashboard",
    roleLabel: isInstitutional ? "Boarding Scholar" : "Independent Scholar",
    isInstitutional,
    schoolId,
    dashboardTitle: isInstitutional ? "Institutional Student Hub" : "Personal Learning Workspace",
  };
}

/**
 * Automatic School Registry binding trigger for students joining a school.
 * Generates official Student Identity Code automatically upon binding.
 */
export function generateStudentRegistryCode(schoolId: string, userId: string): string {
  const cleanSchool = schoolId.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(-6);
  const cleanUser = userId.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(-4);
  return `STD-${cleanSchool}-${cleanUser}`;
}
