import { ReactNode } from "react";
import { ResponsiveContainer, type ContainerVariant } from "./ResponsiveContainer";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useUserRole } from "@/hooks/useUserRole";
import { Badge } from "@/components/ui/badge";
import { Building2, ShieldCheck, PenTool, GraduationCap } from "lucide-react";

export interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "outline" | "destructive";
  actions?: ReactNode;
  breadcrumbs?: ReactNode;
  variant?: ContainerVariant;
  className?: string;
  sidebar?: ReactNode;
  showRoleHeader?: boolean;
  containerClassName?: string;
}

/**
 * Standardized App Layout Wrapper Component
 * Enforces unified margins, responsive gutters, header hierarchy, and layout consistency
 * across all role views (student, teacher, admin).
 */
export function AppLayout({
  children,
  title,
  subtitle,
  badge,
  badgeVariant = "outline",
  actions,
  breadcrumbs,
  variant = "default",
  className,
  sidebar,
  showRoleHeader = false,
  containerClassName,
}: AppLayoutProps) {
  const { user, profile } = useAuth();
  const { role, isAdmin, isTeacher, isStudent, schoolName, schoolId } = useUserRole();

  const roleMeta = {
    admin: {
      label: "Administrator Console",
      icon: ShieldCheck,
      badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    },
    teacher: {
      label: "Faculty Workspace",
      icon: PenTool,
      badgeColor: "bg-teal-500/10 text-teal-400 border-teal-500/30",
    },
    student: {
      label: "Student Study Hub",
      icon: GraduationCap,
      badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    },
  }[role] || {
    label: "Academic Portal",
    icon: GraduationCap,
    badgeColor: "bg-primary/10 text-primary border-primary/30",
  };

  const RoleIcon = roleMeta.icon;

  return (
    <div
      className={cn(
        "min-h-[calc(100vh-4rem)] w-full flex flex-col bg-background text-foreground",
        className,
      )}
    >
      <ResponsiveContainer variant={variant} className={containerClassName}>
        {/* Optional Role Context Banner */}
        {showRoleHeader && user && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-border/80 bg-card/70 backdrop-blur-md shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary shrink-0">
                <RoleIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">
                    {profile?.display_name || user.email?.split("@")[0]}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] font-bold uppercase", roleMeta.badgeColor)}
                  >
                    {roleMeta.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                  <Building2 className="w-3 h-3 text-primary/70" />
                  <span>{schoolName || profile?.school_name || "Uganda Secondary Curriculum"}</span>
                  {schoolId && (
                    <span className="font-mono text-primary font-bold">[{schoolId}]</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Breadcrumb row if provided */}
        {breadcrumbs && <div className="mb-3 text-xs text-muted-foreground">{breadcrumbs}</div>}

        {/* Page Header Row */}
        {(title || subtitle || actions) && (
          <header className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                {title && (
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                    {title}
                  </h1>
                )}
                {badge && (
                  <Badge variant={badgeVariant} className="text-xs font-bold px-2 py-0.5">
                    {badge}
                  </Badge>
                )}
              </div>
              {subtitle && (
                <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>

            {actions && (
              <div className="flex flex-wrap items-center gap-2 sm:self-center">{actions}</div>
            )}
          </header>
        )}

        {/* Content Body with optional Sidebar Layout */}
        {sidebar ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            <aside className="lg:col-span-3 space-y-6 lg:sticky lg:top-20">{sidebar}</aside>
            <main className="lg:col-span-9 space-y-6 min-w-0">{children}</main>
          </div>
        ) : (
          <div className="space-y-6">{children}</div>
        )}
      </ResponsiveContainer>
    </div>
  );
}

export default AppLayout;
