import { Link, useLocation } from "@tanstack/react-router";
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
  Menu,
  MessagesSquare,
  Newspaper,
  Settings as SettingsIcon,
  Sparkles,
  X,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toggleParticles } from "@/components/CymaticBackground";
import { supabase } from "@/integrations/supabase/client";

interface NavLink {
  to: string;
  label: string;
  icon: LucideIcon;
}

const links: readonly NavLink[] = [
  { to: "/", label: "Home", icon: Sparkles },
  { to: "/news", label: "News", icon: Newspaper },
  { to: "/lessons", label: "Lessons", icon: BookOpen },
  { to: "/quizzes", label: "Lightbulb", icon: Lightbulb },
  { to: "/chat", label: "Chat", icon: MessagesSquare },
  { to: "/tools", label: "Tools", icon: Calculator },
  { to: "/curriculum", label: "Curriculum", icon: GraduationCap },
  { to: "/projects", label: "Projects", icon: FileCode },
  { to: "/analytics", label: "Analytics", icon: LineChart },
  { to: "/tutor", label: "Tutor", icon: MessagesSquare },
  { to: "/support", label: "Support", icon: HelpCircle },
] as const;

export function Navbar() {
  const { user, isMockPreview, mockRole, profile } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [particlesEnabled, setParticlesEnabled] = useState(true);

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

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      if (isMockPreview) {
        setIsAdmin(mockRole === "admin");
        return;
      }

      try {
        // Explicitly type the RPC response
        const { data, error } = await supabase.rpc("has_role", {
          uid: user.id,
          requested_role: "org_admin",
        });

        if (error) {
          console.warn("Error checking admin role:", error.message || error);
          // Fallback to checking profile role from auth context to be safe and elegant
          setIsAdmin(profile?.role === "admin" || profile?.role === "school_admin");
          return;
        }

        setIsAdmin(!!data);
      } catch (err) {
        console.warn("Exception checking admin role:", err);
        setIsAdmin(profile?.role === "admin" || profile?.role === "school_admin");
      }
    };
    checkAdmin();
  }, [user, isMockPreview, mockRole, profile]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-hero shadow-glow transition-smooth group-hover:scale-105">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight">
              Lattys <span className="text-primary">Cymatic</span>
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              × Pash Media
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-smooth",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleParticles}
            aria-label={
              particlesEnabled ? "Disable particles background" : "Enable particles background"
            }
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card/60 transition-smooth hover:scale-105 hover:bg-muted",
              particlesEnabled ? "text-cyan-400" : "text-muted-foreground",
            )}
            title={particlesEnabled ? "Cymatic Resonance Active" : "Cymatic Resonance Suspended"}
          >
            <Sparkles className={cn("h-4 w-4", particlesEnabled && "animate-pulse")} />
          </button>
          <ThemeToggle />

          {isAdmin && (
            <Link
              to="/admin/dashboard"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 text-sm font-bold text-blue-500 transition-smooth hover:bg-blue-500/20"
            >
              <ShieldCheck className="h-4 w-4" />
              Command
            </Link>
          )}

          <Link
            to="/settings"
            aria-label="Settings"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card/60 text-foreground transition-smooth hover:scale-105 hover:bg-muted"
          >
            <SettingsIcon className="h-4 w-4" />
          </Link>
          {user ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth hover:scale-[1.03]"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth hover:scale-[1.03]"
            >
              <LogIn className="h-4 w-4" />
              Sign in
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={handleToggleParticles}
            aria-label={
              particlesEnabled ? "Disable particles background" : "Enable particles background"
            }
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card/60 transition-smooth hover:bg-muted",
              particlesEnabled ? "text-cyan-400" : "text-muted-foreground",
            )}
          >
            <Sparkles className={cn("h-4 w-4", particlesEnabled && "animate-pulse")} />
          </button>
          <ThemeToggle />
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-card/85 lg:hidden animate-fade-in">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            {isAdmin && (
              <Link
                to="/admin/dashboard"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold text-blue-500 bg-blue-500/10 hover:bg-blue-500/20"
              >
                <ShieldCheck className="h-4 w-4" />
                Institutional Command
              </Link>
            )}

            {links.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
            <Link
              to="/settings"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <SettingsIcon className="h-4 w-4" />
              Settings
            </Link>
            <Link
              to={user ? "/dashboard" : "/login"}
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow"
            >
              {user ? (
                <>
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" /> Sign in
                </>
              )}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
