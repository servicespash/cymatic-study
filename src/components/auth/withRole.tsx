import { ComponentType, ReactNode } from "react";
import { RoleBasedView } from "./RoleBasedView";
import { UserRole } from "@/hooks/useUserRole";

export interface WithRoleOptions {
  allowedRoles?: (UserRole | string)[];
  requireAdmin?: boolean;
  requireTeacher?: boolean;
  requireStudent?: boolean;
  fallback?: ReactNode;
  loadingComponent?: ReactNode;
  showUnauthorizedNotice?: boolean;
}

/**
 * Higher-Order Component (HOC) to protect any React component with role-based security.
 *
 * Example:
 * const ProtectedMarkingDesk = withRole(MarkingDesk, { requireTeacher: true });
 */
export function withRole<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithRoleOptions | (UserRole | string)[],
) {
  const normalizedOptions: WithRoleOptions = Array.isArray(options)
    ? { allowedRoles: options }
    : options;

  const displayName = WrappedComponent.displayName || WrappedComponent.name || "Component";

  const ComponentWithRole = (props: P) => {
    return (
      <RoleBasedView {...normalizedOptions}>
        <WrappedComponent {...props} />
      </RoleBasedView>
    );
  };

  ComponentWithRole.displayName = `withRole(${displayName})`;
  return ComponentWithRole;
}

export default withRole;
