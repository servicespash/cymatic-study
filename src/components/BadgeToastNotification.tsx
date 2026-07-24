import { useEffect } from "react";
import { Award, Sparkles, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGamificationStore } from "@/store/useGamificationStore";
import { toast } from "sonner";

export function BadgeToastNotification() {
  const { xp, level, completedTasks, completedGaps } = useGamificationStore();

  useEffect(() => {
    // Check milestones and trigger custom animated toast notifications
    const completedCount = completedTasks.length;
    if (completedCount === 1) {
      toast.custom((t) => (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="flex items-center gap-3 rounded-2xl border border-cyan-500/30 bg-zinc-950/95 p-4 shadow-2xl text-zinc-100 backdrop-blur-md"
        >
          <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400">
            <Award className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
                Milestone Unlocked!
              </span>
              <Sparkles className="h-3 w-3 text-yellow-400" />
            </div>
            <h4 className="text-sm font-bold text-zinc-100">First Study Milestone Reached</h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              You've started your NCDC mastery journey (+50 XP).
            </p>
          </div>
        </motion.div>
      ));
    }
  }, [completedTasks.length]);

  return null;
}
