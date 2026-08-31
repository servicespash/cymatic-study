import { ReactNode, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useUserRole, type UserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/use-auth";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { ShieldAlert, RefreshCw, LogIn, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notifications } from "@/lib/notifications";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: (UserRole | string)[];
  requireAdmin?: boolean;
  requireTeacher?: boolean;
  requireStudent?: boolean;
  fallbackPath?: string;
}

/**
 * Route & Component Level Role Guard
 * Enforces role access separation across 'student', 'teacher', and 'admin' users
 * utilizing verified database/RPC role fetching.
 */
export function RoleGuard({
  children,
  allowedRoles,
  requireAdmin = false,
  requireTeacher = false,
  requireStudent = false,
  fallbackPath = "/login",
}: RoleGuardProps) {
  const { user, loading: authLoading, isGuestMode } = useAuth();
  const {
    role,
    rawRole,
    isAdmin,
    isTeacher,
    isStudent,
    loading: roleLoading,
    isAuthorized,
  } = useUserRole();
  const adminGuard = useAdminGuard(6000);
  const navigate = useNavigate();

  const loading = authLoading || roleLoading;
  const allowedRolesKey = allowedRoles ? [...allowedRoles].sort().join(",") : "";
  const lastRedirectRef = useRef<string | null>(null);

  // Admin deadlock / diagnostic recovery UI
  if (requireAdmin && (adminGuard.isHung || adminGuard.error)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background p-6">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 shadow-2xl text-center space-y-4">
          <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-foreground">Admin Session Timeout</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {adminGuard.error ||
              "Administrative authorization verification timed out. Verify your school administrator credentials."}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              onClick={() => adminGuard.retry()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl px-4 py-2.5"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Connection
            </Button>
            <Button
              onClick={() => navigate({ to: fallbackPath as any })}
              variant="outline"
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs font-bold rounded-xl px-4 py-2.5"
            >
              <LogIn className="w-4 h-4" />
              Re-authenticate
            </Button>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (!loading) {
      const currentPath = typeof window !== "undefined" ? window.location.pathname : "";

      // 1. Unauthenticated users
      if (!user && !isGuestMode) {
        if (currentPath !== fallbackPath && lastRedirectRef.current !== fallbackPath) {
          lastRedirectRef.current = fallbackPath;
          notifications.warning("Authentication Required", "Please sign in to access this area.");
          const redirectQuery =
            currentPath && currentPath !== "/login"
              ? `?redirect=${encodeURIComponent(
                  typeof window !== "undefined"
                    ? `${window.location.pathname}${window.location.search}`
                    : currentPath,
                )}`
              : "";
          navigate({ to: `${fallbackPath}${redirectQuery}` as any });
        }
        return;
      }

      // 2. Specific role checks
      let hasAccess = true;
      let requiredRoleName = "authorized";

      if (requireAdmin && !isAdmin) {
        hasAccess = false;
        requiredRoleName = "administrator";
      } else if (requireTeacher && !isTeacher && !isAdmin) {
        hasAccess = false;
        requiredRoleName = "educator/teacher";
      } else if (requireStudent && !isStudent && !isAdmin) {
        hasAccess = false;
        requiredRoleName = "student";
      } else if (allowedRoles && allowedRoles.length > 0) {
        hasAccess = isAuthorized(allowedRoles);
        requiredRoleName = allowedRoles.join(" or ");
      }

      if (!hasAccess && user) {
        let redirectTarget = "/dashboard";
        if (isAdmin) redirectTarget = "/admin/dashboard";
        else if (isTeacher) redirectTarget = "/teacher";
        else redirectTarget = "/student";

        if (currentPath !== redirectTarget && lastRedirectRef.current !== redirectTarget) {
          lastRedirectRef.current = redirectTarget;
          notifications.roleDenied(requiredRoleName, role);
          navigate({ to: redirectTarget as any });
        }
      }
    }
  }, [
    user,
    loading,
    role,
    rawRole,
    isAdmin,
    isTeacher,
    isStudent,
    allowedRolesKey,
    requireAdmin,
    requireTeacher,
    requireStudent,
    isAuthorized,
    fallbackPath,
    isGuestMode,
    navigate,
  ]);

  if (loading || (requireAdmin && adminGuard.isLoading)) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Verifying Role Permissions...
          </p>
        </div>
      </div>
    );
  }

  // If user is not authenticated and not in guest mode
  if (!user && !isGuestMode) return null;

  // Final role guard evaluation
  if (requireAdmin && !isAdmin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <div className="max-w-md text-center space-y-3 p-8 border border-border rounded-2xl bg-card">
          <Lock className="w-8 h-8 text-amber-500 mx-auto" />
          <h3 className="text-lg font-bold text-foreground">Restricted to Administrators</h3>
          <p className="text-xs text-muted-foreground">
            Your current account role does not have permission to access institutional administration controls.
          </p>
          <Button onClick={() => navigate({ to: "/dashboard" })} className="text-xs font-bold">
            Return to Study Hub
          </Button>
        </div>
      </div>
    );
  }

  if (requireTeacher && !isTeacher && !isAdmin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <div className="max-w-md text-center space-y-3 p-8 border border-border rounded-2xl bg-card">
          <Lock className="w-8 h-8 text-blue-500 mx-auto" />
          <h3 className="text-lg font-bold text-foreground">Faculty Access Required</h3>
          <p className="text-xs text-muted-foreground">
            This grading desk and evaluation station is reserved for registered educators and instructors.
          </p>
          <Button onClick={() => navigate({ to: "/student" })} className="text-xs font-bold">
            Go to Student Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (allowedRoles && allowedRoles.length > 0 && !isAuthorized(allowedRoles)) {
    return null;
  }

  return <>{children}</>;
}

export default RoleGuard;
