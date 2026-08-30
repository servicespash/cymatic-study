import { redirect } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { normalizeRole, type UserRole } from "@/hooks/useUserRole";

export interface RouteGuardOptions {
  allowedRoles?: (UserRole | string)[];
  requireAdmin?: boolean;
  requireTeacher?: boolean;
  requireAuth?: boolean;
  fallbackTo?: string;
}

/**
 * TanStack Router beforeLoad helper for role-protected routes
 */
export async function requireAuthAndRole(options: RouteGuardOptions = {}) {
  const {
    allowedRoles = [],
    requireAdmin = false,
    requireTeacher = false,
    requireAuth = true,
    fallbackTo = "/login",
  } = options;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user && requireAuth) {
    throw redirect({
      to: fallbackTo as any,
    });
  }

  if (session?.user && (allowedRoles.length > 0 || requireAdmin || requireTeacher)) {
    let rawRole: string | null = null;

    try {
      const { data: prof } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();

      rawRole = prof?.role || session.user.user_metadata?.role || "student";
    } catch {
      rawRole = session.user.user_metadata?.role || "student";
    }

    const role = normalizeRole(rawRole);
    const isAdmin = role === "admin";
    const isTeacher = role === "teacher";

    let allowed = true;

    if (requireAdmin && !isAdmin) {
      allowed = false;
    } else if (requireTeacher && !isTeacher && !isAdmin) {
      allowed = false;
    } else if (allowedRoles.length > 0) {
      if (!allowedRoles.includes(role) && !allowedRoles.includes(rawRole || "")) {
        if (!(isAdmin && (allowedRoles.includes("teacher") || allowedRoles.includes("student")))) {
          allowed = false;
        }
      }
    }

    if (!allowed) {
      const target = isAdmin ? "/admin/dashboard" : isTeacher ? "/teacher" : "/student";
      throw redirect({
        to: target as any,
      });
    }
  }

  return { session };
}
