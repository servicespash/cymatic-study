import React from "react";
import { useAuth } from "@/lib/auth-context";
import { useUserRole } from "@/hooks/useUserRole";
import { Sparkles, ShieldCheck, GraduationCap, PenTool } from "lucide-react";
import { getAddressedName } from "@/lib/name-utils";

export function DynamicGreeting() {
  const { user, profile } = useAuth();
  const { role, schoolName } = useUserRole();

  const rawName =
    profile?.display_name ||
    user?.user_metadata?.full_name ||
    null;
  const email = user?.email || null;
  const normalizedRole = (role || profile?.role || "student").toLowerCase();

  const { firstName, addressedName, roleLabel } = getAddressedName(rawName, email, normalizedRole);

  const isAdministrator = roleLabel === "Administrator";
  const isTeacher = roleLabel === "Teacher";

  const greetingTitle = `Welcome, ${addressedName}`;

  const greetingMessage = isAdministrator
    ? `Your administrative command center for ${schoolName || "Cymatic Study Ecosystem"} is fully synchronized and ready to guide institutional excellence.`
    : isTeacher
      ? `Faculty assessment workspace is active. Empowering your learners and tracking academic progress today.`
      : `Your personalized learning path in NCDC Lower and Upper Secondary modules is ready. Let's unlock new milestones, ${firstName}!`;

  const Icon = isAdministrator ? ShieldCheck : isTeacher ? PenTool : GraduationCap;
  const badgeText = isAdministrator ? "Admin Portal" : isTeacher ? "Teacher Station" : "Study Hub";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-card via-card/80 to-primary/5 p-5 sm:p-6 shadow-sm">
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-inner">
          <Icon className="w-6 h-6" />
        </div>
        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-foreground">
              {greetingTitle}
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-3 h-3" />
              {badgeText}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {greetingMessage}
          </p>
        </div>
      </div>
    </div>
  );
}

export default DynamicGreeting;
