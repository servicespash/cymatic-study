import React, { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  GraduationCap,
  Sparkles,
  Info,
  LogOut,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import {
  ADMIN_STRUCTURED_PASSCODE,
  PRIMARY_ADMIN_EMAIL,
  isAdminSessionAuthorized,
  setAdminSessionAuthorized,
  clearAdminSession,
  getVerifiedAdminEmail,
  verifyAdminCredentials,
} from "@/lib/admin-auth";

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const { user, rawRole } = useAuth();
  const navigate = useNavigate();

  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  useEffect(() => {
    // 1. Check if session was already verified with the admin password
    if (isAdminSessionAuthorized()) {
      setIsAuthorized(true);
      setChecking(false);
      return;
    }

    // 2. Pre-populate email from signed-in user or primary admin
    const defaultEmail = user?.email || PRIMARY_ADMIN_EMAIL;
    setEmail(defaultEmail);
    setChecking(false);
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsVerifying(true);

    const result = verifyAdminCredentials(email, password);

    if (!result.success) {
      setErrorMessage(result.message);
      toast.error("Verification Failed", { description: result.message });
      setIsVerifying(false);
      return;
    }

    // Success! Authorize session
    setAdminSessionAuthorized(email);
    setIsAuthorized(true);
    setIsVerifying(false);
    toast.success("Admin Access Granted", {
      description: `Authenticated as ${email}. Full institutional controls unlocked.`,
    });
  };

  const handleLockSession = () => {
    clearAdminSession();
    setIsAuthorized(false);
    setPassword("");
    toast.info("Admin Session Locked", {
      description: "Password required to re-enter.",
    });
  };

  if (checking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
            Checking Command Access...
          </p>
        </div>
      </div>
    );
  }

  // Not verified yet: render credentials verification gateway
  if (!isAuthorized) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(59,130,246,0.08),transparent_70%)] pointer-events-none" />

        <Card className="w-full max-w-md border-border/80 bg-card/95 shadow-2xl backdrop-blur-xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500" />

          <CardHeader className="text-center space-y-2 pb-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-glow">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <CardTitle className="text-xl font-black uppercase tracking-tight">
              Institutional Admin Gateway
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground max-w-xs mx-auto">
              Command access for curriculum ingestion, educator approvals, and institutional
              oversight.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* Context Notice for student accounts */}
              {user && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-foreground/90 leading-relaxed">
                  <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-blue-400">Student Account Detected: </span>
                    <span>
                      You are not locked out. Verify your administrative email alongside the
                      structured password (
                      <strong className="font-mono text-primary font-bold">290350</strong>) below to
                      enter the admin dashboard.
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label
                  htmlFor="admin-email"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Administrator Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@school.ac.ug or latifisabirye123@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 h-11 text-sm bg-background/50 border-border"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="admin-passcode"
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Structured Password
                  </Label>
                  <span className="text-[10px] font-mono text-muted-foreground">Key: 290350</span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="admin-passcode"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password (290350)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 pr-10 h-11 text-sm font-mono bg-background/50 border-border"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs font-medium text-destructive animate-fade-in">
                  {errorMessage}
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-2 pt-2">
              <Button
                type="submit"
                disabled={isVerifying}
                className="w-full h-11 font-bold text-xs uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 shadow-md group"
              >
                {isVerifying ? "Verifying..." : "Unlock Admin Console"}
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>

              <div className="flex items-center justify-between w-full pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate({ to: "/student" })}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  <GraduationCap className="h-3.5 w-3.5 mr-1.5" />
                  Back to Student Hub
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate({ to: "/" })}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Home
                </Button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  // Authorized: render protected content with an active session indicator bar
  return (
    <div className="relative">
      {/* Top Banner showing active verified admin status */}
      <div className="bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-blue-900/30 border-b border-blue-500/20 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
              <ShieldCheck className="h-3 w-3 mr-1 inline" />
              Admin Verified
            </Badge>
            <span className="text-muted-foreground hidden sm:inline">
              Session authorized as{" "}
              <strong className="text-foreground">{getVerifiedAdminEmail() || email}</strong>
            </span>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleLockSession}
            className="h-7 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 px-2.5 rounded-lg"
          >
            <LogOut className="h-3 w-3 mr-1.5" />
            Lock Admin
          </Button>
        </div>
      </div>

      {children}
    </div>
  );
}
