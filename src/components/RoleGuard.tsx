import React from "react";
import { useUserRole } from "@/hooks/useUserRole";

interface RoleGuardProps {
  admin?: React.ReactNode;
  teacher?: React.ReactNode;
  student?: React.ReactNode;
  children?: React.ReactNode;
  loadingFallback?: React.ReactNode;
}

/**
 * Centralized RoleGuard component to conditionally render dashboard layouts
 * based on the authenticated user's role (admin, teacher, student).
 * Uses the secure useUserRole hook for server-verified authorization.
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  admin,
  teacher,
  student,
  children,
  loadingFallback,
}) => {
  const { role, loading, isAdmin, isTeacher } = useUserRole();

  if (loading) {
    return (
      <>
        {loadingFallback || (
          <div className="p-8 text-center animate-pulse">Verifying secure workspace access...</div>
        )}
      </>
    );
  }

  if (admin && isAdmin) {
    return <>{admin}</>;
  }

  if (teacher && isTeacher) {
    return <>{teacher}</>;
  }

  if (student) {
    return <>{student}</>;
  }

  return <>{children}</>;
};

export default RoleGuard;
