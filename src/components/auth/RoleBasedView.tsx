import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useUserRole, type UserRole } from "@/hooks/useUserRole";
import { Lock } from "lucide-react";

export interface RoleBasedViewProps {
  children: ReactNode;
  allowedRoles?: (UserRole | string)[];
  requireAdmin?: boolean;
  requireTeacher?: boolean;
  requireStudent?: boolean;
  fallback?: ReactNode;
  loadingComponent?: ReactNode;
  showUnauthorizedNotice?: boolean;
  unauthorizedMessage?: string;
}

/**
 * Reusable wrapper component that conditionally renders UI elements
 * based on user authentication and role verification.
 */
export function RoleBasedView({
  children,
  allowedRoles,
  requireAdmin = false,
  requireTeacher = false,
  requireStudent = false,
  fallback = null,
  loadingComponent = null,
  showUnauthorizedNotice = false,
  unauthorizedMessage = "You do not have permission to view this section.",
}: RoleBasedViewProps) {
  const { user, loading: authLoading, isGuestMode } = useAuth();
  const { role, isAdmin, isTeacher, isStudent, loading: roleLoading, isAuthorized } = useUserRole();

  const loading = authLoading || roleLoading;

  if (loading) {
    return <>{loadingComponent}</>;
  }

  // Guest users without explicit guest allowance
  if (!user && !isGuestMode) {
    return <>{fallback}</>;
  }

  let hasPermission = true;

  if (requireAdmin) {
    hasPermission = isAdmin;
  } else if (requireTeacher) {
    hasPermission = isTeacher || isAdmin;
  } else if (requireStudent) {
    hasPermission = isStudent || isAdmin;
  } else if (allowedRoles && allowedRoles.length > 0) {
    hasPermission = isAuthorized(allowedRoles);
  }

  if (!hasPermission) {
    if (showUnauthorizedNotice) {
      return (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-border/80 bg-card/60 text-muted-foreground text-xs">
          <Lock className="w-4 h-4 text-amber-500 shrink-0" />
          <span>{unauthorizedMessage}</span>
        </div>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default RoleBasedView;
