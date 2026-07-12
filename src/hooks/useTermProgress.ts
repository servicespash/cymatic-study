import { useEffect, useCallback } from "react";
import { useGamificationStore } from "@/store/useGamificationStore";
import { QuizEngine, type DynamicDailyTask } from "@/lib/quiz-engine";
import { toast } from "sonner";

/**
 * useTermProgress Hook
 * Syncs task and quiz completion events from the QuizEngine to the 90-day central trajectory widget.
 * Ensures consistent point awarding and sync records.
 */
export function useTermProgress() {
  const { completedTasks, addCompletedTask, addXp } = useGamificationStore();

  // Sync effect: automatically detect completed tasks in QuizEngine and load them into GamificationStore
  useEffect(() => {
    const syncWithStore = () => {
      const activeTasks = QuizEngine.getTasks();
      const completedInEngine = activeTasks.filter((t) => t.isCompleted);

      completedInEngine.forEach((engineTask) => {
        // If not already in gamification store, add it
        const exists = completedTasks.some((t) => t.taskId === engineTask.id);
        if (!exists) {
          addCompletedTask({
            date: engineTask.created_at || new Date().toISOString(),
            taskId: engineTask.id,
            scorePct: 100, // Mark 100% completion for points-to-trajectory translation
            title: engineTask.title,
            taskType: engineTask.taskType,
          });
        }
      });
    };

    // Run initial sync
    syncWithStore();

    // Setup listener for storage events (e.g., when tasks update in other parts)
    window.addEventListener("storage", syncWithStore);
    return () => window.removeEventListener("storage", syncWithStore);
  }, [completedTasks, addCompletedTask]);

  /**
   * Completes a task, awards points/XP, and synchronizes the 90-day progress
   */
  const completeTaskAndSync = useCallback(
    (task: DynamicDailyTask) => {
      // 1. Complete in QuizEngine
      const updated = QuizEngine.completeTask(task.id);
      if (!updated) return;

      // 2. Add task to GamificationStore to award points to the 90-day trajectory
      addCompletedTask({
        date: new Date().toISOString(),
        taskId: task.id,
        scorePct: 100, // full progress
        title: task.title,
        taskType: task.taskType,
      });

      // 3. Award raw XP bonus
      addXp(task.points);

      toast.success(`🎉 Task Completed: +${task.points} XP!`, {
        description: `"${task.title}" has been synced to your 90-day term trajectory.`,
      });
    },
    [addCompletedTask, addXp],
  );

  return {
    completedTasks,
    completeTaskAndSync,
  };
}
