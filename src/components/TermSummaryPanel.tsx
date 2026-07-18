import React from "react";
import { useGamificationStore } from "@/store/useGamificationStore";
import { Sparkles, TrendingUp, AlertCircle, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

export function TermSummaryPanel() {
  const { completedTasks } = useGamificationStore();
  const completedCount = completedTasks.length;

  // Calculate current score
  const sumScores = completedTasks.reduce((acc, t) => acc + t.scorePct, 0);
  const userScore = parseFloat((sumScores / 90).toFixed(2));

  // Ideal pace
  const idealScore = parseFloat(((100 / 90) * completedCount).toFixed(2));
  const isAhead = userScore >= idealScore;
  const difference = Math.abs(parseFloat((userScore - idealScore).toFixed(2)));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900/50 rounded-2xl p-5 border border-zinc-800/80 shadow-lg space-y-4"
    >
      <div className="flex items-center gap-2.5">
        <Sparkles className="h-4.5 w-4.5 text-yellow-400" />
        <h4 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
          Curriculum Term Summary Analysis
        </h4>
      </div>

      <div className="text-xs leading-relaxed text-zinc-400 space-y-2.5">
        <p>
          Based on the{" "}
          <span className="font-semibold text-zinc-200">
            National Curriculum Development Centre (NCDC)
          </span>{" "}
          S1-S4 learning directives, your performance trajectory maps directly to continuous
          classroom assessment standards.
        </p>

        {completedCount === 0 ? (
          <div className="rounded-xl bg-zinc-950 p-4 border border-zinc-800/40 text-center">
            <AlertCircle className="h-5 w-5 text-zinc-500 mx-auto mb-1.5" />
            <p className="font-medium text-zinc-300">No active term records found yet.</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Begin your S1 daily tasks or start a quiz above to map your continuous assessment
              path!
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-8 space-y-2">
              <p className="text-zinc-300 font-medium">
                {isAhead ? (
                  <span>
                    🚀 <span className="text-emerald-400 font-bold">Ahead of schedule!</span> You
                    are outperforming the ideal continuous evaluation path by{" "}
                    <span className="text-emerald-300 font-bold">{difference} points</span>.
                  </span>
                ) : (
                  <span>
                    ⚠️ <span className="text-amber-400 font-bold">Slightly behind pace.</span> You
                    are trailing the recommended baseline by{" "}
                    <span className="text-amber-300 font-bold">{difference} points</span>.
                  </span>
                )}
              </p>

              <p className="text-[11px] leading-relaxed">
                {isAhead
                  ? "Outstanding consistency! Your dedicated daily efforts under Lattys Cymatic Study align perfectly with Ugandan lower secondary competence metrics. This regular practice ensures that your final compiled grades remain stellar."
                  : "Every day counts. Simply completing one extra quiz or taking on today's personalized project with your AI tutor will immediately realign your score with the ideal 90-day trajectory. Keep climbing!"}
              </p>
            </div>

            <div className="md:col-span-4 bg-zinc-950 p-3 rounded-xl border border-zinc-800/50 text-center space-y-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                Competency Level
              </span>
              <span
                className={`text-base font-black ${isAhead ? "text-emerald-400" : "text-amber-400"}`}
              >
                {userScore >= 80
                  ? "Exceptional"
                  : userScore >= 50
                    ? "High Competence"
                    : "Progressing"}
              </span>
              <div className="w-full bg-zinc-900 rounded-full h-1 mt-1.5 overflow-hidden">
                <div
                  className={`h-full ${isAhead ? "bg-emerald-500" : "bg-amber-500"}`}
                  style={{ width: `${Math.min(100, (userScore / (idealScore || 1)) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
