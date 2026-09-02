import React, { useEffect, useMemo, type ReactNode, type ComponentType } from "react";
import { useNavigate, useRouterState, redirect } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { normalizeRole, type UserRole } from "@/hooks/useUserRole";
import { notifications } from "@/lib/notifications";
import {
  ShieldAlert,
  Lock,
  LogIn,
  RefreshCw,
  GraduationCap,
  LayoutDashboard,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface AuthMiddlewareOptions {
  /** List of permitted roles for this route (e.g. ['admin', 'teacher', 'student']) */
  allowedRoles?: (UserRole | string)[];
  /** Route requires institutional / super administrator privileges */
  requireAdmin?: boolean;
  /** Route requires teacher / educator / instructor privileges */
  requireTeacher?: boolean;
  /** Route requires student / scholar privileges */
  requireStudent?: boolean;
  /** Whether unauthenticated guest users are allowed (default: false for protected routes) */
  allowGuest?: boolean;
  /** Custom fallback redirect path for unauthorized visitors (default: "/login") */
  fallbackPath?: string;
  /** Custom redirect target when a role mismatch occurs */
  roleMismatchRedirect?: string;
  /** Custom title for error display card */
  customTitle?: string;
  /** Custom description for error display card */
  customDescription?: string;
}

export interface AuthGuardResult {
  isAuthorized: boolean;
  isLoading: boolean;
  roleMismatch: boolean;
  user: ReturnType<typeof useAuth>["user"];
  role: UserRole;
  requiredRoleName: string;
  correctDashboard: string;
}

/**
 * Hook to enforce authentication & role validation within TanStack Router routes.
 * Redirects unauthenticated users to the login page (with ?redirect= param)
 * and redirects role-mismatched users to their authorized dashboard.
 */
export function useAuthRouteGuard(options: AuthMiddlewareOptions = {}): AuthGuardResult {
  const {
    allowedRoles,
    requireAdmin = false,
    requireTeacher = false,
    requireStudent = false,
    allowGuest = false,
    fallbackPath = "/login",
    roleMismatchRedirect,
  } = options;

  const auth = useAuth();
  const { user, role, rawRole, isAdmin, isTeacher, isStudent, loading, isGuestMode } = auth;
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });

  // Stable key for allowedRoles to prevent re-renders when passed as inline array literal
  const allowedRolesKey = useMemo(
    () => (allowedRoles ? [...allowedRoles].sort().join(",") : ""),
    [allowedRoles],
  );

  // Determine user's correct dashboard destination based on their verified role
  const correctDashboard = useMemo(() => {
    if (isAdmin) return "/admin/dashboard";
    if (isTeacher) return "/teacher";
    return "/student";
  }, [isAdmin, isTeacher]);

  // Determine what role description is needed for access
  const requiredRoleName = useMemo(() => {
    if (requireAdmin) return "Institutional Administrator";
    if (requireTeacher) return "Faculty Educator / Teacher";
    if (requireStudent) return "Registered Student / Scholar";
    if (allowedRoles && allowedRoles.length > 0) {
      return allowedRoles
        .map((r) => r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
        .join(" or ");
    }
    return "Authenticated User";
  }, [requireAdmin, requireTeacher, requireStudent, allowedRolesKey]);

  // Evaluate permission
  const { isAuthorized, roleMismatch } = useMemo(() => {
    if (loading) return { isAuthorized: false, roleMismatch: false };

    // 1. Unauthenticated check
    if (!user) {
      if (allowGuest && isGuestMode) {
        return { isAuthorized: true, roleMismatch: false };
      }
      return { isAuthorized: false, roleMismatch: false };
    }

    // 2. Role-specific validation
    if (requireAdmin && !isAdmin) {
      return { isAuthorized: false, roleMismatch: true };
    }

    if (requireTeacher && !isTeacher && !isAdmin) {
      return { isAuthorized: false, roleMismatch: true };
    }

    if (requireStudent && !isStudent && !isAdmin) {
      return { isAuthorized: false, roleMismatch: true };
    }

    if (allowedRoles && allowedRoles.length > 0) {
      const isRoleAllowed =
        allowedRoles.includes(role) ||
        allowedRoles.includes(rawRole) ||
        (isAdmin && (allowedRoles.includes("teacher") || allowedRoles.includes("student")));

      if (!isRoleAllowed) {
        return { isAuthorized: false, roleMismatch: true };
      }
    }

    return { isAuthorized: true, roleMismatch: false };
  }, [
    loading,
    user,
    allowGuest,
    isGuestMode,
    requireAdmin,
    isAdmin,
    requireTeacher,
    isTeacher,
    requireStudent,
    isStudent,
    allowedRolesKey,
    role,
    rawRole,
  ]);

  // Track redirection to prevent rapid loops
  const lastRedirectRef = React.useRef<string | null>(null);

  // Execute redirection side-effects
  useEffect(() => {
    if (loading) return;

    // A. Unauthenticated user accessing a protected route
    if (!user && !allowGuest) {
      const fullPath = searchStr ? `${pathname}${searchStr}` : pathname;
      const redirectQuery =
        fullPath && fullPath !== "/login" ? `?redirect=${encodeURIComponent(fullPath)}` : "";
      const target = `${fallbackPath}${redirectQuery}`;

      if (lastRedirectRef.current !== target && pathname !== fallbackPath) {
        lastRedirectRef.current = target;
        notifications.warning(
          "Sign-in Required",
          "Please sign in with your credentials to access this dashboard.",
        );
        navigate({ to: target as any });
      }
      return;
    }

    // B. Authenticated user with mismatched role attempting to access restricted route
    if (user && roleMismatch) {
      const targetDestination = roleMismatchRedirect || correctDashboard;
      if (lastRedirectRef.current !== targetDestination && pathname !== targetDestination) {
        lastRedirectRef.current = targetDestination;
        notifications.roleDenied(requiredRoleName, role);
        navigate({ to: targetDestination as any });
      }
    }
  }, [
    loading,
    user,
    allowGuest,
    roleMismatch,
    pathname,
    searchStr,
    fallbackPath,
    roleMismatchRedirect,
    correctDashboard,
    requiredRoleName,
    role,
    navigate,
  ]);

  return {
    isAuthorized,
    isLoading: loading,
    roleMismatch,
    user,
    role,
    requiredRoleName,
    correctDashboard,
  };
}

