import { useState, useEffect } from "react";
import { db } from "@/lib/db";
import { useGamificationStore } from "@/store/useGamificationStore";
import {
  Award,
  Lock,
  Compass,
  Zap,
  Flame,
  Dna,
  Binary,
  Star,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import { motion } from "framer-motion";

interface BadgeConfig {
  id: string;
  name: string;
  description: string;
  subject: "Math" | "Physics" | "Chemistry" | "Biology" | "General";
  requirementText: string;
  checkUnlocked: (stats: {
    Math: number;
    Physics: number;
    Chemistry: number;
    Biology: number;
    totalSessions: number;
    totalGaps: number;
  }) => boolean;
  icon: any;
  colorClass: string;
  bgGlowClass: string;
}

export function BadgesView() {
  const [sessions, setSessions] = useState<any[]>([]);
  const completedGaps = useGamificationStore((s) => s.completedGaps);

  useEffect(() => {
    async function fetchSessions() {
      const allSessions = await db.chatSessions.toArray();
      setSessions(allSessions);
    }
    fetchSessions();
  }, [completedGaps]);

  // Utility to count progress categories
  const categorizeText = (text: string): "Math" | "Physics" | "Chemistry" | "Biology" | null => {
    const t = text.toLowerCase();
    if (
      /math|algebra|quadratic|equation|calculus|geometry|fraction|divide|multiply|subtract|add|sum|sigma|theorem|numeric|number/.test(
        t,
      )
    ) {
      return "Math";
    }
    if (
      /physics|force|gravity|velocity|speed|kinematics|motion|mechanics|wave|optics|light|laser|electricity|magnet|ampere|volt|joule|newton/.test(
        t,
      )
    ) {
      return "Physics";
    }
    if (
      /chemistry|chemical|acid|base|ph|molecule|atom|bond|compound|periodic|reaction|catalyst|element|flask|beaker|alkali/.test(
        t,
      )
    ) {
      return "Chemistry";
    }
    if (
      /biology|cell|dna|organism|gene|evolution|plant|photosynthesis|mitochondria|bacteria|virus|anatomy|heart|lung|species/.test(
        t,
      )
    ) {
      return "Biology";
    }
    return null;
  };

  const counts = {
    Math: 0,
    Physics: 0,
    Chemistry: 0,
    Biology: 0,
  };

  sessions.forEach((s) => {
    let det: "Math" | "Physics" | "Chemistry" | "Biology" | null = null;
    if (s.messages) {
      for (const m of s.messages) {
        det = categorizeText(m.text);
        if (det) break;
      }
    }
    if (det) counts[det] += 1;
  });

  completedGaps.forEach((g) => {
    const det = categorizeText(g);
    if (det) counts[det] += 1;
  });

  const totalSessions = sessions.length;
  const totalGaps = completedGaps.length;

  const currentStats = {
    Math: counts.Math,
    Physics: counts.Physics,
    Chemistry: counts.Chemistry,
    Biology: counts.Biology,
    totalSessions,
    totalGaps,
  };

  const badgeTemplates: BadgeConfig[] = [
    {
      id: "curriculum-pioneer",
      name: "Curriculum Pioneer",
      description: "Began your learning journey on Cymatic Study",
      subject: "General",
      requirementText: "Complete 1 study session",
      checkUnlocked: (st) => st.totalSessions >= 1,
      icon: Compass,
      colorClass: "text-amber-400 border-amber-500/30 bg-amber-500/10",
      bgGlowClass: "from-amber-500/10 to-transparent",
    },
    {
      id: "math-spark",
      name: "Numerical Spark",
      description: "Demonstrated fundamental numerical capability",
      subject: "Math",
      requirementText: "Have 1 Math interaction (session/gap)",
      checkUnlocked: (st) => st.Math >= 1,
      icon: Binary,
      colorClass: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
      bgGlowClass: "from-cyan-500/10 to-transparent",
    },
    {
      id: "math-ascendant",
      name: "Theorem Ascendant",
      description: "Superb progression in quantitative logic",
      subject: "Math",
      requirementText: "Have 3 Math interactions",
      checkUnlocked: (st) => st.Math >= 3,
      icon: Star,
      colorClass: "text-blue-400 border-blue-500/30 bg-blue-500/10",
      bgGlowClass: "from-blue-500/10 to-transparent",
    },
    {
      id: "physics-gravity",
      name: "Gravity Defier",
      description: "Began questioning and solving physical motion equations",
      subject: "Physics",
      requirementText: "Have 1 Physics interaction",
      checkUnlocked: (st) => st.Physics >= 1,
      icon: Zap,
      colorClass: "text-violet-400 border-violet-500/30 bg-violet-500/10",
      bgGlowClass: "from-violet-500/10 to-transparent",
    },
    {
      id: "physics-cosmic",
      name: "Cosmic Force",
      description: "Superb command of physical concepts and mechanisms",
      subject: "Physics",
      requirementText: "Have 3 Physics interactions",
      checkUnlocked: (st) => st.Physics >= 3,
      icon: Award,
      colorClass: "text-purple-400 border-purple-500/30 bg-purple-500/10",
      bgGlowClass: "from-purple-500/10 to-transparent",
    },
    {
      id: "chem-reactant",
      name: "Atomic Reactant",
      description: "Explored the atomic structures and reactions",
      subject: "Chemistry",
      requirementText: "Have 1 Chemistry interaction",
      checkUnlocked: (st) => st.Chemistry >= 1,
      icon: Flame,
      colorClass: "text-orange-400 border-orange-500/30 bg-orange-500/10",
      bgGlowClass: "from-orange-500/10 to-transparent",
    },
    {
      id: "chem-bond",
      name: "Bond Weaver",
      description: "Gained mastery in chemical compound analysis",
      subject: "Chemistry",
      requirementText: "Have 3 Chemistry interactions",
      checkUnlocked: (st) => st.Chemistry >= 3,
      icon: Star,
      colorClass: "text-pink-400 border-pink-500/30 bg-pink-500/10",
      bgGlowClass: "from-pink-500/10 to-transparent",
    },
    {
      id: "bio-genesis",
      name: "Cellular Genesis",
      description: "Explored the fundamentals of biological structures",
      subject: "Biology",
      requirementText: "Have 1 Biology interaction",
      checkUnlocked: (st) => st.Biology >= 1,
      icon: Dna,
      colorClass: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
      bgGlowClass: "from-emerald-500/10 to-transparent",
    },
    {
      id: "bio-guardian",
      name: "Biosphere Guardian",
      description: "Understood complex systems, genomes and ecology",
      subject: "Biology",
      requirementText: "Have 3 Biology interactions",
      checkUnlocked: (st) => st.Biology >= 3,
      icon: Award,
      colorClass: "text-teal-400 border-teal-500/30 bg-teal-500/10",
      bgGlowClass: "from-teal-500/10 to-transparent",
    },
    {
      id: "apex-scholar",
      name: "Apex Scholar",
      description: "Superb coverage of the Lower Secondary Curriculum",
      subject: "General",
      requirementText: "Solve 8 knowledge gaps",
      checkUnlocked: (st) => st.totalGaps >= 8,
      icon: Award,
      colorClass: "text-rose-400 border-rose-500/30 bg-rose-500/10",
      bgGlowClass: "from-rose-500/10 to-transparent",
    },
  ];

  const unlockedCount = badgeTemplates.filter((b) => b.checkUnlocked(currentStats)).length;

  return (
    <div className="bg-zinc-900/80 backdrop-blur-md rounded-2xl p-6 border border-zinc-800/80 shadow-xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
            <Award className="h-5 w-5 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg tracking-tight">
              Achievements & Badges
            </h3>
            <p className="text-zinc-500 text-xs">
              Unlock visually distinct medals across scientific domains
            </p>
          </div>
        </div>
        <div className="bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800 text-xs text-zinc-400 font-medium">
          Unlocked <span className="text-yellow-400 font-bold">{unlockedCount}</span> /{" "}
          {badgeTemplates.length}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {badgeTemplates.map((badge) => {
          const isUnlocked = badge.checkUnlocked(currentStats);
          const IconComponent = badge.icon;

          return (
            <motion.div
              key={badge.id}
              whileHover={{ y: -4 }}
              className={`relative overflow-hidden flex flex-col items-center text-center p-4 rounded-xl border transition-all duration-300 ${
                isUnlocked
                  ? `${badge.colorClass} border-zinc-700/50`
                  : "bg-zinc-950/40 border-zinc-800/40 text-zinc-600"
              }`}
            >
              {isUnlocked && (
                <div
                  className={`absolute inset-0 bg-gradient-to-b ${badge.bgGlowClass} pointer-events-none opacity-40`}
                />
              )}

              <div className="relative mb-3 flex items-center justify-center">
                {isUnlocked ? (
                  <div className="p-3 bg-zinc-900/80 rounded-full border border-zinc-700/40 shadow-inner">
                    <IconComponent className="h-6 w-6" />
                  </div>
                ) : (
                  <div className="p-3 bg-zinc-900/30 rounded-full border border-zinc-800 text-zinc-700">
                    <Lock className="h-5 w-5" />
                  </div>
                )}
              </div>

              <span className="text-xs font-semibold text-zinc-200 tracking-tight block max-w-full truncate">
                {badge.name}
              </span>

              <span className="text-[10px] text-zinc-500 mt-1 line-clamp-2 min-h-[2.5rem]">
                {badge.description}
              </span>

              <div className="mt-3 w-full border-t border-zinc-800/50 pt-2 flex items-center justify-center gap-1">
                <span className="text-[9px] font-medium text-zinc-400 uppercase tracking-widest block max-w-full truncate">
                  {isUnlocked ? "Unlocked!" : badge.requirementText}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
