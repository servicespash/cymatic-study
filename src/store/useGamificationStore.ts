import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface CompletedTask {
  date: string;
  taskId: string;
  scorePct: number;
  title: string;
  taskType: string;
}

interface GamificationState {
  xp: number;
  level: number;
  badges: string[]; // IDs of unlocked badges
  completedGaps: string[]; // Topics marked as learned
  goalName: string;
  goalType: "daily" | "weekly";
  goalTarget: number;
  goalDeadline: string;
  completedTasks: CompletedTask[]; // 90-day term tasks completed
  addXp: (amount: number) => void;
  completeGap: (topic: string) => void;
  setStudyGoal: (name: string, type: "daily" | "weekly", target: number, deadline: string) => void;
  addCompletedTask: (task: CompletedTask) => void;
}

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set) => ({
      xp: 0,
      level: 1,
      badges: [],
      completedGaps: [],
      goalName: "Master 3 Knowledge Gaps",
      goalType: "weekly",
      goalTarget: 3,
      goalDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now default
      completedTasks: [],
      addXp: (amount) =>
        set((state) => {
          const newXp = state.xp + amount;
          const newLevel = Math.floor(newXp / 100) + 1;
          return { xp: newXp, level: newLevel };
        }),
      completeGap: (topic) =>
        set((state) => {
          if (state.completedGaps.includes(topic)) return state;

          const newCompletedGaps = [...state.completedGaps, topic];
          const newXp = state.xp + 20; // 20 XP per gap
          const newLevel = Math.floor(newXp / 100) + 1;

          return {
            completedGaps: newCompletedGaps,
            xp: newXp,
            level: newLevel,
          };
        }),
      setStudyGoal: (name, type, target, deadline) =>
        set({
          goalName: name,
          goalType: type,
          goalTarget: target,
          goalDeadline: deadline,
        }),
      addCompletedTask: (task) =>
        set((state) => {
          // Check if already completed this task today or by taskId
          if (state.completedTasks.some((t) => t.taskId === task.taskId)) return state;

          const newCompletedTasks = [...state.completedTasks, task];
          const newXp = state.xp + 50; // 50 XP per daily task/quiz
          const newLevel = Math.floor(newXp / 100) + 1;
          return {
            completedTasks: newCompletedTasks,
            xp: newXp,
            level: newLevel,
          };
        }),
    }),
    {
      name: "gamification-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
