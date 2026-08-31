import React, { type ReactNode, useMemo } from "react";
import { useAuth } from "@/lib/auth-context-core";
import { normalizeRole, type UserRole } from "@/hooks/useUserRole";

export interface RoleGateProps {
  /**
   * List of permitted roles (e.g. ['teacher', 'admin'])
   */
  allowedRoles?: (UserRole | string)[];
  /**
   * Convenience flag to require admin role
   */
  requireAdmin?: boolean;
  /**
   * Convenience flag to require teacher role (or admin)
   */
  requireTeacher?: boolean;
  /**
   * Convenience flag to require student role
   */
  requireStudent?: boolean;
  /**
   * Convenience flag to check if user is associated with an institution/school
   */
  requireInstitutional?: boolean;
  /**
   * Convenience flag to check if user is independent
   */
  requireIndependent?: boolean;
  /**
   * Allow guest/unauthenticated users (useful for public/preview blocks)
   */
  allowGuest?: boolean;
  /**
   * Invert authorization condition (e.g., show only to users WITHOUT this role or guests)
   */
  invert?: boolean;
  /**
   * UI to display if authorization check evaluates to false (defaults to null)
   */
  fallback?: ReactNode;
  /**
   * Optional loading placeholder while role or auth is resolving
   */
  loadingFallback?: ReactNode;
  /**
   * Children node or render function receiving auth context
   */
  children?: ReactNode | ((auth: ReturnType<typeof useAuth>) => ReactNode);
}

/**
 * Reusable RoleGate wrapper component that conditionally displays
 * or hides UI elements (like 'Teacher Tools', 'Admin Panel', etc.) based on
 * the active user's role from the authentication context.
 */
export function RoleGate({
  allowedRoles,
  requireAdmin = false,
  requireTeacher = false,
  requireStudent = false,
  requireInstitutional = false,
  requireIndependent = false,
  allowGuest = false,
  invert = false,
  fallback = null,
  loadingFallback = null,
  children,
}: RoleGateProps) {
  const auth = useAuth();
  const { user, profile, loading, isGuestMode } = auth;

  const currentRawRole = profile?.role || user?.user_metadata?.role || (user ? "student" : "guest");
  const normalizedCurrentRole: UserRole = normalizeRole(currentRawRole);

  const isAuthorized = useMemo(() => {
    // 1. Guest checking
    if (isGuestMode || !user) {
      if (allowGuest) return true;
      if (requireAdmin || requireTeacher || requireStudent || requireInstitutional) return false;
      if (allowedRoles && allowedRoles.length > 0) {
        return allowedRoles.includes("guest");
      }
      return false;
    }

    // 2. Institutional check
    if (requireInstitutional) {
      const hasInstitution = Boolean(
        profile?.school_id ||
          profile?.org_id ||
          user?.user_metadata?.school_id ||
          user?.user_metadata?.org_id,
      );
      if (!hasInstitution) return false;
    }

    // Independent check
    if (requireIndependent) {
        const isIndependent = normalizedCurrentRole === "independent_learner" || normalizedCurrentRole === "independent_teacher";
        if (!isIndependent) return false;
    }

    // 3. Admin override & explicit check
    const isUserAdmin = normalizedCurrentRole === "admin";
    if (requireAdmin) {
      return isUserAdmin;
    }

    // 4. Teacher requirement (Teachers & Admins have teacher capabilities)
    const isUserTeacher = normalizedCurrentRole === "teacher" || isUserAdmin;
    if (requireTeacher) {
      return isUserTeacher;
    }

    // 5. Student requirement
    if (requireStudent) {
      return normalizedCurrentRole === "student";
    }

    // 6. Explicit allowedRoles array
    if (allowedRoles && allowedRoles.length > 0) {
      const normalizedAllowed = allowedRoles.map((r) => normalizeRole(r));
      return (
        normalizedAllowed.includes(normalizedCurrentRole) ||
        (isUserAdmin && normalizedAllowed.includes("teacher"))
      );
    }

    // Default: Authenticated user is permitted
    return true;
  }, [
    isGuestMode,
    user,
    allowGuest,
    requireAdmin,
    requireTeacher,
    requireStudent,
    requireInstitutional,
    requireIndependent,
    allowedRoles,
    profile,
    normalizedCurrentRole,
  ]);

  if (loading) {
    return <>{loadingFallback}</>;
  }

  const finalAuthorized = invert ? !isAuthorized : isAuthorized;

  if (!finalAuthorized) {
    return <>{fallback}</>;
  }

  if (typeof children === "function") {
    return <>{children(auth)}</>;
  }

  return <>{children}</>;
}

