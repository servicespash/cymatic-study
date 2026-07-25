import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  User,
  Building,
  Copy,
  Check,
  LogOut,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  School,
  IdCard,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SchoolIdQRCode } from "@/components/SchoolIdQRCode";

interface UserProfileCardProps {
  className?: string;
  showActions?: boolean;
}

export function UserProfileCard({ className = "", showActions = true }: UserProfileCardProps) {
  const { user, profile, signOut, isInstitutional, isTeacher, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) {
    return (
      <div className={`p-6 rounded-3xl border border-border bg-card/60 text-center ${className}`}>
        <User className="h-10 w-10 mx-auto mb-2 text-muted-foreground/60" />
        <h3 className="text-base font-bold text-foreground">Guest Explorer Mode</h3>
        <p className="text-xs text-muted-foreground mt-1 mb-4">
          Sign in or connect with your School ID to sync progress & unlock personalized NCDC study tools.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-glow hover:scale-105 transition-transform"
        >
          Sign In / Institutional Connect
        </Link>
      </div>
    );
  }

  const schoolId = profile?.school_id || profile?.org_id || localStorage.getItem("cymatic_school_id");
  const schoolName = profile?.school_name || "Uganda NCDC Member School";
  const displayName = profile?.display_name || profile?.full_name || user.email?.split("@")[0] || "Scholar";
  const userEmail = user.email || "";
  const roleTitle = isAdmin
    ? "School Administrator"
    : isTeacher
      ? "NCDC Instructor / Teacher"
      : isInstitutional
        ? "Institutional Scholar"
        : "Independent Scholar";

  const handleCopySchoolId = () => {
    if (!schoolId) {
      toast.info("No School ID set. You can set your School ID in Settings.");
      return;
    }
    navigator.clipboard.writeText(schoolId);
    setCopied(true);
    toast.success(`School ID copied to clipboard: ${schoolId}`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSignOut = async () => {
    setLoggingOut(true);
    const toastId = toast.loading("Signing out of your session...");
    try {
      await signOut();
      toast.success("Successfully signed out.", { id: toastId });
      navigate({ to: "/login" });
    } catch (err: any) {
      toast.error(err?.message || "Failed to sign out.", { id: toastId });
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div
      className={`rounded-3xl border border-border/80 bg-card/90 p-5 md:p-6 backdrop-blur shadow-md relative overflow-hidden ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* User identity & Avatar */}
        <div className="flex items-start gap-4">
          <div className="relative h-14 w-14 shrink-0 rounded-2xl bg-gradient-hero p-0.5 shadow-glow">
            <div className="h-full w-full rounded-[14px] bg-background flex items-center justify-center font-black text-xl text-primary uppercase">
              {displayName.charAt(0)}
            </div>
            <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-background" title="Authenticated Session" />
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-extrabold tracking-tight text-foreground truncate max-w-[220px]">
                {displayName}
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary border border-primary/20">
                <ShieldCheck className="h-3 w-3" />
                {roleTitle}
              </span>
            </div>

            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>

            {/* School / Institution details */}
            <div className="pt-1.5 flex items-center gap-2 text-xs">
              <Building className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span className="text-foreground/90 font-medium truncate">
                {schoolId ? schoolName : "Independent / Custom School"}
              </span>
            </div>
          </div>
        </div>

        {/* School ID Badge & Quick Actions */}
        <div className="flex flex-col sm:items-end gap-2 border-t sm:border-t-0 border-border/40 pt-3 sm:pt-0">
          <div className="flex items-center gap-2 bg-muted/60 p-2 rounded-2xl border border-border/60">
            <div className="flex items-center gap-1.5 px-2">
              <IdCard className="h-4 w-4 text-primary" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                  School ID
                </span>
                <span className="text-xs font-mono font-bold text-foreground">
                  {schoolId || "Not Configured"}
                </span>
              </div>
            </div>

            {schoolId ? (
              <button
                onClick={handleCopySchoolId}
                className="h-8 px-2.5 rounded-xl bg-background border border-border hover:border-primary/40 text-xs font-semibold flex items-center gap-1 transition-colors"
                title="Copy School ID"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            ) : (
              <Link
                to="/settings"
                className="h-8 px-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 text-xs font-bold flex items-center gap-1 transition-colors"
              >
                + Add ID
              </Link>
            )}
          </div>

          {showActions && (
            <div className="flex items-center gap-2">
              <Link
                to="/settings"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
              >
                <SettingsIcon className="h-3.5 w-3.5" />
                Settings
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                disabled={loggingOut}
                className="h-8 rounded-xl border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 text-xs font-bold"
              >
                <LogOut className="h-3.5 w-3.5 mr-1" />
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </div>
      {/* Digital QR Code Identity Strip (if School ID is set) */}
      {schoolId && (
        <div className="mt-4 pt-4 border-t border-border/40">
          <SchoolIdQRCode
            schoolId={schoolId}
            schoolName={schoolName}
            studentName={displayName}
            role={roleTitle}
          />
        </div>
      )}
    </div>
  );
}
