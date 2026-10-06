import { useAuth } from "@/hooks/use-auth";
import { useCallback } from "react";

export type Role = "admin" | "teacher" | "student" | "guest";

export function useRoleAuth() {
  const { profile } = useAuth();
  
  const role = (profile?.role || "student") as Role;

  const hasRole = useCallback((requiredRoles: Role[]) => {
    return requiredRoles.includes(role);
  }, [role]);

  return {
    role,
    isAdmin: role === "admin",
    isTeacher: role === "teacher",
    isStudent: role === "student",
    hasRole,
  };
}
