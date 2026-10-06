import React from "react";
import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useRoleAuth } from "@/hooks/useRoleAuth";
import {
  ArrowLeft,
  Home,
  ShieldCheck,
  PenTool,
  GraduationCap,
  BookOpen,
  Lightbulb,
  CheckCircle,
  LineChart,
  Calculator,
  MessagesSquare,
  FileCode,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface MainNavigationProps {
  backTo?: string;
  label?: string;
  showMenuItems?: boolean;
  className?: string;
}

export function MainNavigation({
  backTo = "/dashboard",
  label = "Dashboard",
  showMenuItems = true,
  className,
}: MainNavigationProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { role, isAdmin, isTeacher, isStudent } = useRoleAuth();

  // Role-specific dynamic menu items
  const menuItems = React.useMemo(() => {
    if (isAdmin) {
      return [
        { to: "/admin/dashboard", label: "Admin Dashboard", icon: ShieldCheck, badge: "Admin" },
        { to: "/teacher", label: "Teacher Station", icon: PenTool },
        { to: "/admin/dashboard/students", label: "Student Roster", icon: GraduationCap },
        { to: "/analytics", label: "Analytics", icon: LineChart },
        { to: "/tools", label: "Classroom Tools", icon: Calculator },
      ];
    }

    if (isTeacher) {
      return [
        { to: "/teacher", label: "Classroom Tools", icon: PenTool, badge: "Faculty" },
        { to: "/marking", label: "Marking Desk", icon: CheckCircle },
        { to: "/lessons", label: "Curriculum Lessons", icon: BookOpen },
        { to: "/quizzes", label: "Assessment Quizzes", icon: Lightbulb },
        { to: "/analytics", label: "Class Stats", icon: LineChart },
      ];
    }

    if (isStudent) {
      return [
        { to: "/dashboard", label: "Study Hub", icon: LayoutDashboard, badge: "Student" },
        { to: "/lessons", label: "Lessons", icon: BookOpen },
        { to: "/quizzes", label: "Quizzes", icon: Lightbulb },
        { to: "/tutor", label: "AI Socratic Tutor", icon: MessagesSquare },
        { to: "/projects", label: "Project Work", icon: FileCode },
        { to: "/tools", label: "Lab Tools", icon: Calculator },
      ];
    }

    // Default / guest navigation
    return [
      { to: "/", label: "Home", icon: Home },
      { to: "/lessons", label: "Lessons", icon: BookOpen },
      { to: "/quizzes", label: "Quizzes", icon: Lightbulb },
      { to: "/tutor", label: "AI Tutor", icon: MessagesSquare },
      { to: "/tools", label: "Tools", icon: Calculator },
    ];
  }, [isAdmin, isTeacher, isStudent]);

  const roleBadge = isAdmin ? "Administrator" : isTeacher ? "Faculty" : isStudent ? "Learner" : "Guest";

  return (
    <nav
      className={cn(
        "w-full rounded-2xl border border-border/60 bg-card/70 p-3 sm:p-4 backdrop-blur-md shadow-sm mb-6",
        className
      )}
      aria-label="Main Role-Aware Navigation"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: backTo as any })}
            className="text-xs font-bold gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {label}
          </Button>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Home</span>
          </Link>

          <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 border-primary/30 text-primary bg-primary/10">
            {roleBadge}
          </Badge>
        </div>

        {/* Dynamic Role-Based Menu Items */}
        {showMenuItems && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
            {menuItems.map(({ to, label: itemLabel, icon: Icon, badge }) => {
              const isActive = pathname === to || (to !== "/" && pathname.startsWith(to));
              return (
                <Link
                  key={to}
                  to={to as any}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{itemLabel}</span>
                  {badge && (
                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-black/20 text-current ml-0.5">
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}

export default MainNavigation;
