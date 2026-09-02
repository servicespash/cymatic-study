import { useState, useEffect, useCallback, useRef } from "react";
import {
  db,
  syncQueue,
  updateSubjectProgress as dbUpdateSubjectProgress,
  getAllSubjectProgress as dbGetAllSubjectProgress,
  getSubjectProgress as dbGetSubjectProgress,
  recordQuizAttempt as dbRecordQuizAttempt,
  logRecentActivity as dbLogRecentActivity,
  getRecentActivities as dbGetRecentActivities,
  type SubjectProgress,
  type RecentActivity,
  type QueuedAttempt,
} from "@/lib/offline-db";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context-core";
import { toast } from "sonner";

export interface StudentProgressStats {
  totalSubjects: number;
  averageProgress: number;
  completedSubjects: number;
  highestSubject: { subject: string; percentage: number } | null;
  lowestSubject: { subject: string; percentage: number } | null;
  totalPoints: number;
  pendingSyncCount: number;
}

export interface UseStudentProgressSyncReturn {
  // Connectivity & Sync Status
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: Date | null;
  syncError: string | null;

  // Progression Data
  progressList: SubjectProgress[];
  recentActivities: RecentActivity[];
  stats: StudentProgressStats;

  // Actions
  recordProgression: (subject: string, percentage: number) => Promise<void>;
  recordQuiz: (
    topicId: string,
    answers: { questionId: string; selectedIndex: number }[],
    scorePct: number,
  ) => Promise<{ passed: boolean }>;
  logActivity: (type: "quiz" | "lesson" | "project" | "chat", description: string) => Promise<void>;
  awardPoints: (points: number, source: string, meta?: Record<string, unknown>) => Promise<void>;
  refreshLocalData: () => Promise<void>;
  triggerSync: () => Promise<boolean>;
}

/**
 * Background synchronization hook for student progression stats using Dexie.js.
 * Ensures offline-first instant feedback, persistent local storage,
 * and automatic synchronization with Supabase as soon as network connectivity is restored.
 */
