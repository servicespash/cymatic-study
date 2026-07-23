import { ReactNode, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

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
  const { user, loading, profile, isAdmin, isTeacher } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate({ to: fallbackPath });
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
        // Redirect based on what they ARE allowed to see
        if (isAdmin) {
          navigate({ to: "/admin/dashboard" });
        } else if (isTeacher) {
          navigate({ to: "/dashboard" });
        } else {
          navigate({ to: "/dashboard" });
        }
      }
    }
  }, [
    user,
    loading,
    profile,
    isAdmin,
    isTeacher,
    allowedRoles,
    requireAdmin,
    requireTeacher,
    fallbackPath,
    navigate,
  ]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          <p className="text-sm font-bold uppercase tracking-widest">Verifying Credentials...</p>
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
