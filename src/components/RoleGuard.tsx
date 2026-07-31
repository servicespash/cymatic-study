import { ReactNode, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { AlertTriangle, RefreshCw, LogIn, ShieldAlert } from "lucide-react";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: string[];
  requireAdmin?: boolean;
  requireTeacher?: boolean;
  fallbackPath?: string;
}

export function RoleGuard({
  children,
  allowedRoles,
  requireAdmin = false,
  requireTeacher = false,
  fallbackPath = "/login",
}: RoleGuardProps) {
  const { user, loading: authLoading, profile, isAdmin, isTeacher } = useAuth();
  const adminGuard = useAdminGuard(6000);
  const navigate = useNavigate();

  // If admin is required and adminGuard detects a hang or error, show diagnostic recovery UI
  if (requireAdmin && (adminGuard.isHung || adminGuard.error)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background p-6">
        <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 shadow-lg text-center">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Admin Connection Timeout</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {adminGuard.error ||
              "The administrative permission request took too long or encountered an RLS policy deadlock."}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => adminGuard.retry()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/95 transition-colors shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Connection
            </button>
            <button
              onClick={() => navigate({ to: fallbackPath as any })}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground text-sm font-medium rounded-lg hover:bg-secondary/80 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Re-authenticate
            </button>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (!authLoading) {
      const currentPath = window.location.pathname;

      if (!user) {
        if (currentPath !== fallbackPath) {
          navigate({ to: fallbackPath as any });
        }
        return;
      }

      if (profile) {
        let isAllowed = true;

        if (requireAdmin && !isAdmin) {
          isAllowed = false;
        }

        if (requireTeacher && !isTeacher && !isAdmin) {
          isAllowed = false;
        }

        if (allowedRoles && allowedRoles.length > 0) {
          const userRole = profile.role || "student";
          if (!allowedRoles.includes(userRole)) {
            isAllowed = false;
          }
        }

        if (!isAllowed) {
          let target = "/dashboard";
          if (isAdmin) target = "/admin/dashboard";
          else if (isTeacher) target = "/dashboard";

          if (currentPath !== target) {
            navigate({ to: target as any });
          }
        }
      }
    }
  }, [
    user,
    authLoading,
    profile,
    isAdmin,
    isTeacher,
    allowedRoles,
    requireAdmin,
    requireTeacher,
    fallbackPath,
    navigate,
  ]);

  if (authLoading || (requireAdmin && adminGuard.isLoading)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          <p className="text-sm font-bold uppercase tracking-widest">
            Verifying Credentials & Session...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Final safety check before rendering
  if (requireAdmin && !isAdmin) return null;
  if (requireTeacher && !isTeacher && !isAdmin) return null;
  if (allowedRoles && profile && !allowedRoles.includes(profile.role || "student")) return null;

  return <>{children}</>;
}