export interface AuthRouteMiddlewareProps extends AuthMiddlewareOptions {
  children: ReactNode;
  loadingFallback?: ReactNode;
}

/**
 * Route-level Middleware Component for TanStack Router.
 * Wraps route content, enforces authentication and prevents role mismatches.
 */
export function AuthRouteMiddleware({
  children,
  loadingFallback,
  ...options
}: AuthRouteMiddlewareProps) {
  const { isAuthorized, isLoading, roleMismatch, requiredRoleName, role, correctDashboard } =
    useAuthRouteGuard(options);
  const navigate = useNavigate();

  // 1. Loading State
  if (isLoading) {
    if (loadingFallback) return <>{loadingFallback}</>;

    return (
      <div
        className="flex min-h-[60vh] w-full flex-col items-center justify-center bg-background px-4 py-16"
        id="auth-middleware-loading"
      >
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 shadow-glow">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
              Verifying Authorization
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Checking institutional session permissions and role credentials...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Role Mismatch State (Shows informative alert before/while redirecting)
  if (roleMismatch) {
    return (
      <div
        className="flex min-h-[60vh] w-full items-center justify-center bg-background px-4 py-16"
        id="auth-middleware-role-denied"
      >
        <div className="max-w-md w-full rounded-2xl border border-destructive/20 bg-card p-8 shadow-2xl text-center space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black uppercase tracking-tight text-foreground">
              Access Restricted
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This station requires <strong className="text-foreground">{requiredRoleName}</strong>{" "}
              access. Your account is currently signed in as a{" "}
              <strong className="text-foreground">{role}</strong>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              onClick={() => navigate({ to: correctDashboard as any })}
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs font-bold rounded-xl px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <LayoutDashboard className="h-4 w-4" />
              Go to Your Dashboard
            </Button>
            <Button
              onClick={() => navigate({ to: "/login" as any })}
              variant="outline"
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs font-bold rounded-xl px-4 py-2.5 border-border hover:bg-accent"
            >
              <LogIn className="h-4 w-4" />
              Switch Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Unauthenticated State (prevent rendering protected children)
  if (!isAuthorized) {
    return null;
  }

  // 4. Authorized Access
  return <>{children}</>;
}

/**
 * Higher-Order Component (HOC) to apply AuthRouteMiddleware to any TanStack Router Route component.
 *
 * Example usage:
 * ```tsx
 * export const Route = createFileRoute('/admin/dashboard')({
 *   component: withAuthMiddleware(AdminDashboardPage, { requireAdmin: true }),
 * });
 * ```
 */
export function withAuthMiddleware<P extends object>(
  Component: ComponentType<P>,
  options: AuthMiddlewareOptions = {},
): ComponentType<P> {
  return function ProtectedRouteWrapper(props: P) {
    return (
      <AuthRouteMiddleware {...options}>
        <Component {...props} />
      </AuthRouteMiddleware>
    );
  };
}

/**
 * Helper to generate a TanStack Router beforeLoad middleware function.
 * Compatible with `createFileRoute('/path')({ beforeLoad: createRouterAuthGuard(...) })`
 */
export function createRouterAuthGuard(options: AuthMiddlewareOptions = {}) {
  const {
    allowedRoles = [],
    requireAdmin = false,
    requireTeacher = false,
    requireStudent = false,
    allowGuest = false,
    fallbackPath = "/login",
  } = options;

  return async ({ location }: { location: { pathname: string; searchStr?: string } }) => {
    // Dynamic import supabase to check session synchronously or asynchronously
    const { supabase } = await import("@/lib/supabase");
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user && !allowGuest) {
      const fullPath = location.searchStr
        ? `${location.pathname}${location.searchStr}`
        : location.pathname;
      const redirectQuery =
        fullPath && fullPath !== "/login" ? `?redirect=${encodeURIComponent(fullPath)}` : "";
      throw redirect({
        to: `${fallbackPath}${redirectQuery}` as any,
      });
    }

    if (
      session?.user &&
      (allowedRoles.length > 0 || requireAdmin || requireTeacher || requireStudent)
    ) {
      let rawRole = session.user.user_metadata?.role || "student";

      try {
        const { data: prof } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (prof?.role) rawRole = prof.role;
      } catch {
        // Fall back to user metadata
      }

      const role = normalizeRole(rawRole);
      const isAdmin = role === "admin";
      const isTeacher = role === "teacher";
      const isStudent = role === "student";

      let permitted = true;
      if (requireAdmin && !isAdmin) permitted = false;
      else if (requireTeacher && !isTeacher && !isAdmin) permitted = false;
      else if (requireStudent && !isStudent && !isAdmin) permitted = false;
      else if (allowedRoles.length > 0) {
        permitted =
          allowedRoles.includes(role) ||
          allowedRoles.includes(rawRole) ||
          (isAdmin && (allowedRoles.includes("teacher") || allowedRoles.includes("student")));
      }

      if (!permitted) {
        const target = isAdmin ? "/admin/dashboard" : isTeacher ? "/teacher" : "/student";
        throw redirect({
          to: target as any,
        });
      }
    }

    return { session };
  };
}

export default AuthRouteMiddleware;