export function useStudentProgressSync(): UseStudentProgressSyncReturn {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [progressList, setProgressList] = useState<SubjectProgress[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [totalPoints, setTotalPoints] = useState<number>(0);

  const isSyncingRef = useRef<boolean>(false);
  isSyncingRef.current = isSyncing;

  // Refresh data from Dexie.js local database
  const refreshLocalData = useCallback(async () => {
    try {
      const [pList, acts, unSyncedAttempts, unSyncedPoints] = await Promise.all([
        dbGetAllSubjectProgress(),
        dbGetRecentActivities(12),
        db.attempts
          .where("synced")
          .equals(0)
          .count()
          .catch(() => 0),
        db.points
          .where("synced")
          .equals(0)
          .count()
          .catch(() => 0),
      ]);

      setProgressList(pList || []);
      setRecentActivities(acts || []);
      setPendingCount(unSyncedAttempts + unSyncedPoints);

      // Compute total local points
      const allPoints = await db.points.toArray().catch(() => []);
      const sumPts = allPoints.reduce((acc, curr) => acc + (curr.points || 0), 0);
      setTotalPoints(sumPts);
    } catch (err) {
      console.warn("[useStudentProgressSync] Error refreshing local Dexie state:", err);
    }
  }, []);

  // Synchronize Dexie offline queue with Supabase backend
  const triggerSync = useCallback(async (): Promise<boolean> => {
    if (isSyncingRef.current) return false;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOnline(false);
      return false;
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      // 1. Sync attempts and points via offline-db worker
      await syncQueue();

      // 2. Direct upload of pending task_attempts to Supabase
      const pendingAttempts: QueuedAttempt[] = await db.attempts
        .where("synced")
        .equals(0)
        .toArray()
        .catch(() => []);

      if (pendingAttempts.length > 0 && user?.id) {
        for (const item of pendingAttempts) {
          try {
            const { error: insertErr } = await supabase.from("task_attempts").insert({
              user_id: user.id,
              topic_id: item.topic_id,
              answers: item.answers,
              score_pct: item.score_pct,
              passed: item.passed,
              created_at: item.created_at,
            });

            if (!insertErr && item.id != null) {
              await db.attempts.update(item.id, { synced: 1 });
            }
          } catch (e) {
            console.warn("[useStudentProgressSync] Attempt sync error:", e);
          }
        }
      }

      // 3. Direct upload of unsynced points to user_points
      const pendingPoints = await db.points
        .where("synced")
        .equals(0)
        .toArray()
        .catch(() => []);

      if (pendingPoints.length > 0 && user?.id) {
        for (const pt of pendingPoints) {
          try {
            const { error: ptErr } = await supabase.from("user_points").insert({
              user_id: user.id,
              points: pt.points,
              source: pt.source,
              meta: (pt.meta as any) || null,
              created_at: pt.created_at,
            });

            if (!ptErr && pt.id != null) {
              await db.points.update(pt.id, { synced: 1 });
            }
          } catch (e) {
            console.warn("[useStudentProgressSync] Points sync error:", e);
          }
        }
      }

      setLastSyncedAt(new Date());
      await refreshLocalData();
      return true;
    } catch (err: any) {
      const msg = err?.message || "Sync encountered a network issue";
      setSyncError(msg);
      console.warn("[useStudentProgressSync] Two-way sync issue:", err);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [user?.id, refreshLocalData]);

  // Record subject progression locally and trigger sync if online
  const recordProgression = useCallback(
    async (subject: string, percentage: number) => {
      await dbUpdateSubjectProgress(subject, percentage);
      await dbLogRecentActivity(
        "lesson",
        `Updated mastery in ${subject} to ${Math.round(percentage)}%`,
      );
      await refreshLocalData();

      if (typeof navigator !== "undefined" && navigator.onLine) {
        void triggerSync();
      }
    },
    [refreshLocalData, triggerSync],
  );

  // Record quiz result locally
  const recordQuiz = useCallback(
    async (
      topicId: string,
      answers: { questionId: string; selectedIndex: number }[],
      scorePct: number,
    ) => {
      const activeUserId = user?.id || "offline-student";
      const result = await dbRecordQuizAttempt({
        userId: activeUserId,
        topicId,
        answers,
        scorePct,
      });

      await dbLogRecentActivity(
        "quiz",
        `Completed quiz on ${topicId} with score ${Math.round(scorePct)}% (${result.passed ? "Passed" : "Retake recommended"})`,
      );

      await refreshLocalData();

      if (typeof navigator !== "undefined" && navigator.onLine) {
        void triggerSync();
      }

      return result;
    },
    [user?.id, refreshLocalData, triggerSync],
  );

  // Log generic activity
  const logActivity = useCallback(
    async (type: "quiz" | "lesson" | "project" | "chat", description: string) => {
      await dbLogRecentActivity(type, description);
      await refreshLocalData();
    },
    [refreshLocalData],
  );

  // Award local points
  const awardPoints = useCallback(
    async (points: number, source: string, meta?: Record<string, unknown>) => {
      const activeUserId = user?.id || "offline-student";
      await db.points.add({
        user_id: activeUserId,
        points,
        source,
        meta: meta || null,
        created_at: new Date().toISOString(),
        synced: 0,
      });
      await refreshLocalData();

      if (typeof navigator !== "undefined" && navigator.onLine) {
        void triggerSync();
      }
    },
    [user?.id, refreshLocalData, triggerSync],
  );

  // Setup network status listeners and initial sync
  useEffect(() => {
    void refreshLocalData();

    const handleOnline = () => {
      setIsOnline(true);
      toast.info("Connection restored. Synchronizing student progress with cloud...");
      void triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("Network offline. Progression saved locally in Dexie.js store.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial background sync if online
    if (typeof navigator !== "undefined" && navigator.onLine) {
      void triggerSync();
    }

    // Periodic check every 60 seconds while online
    const interval = setInterval(() => {
      if (typeof navigator !== "undefined" && navigator.onLine && pendingCount > 0) {
        void triggerSync();
      }
    }, 60000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [triggerSync, refreshLocalData, pendingCount]);

  // Compute summary stats
  const stats: StudentProgressStats = {
    totalSubjects: progressList.length,
    averageProgress:
      progressList.length > 0
        ? Math.round(
            progressList.reduce((acc, curr) => acc + curr.completedPercentage, 0) /
              progressList.length,
          )
        : 0,
    completedSubjects: progressList.filter((p) => p.completedPercentage >= 100).length,
    highestSubject:
      progressList.length > 0
        ? [...progressList].sort((a, b) => b.completedPercentage - a.completedPercentage)[0]
        : null,
    lowestSubject:
      progressList.length > 0
        ? [...progressList].sort((a, b) => a.completedPercentage - b.completedPercentage)[0]
        : null,
    totalPoints,
    pendingSyncCount: pendingCount,
  };

  return {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncedAt,
    syncError,
    progressList,
    recentActivities,
    stats,
    recordProgression,
    recordQuiz,
    logActivity,
    awardPoints,
    refreshLocalData,
    triggerSync,
  };
}

export default useStudentProgressSync;
