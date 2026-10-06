import React from "react";
import { useRoleAuth, type Role } from "@/hooks/useRoleAuth";

interface WithRoleAccessProps {
  roles: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function WithRoleAccess({ roles, children, fallback = null }: WithRoleAccessProps) {
  const { hasRole } = useRoleAuth();

  if (!hasRole(roles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
