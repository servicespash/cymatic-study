import { ReactNode } from "react";
import { RoleBasedView } from "./RoleBasedView";

export interface RoleWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  showUnauthorizedNotice?: boolean;
}

/**
 * Declarative wrapper: renders children only for Student accounts
 */
export function StudentOnly({ children, fallback, showUnauthorizedNotice }: RoleWrapperProps) {
  return (
    <RoleBasedView
      requireStudent
      fallback={fallback}
      showUnauthorizedNotice={showUnauthorizedNotice}
      unauthorizedMessage="This study area is specifically configured for enrolled students."
    >
      {children}
    </RoleBasedView>
  );
}

/**
 * Declarative wrapper: renders children only for Teacher/Faculty accounts
 */
export function TeacherOnly({ children, fallback, showUnauthorizedNotice }: RoleWrapperProps) {
  return (
    <RoleBasedView
      requireTeacher
      fallback={fallback}
      showUnauthorizedNotice={showUnauthorizedNotice}
      unauthorizedMessage="This evaluation station is reserved for registered educators and instructors."
    >
      {children}
    </RoleBasedView>
  );
}

/**
 * Declarative wrapper: renders children only for Institutional Administrators
 */
export function AdminOnly({ children, fallback, showUnauthorizedNotice }: RoleWrapperProps) {
  return (
    <RoleBasedView
      requireAdmin
      fallback={fallback}
      showUnauthorizedNotice={showUnauthorizedNotice}
      unauthorizedMessage="This administrative module requires school or system administrator clearance."
    >
      {children}
    </RoleBasedView>
  );
}
