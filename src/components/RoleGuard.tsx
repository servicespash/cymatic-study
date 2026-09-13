import React, { useEffect } from "react";
import { useUserRole, UserRole } from "@/hooks/useUserRole";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

interface RoleGuardProps {
  allowedRoles?: (UserRole | string)[];
  admin?: React.ReactNode;
  teacher?: React.ReactNode;
  student?: React.ReactNode;
  children?: React.ReactNode;
  loadingFallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * Enhanced RoleGuard component that enforces strict role-based access.
 * Can be used as a wrapper or a routing guard.
 * If 'allowedRoles' is provided and the user is not authorized, it will redirect to 'redirectTo'.
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  admin,
  teacher,
  student,
  children,
  loadingFallback,
  redirectTo = "/dashboard",
}) => {
  const { role, loading, isAdmin, isTeacher, isAuthorized } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && allowedRoles && !isAuthorized(allowedRoles)) {
      toast.error("Unauthorized: You do not have permission to access this area.");
      navigate(redirectTo);
    }
  }, [loading, isAuthorized, allowedRoles, navigate, redirectTo]);

  if (loading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        {loadingFallback || (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-zinc-500 font-medium animate-pulse">
              Verifying workspace permissions...
            </p>
          </div>
        )}
      </div>
    );
  }

  // If we have an explicit allowedRoles list and user isn't authorized, render nothing while redirect happens
  if (allowedRoles && !isAuthorized(allowedRoles)) {
    return null;
  }

  // Conditional rendering patterns
  if (admin && isAdmin) return <>{admin}</>;
  if (teacher && isTeacher) return <>{teacher}</>;
  if (student && role === "student") return <>{student}</>;

  return <>{children}</>;
};

export default RoleGuard;
