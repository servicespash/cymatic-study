import React from "react";
import { useGamificationStore } from "@/store/useGamificationStore";
import { Award, Flame, CheckCircle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface Milestone {
  id: string;
  name: string;
  description: string;
  requirement: string;
  icon: React.ReactNode;
  unlocked: boolean;
  colorClass: string;
}

export function MilestoneBadges() {
  const { completedTasks, completedGaps } = useGamificationStore();
  const completedCount = completedTasks.length;

  // Criteria
  const sumScores = completedTasks.reduce((acc, t) => acc + t.scorePct, 0);
  const userScore = parseFloat((sumScores / 90).toFixed(2));
  const idealScore = parseFloat(((100 / 90) * completedCount).toFixed(2));

  const hasStreak = completedCount >= 7;
  const hasMastery = completedGaps.length >= 3;
  const isAhead = completedCount > 0 && userScore >= idealScore;

  const milestones: Milestone[] = [
    {
      id: "7-day-streak",
      name: "7-Day Streak",
      description: "Maintained learning momentum for 7 consecutive tasks",
      requirement: `Complete 7 tasks (Current: ${completedCount}/7)`,
      icon: <Flame className="h-5 w-5 text-orange-400" />,
      unlocked: hasStreak,
      colorClass: "from-orange-500/10 to-amber-500/10 border-orange-500/30 text-orange-400",
    },
    {
      id: "topic-master",
      name: "Topic Master",
      description: "Successfully solved at least 3 critical curriculum gaps",
      requirement: `Solve 3 Gaps (Current: ${completedGaps.length}/3)`,
      icon: <Sparkles className="h-5 w-5 text-cyan-400" />,
      unlocked: hasMastery,
      colorClass: "from-cyan-500/10 to-blue-500/10 border-cyan-500/30 text-cyan-400",
    },
    {
      id: "ahead-of-schedule",
      name: "Ahead of Schedule",
      description: "Competency score is outpacing the 90-day trajectory",
      requirement: "Exceed the recommended daily NCDC pace",
      icon: <Award className="h-5 w-5 text-emerald-400" />,
      unlocked: isAhead,
      colorClass: "from-emerald-500/10 to-teal-500/10 border-emerald-500/30 text-emerald-400",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-400 animate-pulse" />
          <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
            Milestone Awards & Badges
          </h3>
        </div>
        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider bg-zinc-950 px-2 py-1 rounded-md border border-zinc-900">
          {milestones.filter((m) => m.unlocked).length} / {milestones.length} Unlocked
        </span>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {milestones.map((milestone) => (
          <motion.div
            key={milestone.id}
            whileHover={milestone.unlocked ? { scale: 1.02 } : {}}
            className={`relative rounded-xl p-4 border overflow-hidden flex flex-col justify-between transition-all duration-300 ${
              milestone.unlocked
                ? `bg-gradient-to-br ${milestone.colorClass} shadow-glow shadow-black/10`
                : "bg-zinc-950/20 border-zinc-800/40 text-zinc-600"
            }`}
          >
            {milestone.unlocked && (
              <div className="absolute top-0 right-0 p-1 opacity-20">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
            )}

            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-lg bg-zinc-900 border ${milestone.unlocked ? "border-zinc-700" : "border-zinc-800/50"}`}
              >
                {milestone.icon}
              </div>
              <div>
                <h4
                  className={`text-xs font-bold tracking-tight ${milestone.unlocked ? "text-zinc-100" : "text-zinc-500"}`}
                >
                  {milestone.name}
                </h4>
                <p className="text-[10px] text-zinc-500 mt-0.5 leading-snug">
                  {milestone.description}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-zinc-900 flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                {milestone.unlocked ? "Award Earned!" : "In Progress"}
              </span>
              <span className="text-[9px] text-zinc-400 font-semibold bg-zinc-950/80 px-2 py-0.5 rounded border border-zinc-900">
                {milestone.requirement}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
