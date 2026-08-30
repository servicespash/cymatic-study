import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  Calculator,
  GraduationCap,
  FileCode,
  HelpCircle,
  LayoutDashboard,
  Lightbulb,
  LineChart,
  LogIn,
  LogOut,
  Menu,
  MessagesSquare,
  Newspaper,
  Settings as SettingsIcon,
  Sparkles,
  X,
  ShieldCheck,
  PenTool,
  CheckCircle,
  Building2,
  ChevronDown,
  User,
  type LucideIcon,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useUserRole, type UserRole } from "@/hooks/useUserRole";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toggleParticles } from "@/components/CymaticBackground";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles?: (UserRole | string)[];
  badge?: string;
  badgeColor?: string;
  description?: string;
}

export function Navigation() {
  const { user, profile, signOut, isGuestMode } = useAuth();
  const { role, rawRole, isAdmin, isTeacher, isStudent, schoolName, schoolId } = useUserRole();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [particlesEnabled, setParticlesEnabled] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lattys-particles");
      if (saved !== null) {
        setParticlesEnabled(saved === "true");
      }
    } catch {
      // ignore
    }
  }, []);

  const handleToggleParticles = () => {
    const nextVal = !particlesEnabled;
    setParticlesEnabled(nextVal);
    toggleParticles(nextVal);
  };

  // Define navigational hierarchy grouped by user role
  const roleSpecificLinks: NavItem[] = useMemo(() => {
    if (isAdmin) {
      return [
        { to: "/admin/dashboard", label: "Command Center", icon: ShieldCheck, badge: "Admin", badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
        { to: "/teacher", label: "Teacher Station", icon: PenTool },
        { to: "/student", label: "Student Records", icon: GraduationCap },
        { to: "/curriculum", label: "Curriculum", icon: BookOpen },
        { to: "/analytics", label: "Analytics", icon: LineChart },
        { to: "/news", label: "NCDC News", icon: Newspaper },
        { to: "/tools", label: "Lab Tools", icon: Calculator },
      ];
    }

    if (isTeacher) {
      return [
        { to: "/teacher", label: "Teacher Desk", icon: PenTool, badge: "Faculty", badgeColor: "bg-teal-500/20 text-teal-400 border-teal-500/30" },
        { to: "/marking", label: "Marking Desk", icon: CheckCircle },
        { to: "/lessons", label: "Lessons", icon: BookOpen },
        { to: "/quizzes", label: "Quizzes", icon: Lightbulb },
        { to: "/student", label: "Students", icon: GraduationCap },
        { to: "/analytics", label: "Class Stats", icon: LineChart },
        { to: "/news", label: "NCDC News", icon: Newspaper },
      ];
    }

    if (isStudent || user) {
      return [
        { to: "/dashboard", label: "Study Hub", icon: LayoutDashboard, badge: "Student", badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
        { to: "/student", label: "My Portfolio", icon: GraduationCap },
        { to: "/tutor", label: "AI Tutor", icon: MessagesSquare },
        { to: "/quizzes", label: "Quizzes", icon: Lightbulb },
        { to: "/lessons", label: "Lessons", icon: BookOpen },
        { to: "/projects", label: "Projects", icon: FileCode },
        { to: "/news", label: "News", icon: Newspaper },
        { to: "/tools", label: "Tools", icon: Calculator },
      ];
    }

    // Guest / Public links
    return [
      { to: "/", label: "Home", icon: Sparkles },
      { to: "/news", label: "News & Syllabus", icon: Newspaper },
      { to: "/tutor", label: "Socratic AI", icon: MessagesSquare },
      { to: "/curriculum", label: "Curriculum", icon: BookOpen },
      { to: "/tools", label: "Science Tools", icon: Calculator },
      { to: "/support", label: "Support", icon: HelpCircle },
    ];
  }, [isAdmin, isTeacher, isStudent, user]);

  const userDisplayName =
    profile?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Scholar";
  const orgName = schoolName || profile?.school_name || user?.user_metadata?.school_name || "Uganda Secondary";
  const orgCode = schoolId || profile?.school_id || profile?.org_id || null;

  const roleLabel = isAdmin ? "Administrator" : isTeacher ? "Faculty Teacher" : isStudent ? "Student" : "Guest";

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* BRAND LOGO */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-hero shadow-glow transition-transform duration-300 group-hover:scale-105">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight hidden sm:block">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold tracking-tight text-foreground">
                Lattys <span className="text-primary">Cymatic</span>
              </p>
              {user && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
                  {role.toUpperCase()}
                </span>
              )}
            </div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              × Pash Media
            </p>
          </div>
        </Link>

        {/* DESKTOP ROLE-BASED NAVIGATION ITEMS */}
        <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
          {roleSpecificLinks.map(({ to, label, icon: Icon, badge, badgeColor }) => {
            const active = pathname === to || (to !== "/" && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to as any}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200",
                  active
                    ? "bg-primary/15 text-primary border border-primary/25 shadow-sm"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
                {badge && (
                  <span className={cn("text-[9px] font-extrabold px-1.5 py-0.5 rounded border leading-none", badgeColor)}>
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* DESKTOP CONTROLS & USER STATUS */}
        <div className="hidden lg:flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleParticles}
            aria-label={particlesEnabled ? "Disable resonance particles" : "Enable resonance particles"}
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card/60 transition-transform hover:scale-105 hover:bg-muted text-xs",
              particlesEnabled ? "text-cyan-400" : "text-muted-foreground",
            )}
            title={particlesEnabled ? "Cymatic Resonance Active" : "Cymatic Resonance Suspended"}
          >
            <Sparkles className={cn("h-3.5 w-3.5", particlesEnabled && "animate-pulse")} />
          </button>

          <ThemeToggle />

          {/* USER PROFILE & LOGOUT CONTROLS */}
          {user ? (
            <div className="flex items-center gap-2 pl-1 border-l border-border/60">
              <div className="flex flex-col items-end text-right">
                <span className="text-xs font-bold text-foreground leading-none max-w-[120px] truncate">
                  {userDisplayName}
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  {orgCode ? orgCode : roleLabel}
                </span>
              </div>

              <Link
                to="/settings"
                aria-label="Account Settings"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <SettingsIcon className="h-3.5 w-3.5" />
              </Link>

              <button
                type="button"
                onClick={() => signOut()}
                aria-label="Sign Out"
                title="Sign out of your session"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-glow transition-all hover:scale-105"
              >
                <LogIn className="h-3.5 w-3.5" />
                Sign in
              </Link>
            </div>
          )}
        </div>

        {/* MOBILE CONTROLS */}
        <div className="flex items-center gap-1.5 lg:hidden">
          <button
            type="button"
            onClick={handleToggleParticles}
            aria-label="Toggle resonance particles"
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card/60",
              particlesEnabled ? "text-cyan-400" : "text-muted-foreground",
            )}
          >
            <Sparkles className={cn("h-4 w-4", particlesEnabled && "animate-pulse")} />
          </button>
          <ThemeToggle />
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card/60 text-foreground"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle mobile menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {open && (
        <div className="border-t border-border/80 bg-card/95 backdrop-blur-2xl lg:hidden animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="mx-auto max-w-7xl px-4 py-4 space-y-4">
            {/* User Session Banner */}
            {user ? (
              <div className="p-3 rounded-xl bg-secondary/50 border border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                    {userDisplayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground leading-tight">{userDisplayName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Role: <span className="font-semibold text-primary">{roleLabel}</span>
                      {orgCode && ` • ${orgCode}`}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setOpen(false);
                    signOut();
                  }}
                  className="h-7 text-xs text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1" />
                  Exit
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-xs shadow-glow"
                >
                  <LogIn className="w-3.5 h-3.5" /> Sign in
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 py-2 rounded-lg bg-secondary text-secondary-foreground font-bold text-xs border border-border"
                >
                  Register Hub
                </Link>
              </div>
            )}

            {/* Nav list */}
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2">
                {roleLabel} Navigation
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1">
                {roleSpecificLinks.map(({ to, label, icon: Icon, badge, badgeColor }) => {
                  const active = pathname === to || (to !== "/" && pathname.startsWith(to));
                  return (
                    <Link
                      key={to}
                      to={to as any}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-colors",
                        active
                          ? "bg-primary/20 text-primary font-bold border border-primary/30"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4" />
                        <span>{label}</span>
                      </div>
                      {badge && (
                        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border", badgeColor)}>
                          {badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Quick Settings Link */}
            <div className="pt-2 border-t border-border/50 flex items-center justify-between px-1">
              <Link
                to="/settings"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <SettingsIcon className="w-3.5 h-3.5" />
                Settings & Preferences
              </Link>
              <Link
                to="/support"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Support
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navigation;
