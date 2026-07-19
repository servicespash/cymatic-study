import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { User, ShieldCheck, BookOpen, GraduationCap, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function RoleTogglePanel() {
  const { isGuestMode, guestRole, setGuestRole, startGuestSession } = useAuth();

  const roles = [
    {
      id: "student" as const,
      name: "Student View",
      description:
        "Interactive learning dashboards, S1-S4 topics, personalized AI tutor, points tracking, and milestone achievements.",
      icon: <GraduationCap className="h-4 w-4 text-cyan-400" />,
      colorClass: "border-cyan-500/20 hover:border-cyan-500/50 text-cyan-400 bg-cyan-950/10",
      activeColorClass: "border-cyan-500 bg-cyan-950/30 ring-2 ring-cyan-500/20 text-cyan-300",
    },
    {
      id: "teacher" as const,
      name: "Teacher View",
      description:
        "Curriculum mapping, direct student progress sheets, manual daily task builder, and project review dashboards.",
      icon: <BookOpen className="h-4 w-4 text-violet-400" />,
      colorClass:
        "border-violet-500/20 hover:border-violet-500/50 text-violet-400 bg-violet-950/10",
      activeColorClass:
        "border-violet-500 bg-violet-950/30 ring-2 ring-violet-500/20 text-violet-300",
    },
    {
      id: "admin" as const,
      name: "Administrator View",
      description:
        "Ecosystem management, offline sync audit logs, school organizational registry, and systemic database controls.",
      icon: <ShieldCheck className="h-4 w-4 text-yellow-400" />,
      colorClass:
        "border-yellow-500/20 hover:border-yellow-500/50 text-yellow-400 bg-yellow-950/10",
      activeColorClass:
        "border-yellow-500 bg-yellow-950/30 ring-2 ring-yellow-500/20 text-yellow-300",
    },
  ];

  const handleRoleSelect = (roleId: "student" | "teacher" | "admin") => {
    if (!isGuestMode) {
      // If we are not in guest mode, trigger it so they can test immediately
      if (startGuestSession) startGuestSession(roleId);
    } else if (setGuestRole) {
      setGuestRole(roleId);
    }
  };

  return (
    <div className="bg-zinc-900/80 backdrop-blur-md rounded-2xl p-6 border border-zinc-800/80 shadow-xl space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
          <User className="h-5 w-5 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-lg tracking-tight">
            Interactive Role Simulator
          </h3>
          <p className="text-zinc-500 text-xs">
            Simulate user view-states to test permissions, custom tasks, and administrative features
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {roles.map((r) => {
          const isActive = isGuestMode && guestRole === r.id;
          return (
            <button
              key={r.id}
              onClick={() => handleRoleSelect(r.id)}
              className={`flex flex-col text-left p-4 rounded-xl border transition-all duration-300 ${
                isActive
                  ? r.activeColorClass
                  : "bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800">{r.icon}</div>
                <span className="text-xs font-bold uppercase tracking-wider">{r.name}</span>
              </div>

              <p className="text-[10px] text-zinc-500 mt-2.5 leading-relaxed flex-grow">
                {r.description}
              </p>

              <div className="mt-4 pt-2 w-full border-t border-zinc-900/50 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                <span>{isActive ? "Active view-state" : "Click to simulate"}</span>
                <ArrowRight className="h-3 w-3" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
