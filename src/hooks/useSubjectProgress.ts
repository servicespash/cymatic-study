import { useState, useEffect, useCallback } from "react";
import {
  getAllSubjectProgress,
  updateSubjectProgress,
  logRecentActivity,
  type SubjectProgress,
} from "@/lib/offline-db";

export function useSubjectProgress() {
  const [progress, setProgress] = useState<SubjectProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    try {
      const data = await getAllSubjectProgress();
      setProgress(data);
    } catch (e) {
      console.error("Error loading subject progress:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const incrementProgress = useCallback(
    async (subject: string, incrementAmount = 5, activityDesc: string) => {
      try {
        const records = await getAllSubjectProgress();
        const existing = records.find((r) => r.subject === subject);
        const currentPercentage = existing ? existing.completedPercentage : 15;
        const nextPercentage = Math.min(100, currentPercentage + incrementAmount);

        // Update progress in Dexie
        await updateSubjectProgress(subject, nextPercentage);
        // Log activity in Dexie
        await logRecentActivity(
          subject === "Physics" || subject === "Math" ? "quiz" : "lesson",
          activityDesc,
        );

        // Reload state
        await fetchProgress();
      } catch (e) {
        console.error("Failed to update progress:", e);
      }
    },
    [fetchProgress],
  );

  return {
    progress,
    loading,
    incrementProgress,
    refreshProgress: fetchProgress,
  };
}
