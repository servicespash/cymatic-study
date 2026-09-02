import { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  GraduationCap,
  PenTool,
  ShieldCheck,
  Building2,
  LogOut,
  ChevronRight,
  BookOpen,
  LayoutDashboard,
  CheckCircle,
  FileText,
  Users,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useUserRole } from "@/hooks/useUserRole";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: ReactNode;
  activeSection?: string;
}

export function DashboardLayout({ children, activeSection }: DashboardLayoutProps) {
  const { user, profile, signOut, isGuestMode } = useAuth();
  const { role, isStudent, isTeacher, isAdmin, schoolId, schoolName } = useUserRole();
  const navigate = useNavigate();

  const currentRole = role;
  const userDisplayName =
    profile?.display_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Scholar";
  const orgName =
    schoolName ||
    profile?.school_name ||
    user?.user_metadata?.school_name ||
    "Uganda Secondary Curriculum";
  const orgId = schoolId || profile?.school_id || profile?.org_id || "SCH-UG-2026";

  const getRoleConfig = () => {
    switch (currentRole) {
      case "admin":
        return {
          title: "Institutional Administrator Node",
          badgeColor: "bg-blue-600/10 text-blue-400 border-blue-600/30",
          icon: ShieldCheck,
          portalName: "Admin Console",
          navLinks: [
            { label: "Command Center", to: "/admin/dashboard", icon: LayoutDashboard },
            { label: "Teacher Evaluation Desk", to: "/teacher", icon: PenTool },
            { label: "Student Study Hub", to: "/dashboard", icon: BookOpen },
          ],
        };
      case "teacher":
        return {
          title: "Faculty Assessment & Grading Hub",
          badgeColor: "bg-teal-500/10 text-teal-400 border-teal-500/30",
          icon: PenTool,
          portalName: "Teacher Workspace",
          navLinks: [
            { label: "Teacher Station", to: "/teacher", icon: PenTool },
            { label: "Marking Desk", to: "/marking", icon: CheckCircle },
            { label: "Curriculum Hub", to: "/dashboard", icon: BookOpen },
          ],
        };
      case "student":
      default:
        return {
          title: "Student Academic Learning Hub",
          badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
          icon: GraduationCap,
          portalName: "Student Portal",
          navLinks: [
            { label: "Daily Missions", to: "/dashboard", icon: BookOpen },
            { label: "Student Portfolio", to: "/student", icon: FileText },
            { label: "Interactive Quizzes", to: "/quizzes", icon: Sparkles },
          ],
        };
    }
  };

  const config = getRoleConfig();
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-background text-foreground space-y-6">
      {/* ROLE BANNER & CONTEXT HEADER */}
      <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-extrabold text-foreground tracking-tight">
                  {userDisplayName}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-bold uppercase tracking-wider ${config.badgeColor}`}
                >
                  {config.portalName}
                </Badge>
                {isGuestMode && (
                  <Badge variant="secondary" className="text-[10px]">
                    Guest Preview Mode
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-primary/70" />
                  {orgName}
                </span>
                <span className="font-mono text-[11px] text-primary font-semibold">[{orgId}]</span>
              </div>
            </div>
          </div>

          {/* ROLE NAVIGATION SWITCHER */}
          <div className="flex flex-wrap items-center gap-1.5">
            {config.navLinks.map((nav) => {
              const NavIcon = nav.icon;
              return (
                <Link
                  key={nav.to}
                  to={nav.to as any}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary/50 hover:bg-secondary text-secondary-foreground transition-colors border border-border/40"
                >
                  <NavIcon className="w-3.5 h-3.5" />
                  {nav.label}
                </Link>
              );
            })}

            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate({ to: "/admin/dashboard" })}
                className="h-8 text-xs font-bold border-blue-600/30 text-blue-400 hover:bg-blue-600 hover:text-white"
              >
                Admin Console
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* DASHBOARD CONTENT BODY */}
      <div className="space-y-6">{children}</div>
    </div>
  );
}

export default DashboardLayout;
