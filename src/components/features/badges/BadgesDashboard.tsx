import { useGamificationStore } from "@/store/useGamificationStore";
import { Trophy, Award, Zap } from "lucide-react";
import { motion } from "framer-motion";

export function BadgesDashboard() {
  const { xp, level, badges } = useGamificationStore();
  const xpToNextLevel = 100 - (xp % 100);

  return (
    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="h-5 w-5 text-yellow-400" />
        <h3 className="text-white font-semibold">Progress Dashboard</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-zinc-800 p-4 rounded-lg">
          <p className="text-zinc-400 text-xs uppercase tracking-widest">Level</p>
          <p className="text-2xl font-bold text-white">{level}</p>
        </div>
        <div className="bg-zinc-800 p-4 rounded-lg">
          <p className="text-zinc-400 text-xs uppercase tracking-widest">XP</p>
          <p className="text-2xl font-bold text-white">{xp}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-zinc-400">
          <span>Next Level</span>
          <span>{xpToNextLevel} XP needed</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-cyan-500"
            initial={{ width: 0 }}
            animate={{ width: `${xp % 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
