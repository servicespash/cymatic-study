import { useState, useEffect } from "react";
import { useGamificationStore } from "@/store/useGamificationStore";
import { Target, Calendar, Clock, Edit2, Check, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function StudyGoalsCard() {
  const { goalName, goalType, goalTarget, goalDeadline, completedGaps, setStudyGoal } =
    useGamificationStore();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(goalName);
  const [type, setType] = useState<"daily" | "weekly">(goalType);
  const [target, setTarget] = useState(goalTarget);
  const [deadline, setDeadline] = useState(goalDeadline.split("T")[0]);

  // Sync state with store when not editing
  useEffect(() => {
    if (!isEditing) {
      setName(goalName);
      setType(goalType);
      setTarget(goalTarget);
      setDeadline(goalDeadline.split("T")[0]);
    }
  }, [goalName, goalType, goalTarget, goalDeadline, isEditing]);

  // Countdown timer logic
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const targetTime = new Date(goalDeadline).getTime();
      const difference = targetTime - now;

      if (difference <= 0) {
        setTimeLeft("Goal Time Ended");
        clearInterval(interval);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0 || days > 0) parts.push(`${hours}h`);
      parts.push(`${minutes}m`);

      setTimeLeft(parts.join(" ") + " remaining");
    }, 1000);

    return () => clearInterval(interval);
  }, [goalDeadline]);

  // Auto-calculated progress: let's base it on completedGaps. For realistic feel, let's count completedGaps.
  // Gaps cleared since target might be 0, so let's use the total gaps solved, or allow cap to target.
  const currentProgress = completedGaps.length;
  const progressPercent = Math.min(100, Math.round((currentProgress / (target || 1)) * 100));

  const handleSave = () => {
    // Construct full ISO deadline from date input
    const dateObj = new Date(deadline);
    // Set to end of the selected day
    dateObj.setHours(23, 59, 59, 999);
    setStudyGoal(name, type, target, dateObj.toISOString());
    setIsEditing(false);
  };

  return (
    <div
      id="study-goals-card"
      className="bg-zinc-900/80 backdrop-blur-md rounded-2xl p-6 border border-zinc-800/80 shadow-xl space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20">
            <Target className="h-5 w-5 text-rose-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg tracking-tight">Active Study Goal</h3>
            <p className="text-zinc-500 text-xs">Set specific milestones to stay on track</p>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors border border-zinc-800"
          aria-label={isEditing ? "Cancel editing goal" : "Edit study goal"}
        >
          {isEditing ? <Check className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Goal Description
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                placeholder="e.g. Master 3 Biology topics"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as "daily" | "weekly")}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                >
                  <option value="daily">Daily Target</option>
                  <option value="weekly">Weekly Target</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Target Gaps to Clear
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={target}
                  onChange={(e) => setTarget(parseInt(e.target.value) || 1)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Deadline Date</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>

            <button
              onClick={handleSave}
              className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white font-medium text-xs rounded-xl transition-colors shadow-lg"
            >
              Update Study Goal
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-4"
          >
            <div>
              <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
                <span>{goalType} Target</span>
                <span>•</span>
                <span className="text-zinc-500">{timeLeft}</span>
              </div>
              <h4 className="text-base font-bold text-white mt-1 leading-snug">{goalName}</h4>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-zinc-400">Completion Status</span>
                <span className="text-rose-400 font-mono font-bold">
                  {currentProgress} / {goalTarget} ({progressPercent}%)
                </span>
              </div>
              <div className="h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/50 relative">
                <motion.div
                  className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-zinc-500 bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                <span>By {new Date(goalDeadline).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-zinc-400" />
                <span>{timeLeft}</span>
              </div>
            </div>

            {progressPercent >= 100 && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-center gap-2.5 text-rose-400"
              >
                <Sparkles className="h-4 w-4 shrink-0" />
                <span className="text-[11px] font-medium leading-normal">
                  Goal fully completed! Great job on mastering your curriculum!
                </span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