// Ergonomic sub-components for rapid development
RoleGate.Teacher = function RoleGateTeacher(
  props: Omit<RoleGateProps, "requireTeacher" | "requireAdmin" | "requireStudent">,
) {
  return <RoleGate {...props} requireTeacher />;
};

RoleGate.Admin = function RoleGateAdmin(
  props: Omit<RoleGateProps, "requireTeacher" | "requireAdmin" | "requireStudent">,
) {
  return <RoleGate {...props} requireAdmin />;
};

RoleGate.Student = function RoleGateStudent(
  props: Omit<RoleGateProps, "requireTeacher" | "requireAdmin" | "requireStudent">,
) {
  return <RoleGate {...props} requireStudent />;
};

RoleGate.Guest = function RoleGateGuest(
  props: Omit<RoleGateProps, "allowGuest" | "invert">,
) {
  return <RoleGate {...props} allowGuest invert={false} />;
};

RoleGate.Institutional = function RoleGateInstitutional(
  props: Omit<RoleGateProps, "requireInstitutional">,
) {
  return <RoleGate {...props} requireInstitutional />;
};

/**
 * Utility hook to check role permissions in JS/TS logic without rendering JSX
 */
export function useRoleAccess(options?: {
  allowedRoles?: (UserRole | string)[];
  requireAdmin?: boolean;
  requireTeacher?: boolean;
  requireStudent?: boolean;
  requireInstitutional?: boolean;
  allowGuest?: boolean;
}) {
  const auth = useAuth();
  const { user, profile, loading, isGuestMode } = auth;

  const currentRawRole = profile?.role || user?.user_metadata?.role || (user ? "student" : "guest");
  const normalizedCurrentRole: UserRole = normalizeRole(currentRawRole);

  const isAdmin = normalizedCurrentRole === "admin";
  const isTeacher = normalizedCurrentRole === "teacher" || isAdmin;
  const isStudent = normalizedCurrentRole === "student";
  const isInstitutional = Boolean(
    profile?.school_id ||
      profile?.org_id ||
      user?.user_metadata?.school_id ||
      user?.user_metadata?.org_id,
  );

  const hasAccess = useMemo(() => {
    if (!options) return true;
    if (isGuestMode || !user) {
      if (options.allowGuest) return true;
      if (
        options.requireAdmin ||
        options.requireTeacher ||
        options.requireStudent ||
        options.requireInstitutional
      ) {
        return false;
      }
      if (options.allowedRoles && options.allowedRoles.length > 0) {
        return options.allowedRoles.includes("guest");
      }
      return false;
    }

    if (options.requireInstitutional && !isInstitutional) return false;
    if (options.requireAdmin && !isAdmin) return false;
    if (options.requireTeacher && !isTeacher) return false;
    if (options.requireStudent && !isStudent) return false;

    if (options.allowedRoles && options.allowedRoles.length > 0) {
      const normalized = options.allowedRoles.map((r) => normalizeRole(r));
      return normalized.includes(normalizedCurrentRole) || (isAdmin && normalized.includes("teacher"));
    }

    return true;
  }, [
    options,
    isGuestMode,
    user,
    isInstitutional,
    isAdmin,
    isTeacher,
    isStudent,
    normalizedCurrentRole,
  ]);

  return {
    hasAccess,
    loading,
    role: normalizedCurrentRole,
    rawRole: currentRawRole,
    isAdmin,
    isTeacher,
    isStudent,
    isInstitutional,
    isGuest: isGuestMode || !user,
  };
}

export default RoleGate;
