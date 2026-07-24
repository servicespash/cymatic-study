import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

export interface StudyProgress {
  id?: string;
  user_id: string;
  subject: string;
  completed_percentage: number;
  last_studied_at?: string;
  updated_at?: string;
}

interface DBStudyProgress {
  id?: string;
  user_id?: string;
  subject?: string;
  completed_percentage?: number;
  completedPercentage?: number;
  last_studied_at?: string;
  lastInteracted?: string;
  updated_at?: string;
}

export const DEFAULT_CURRICULUM_SUBJECTS = [
  "Math",
  "Physics",
  "Chemistry",
  "Biology",
  "Geography",
  "History",
  "English",
  "Entrepreneurship",
  "Economics",
  "ICT",
  "Divinity",
  "Swahili",
  "Luganda",
  "Literature",
  "Agriculture",
  "Art",
  "CRE",
  "IRE",
  "Commerce",
  "SubMath",
  "GP",
];

export function getDefaultSubjectProgress(userId = "guest"): StudyProgress[] {
  const now = new Date().toISOString();
  return DEFAULT_CURRICULUM_SUBJECTS.map((sub) => ({
    user_id: userId,
    subject: sub,
    completed_percentage: 0,
    last_studied_at: now,
    updated_at: now,
  }));
}

/**
 * useStudyProgress Custom Hook
 * Fetches user learning progress from the Supabase "curriculum_progress" table.
 * Implements persistent caching using localStorage for immediate offline loading,
 * with background synchronization, optimistic updates, and offline/guest fallbacks.
 */
export function useStudyProgress() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<StudyProgress[]>(() =>
    getDefaultSubjectProgress(user?.id || "guest"),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const cacheKey = user ? `study_progress_${user.id}` : "study_progress_anonymous";

  // Helper to load cache synchronously
  const loadCache = useCallback(() => {
    const cached = localStorage.getItem(cacheKey);
    const now = new Date().toISOString();
    const effectiveUserId = user?.id || "guest";

    if (cached) {
      try {
        const parsed = JSON.parse(cached) as StudyProgress[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingMap = new Map(
            parsed.map((p) => [p.subject.toLowerCase(), p.completed_percentage]),
          );

          const merged: StudyProgress[] = DEFAULT_CURRICULUM_SUBJECTS.map((sub) => {
            const foundPct = existingMap.get(sub.toLowerCase());
            return {
              user_id: effectiveUserId,
              subject: sub,
              completed_percentage: foundPct !== undefined ? Number(foundPct) : 0,
              last_studied_at: now,
              updated_at: now,
            };
          });

          setProgress(merged);
          return true;
        }
      } catch (e) {
        console.error("Failed to parse cached study progress:", e);
      }
    }

    // Default fallback: populate all subject progress maps with default zero-value metrics immediately
    const defaultProgress = getDefaultSubjectProgress(effectiveUserId);
    setProgress(defaultProgress);
    return false;
  }, [cacheKey, user?.id]);

  const fetchProgress = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        loadCache();
        setLoading(false);
        return;
      }

      // Query learning progress from Supabase
      const { data, error: supabaseError } = await supabase
        .from("curriculum_progress")
        .select("*")
        .eq("user_id", user.id);

      if (supabaseError) {
        throw supabaseError;
      }

      if (data) {
        const fetchedMap = new Map(
          (data as DBStudyProgress[]).map((item) => [
            (item.subject || "").toLowerCase(),
            Number(item.completed_percentage ?? item.completedPercentage ?? 0),
          ]),
        );

        const now = new Date().toISOString();
        const mappedData: StudyProgress[] = DEFAULT_CURRICULUM_SUBJECTS.map((sub) => {
          const val = fetchedMap.get(sub.toLowerCase());
          return {
            user_id: user.id,
            subject: sub,
            completed_percentage: val !== undefined ? val : 0,
            last_studied_at: now,
            updated_at: now,
          };
        });

        setProgress(mappedData);
        localStorage.setItem(cacheKey, JSON.stringify(mappedData));
      }
    } catch (err: unknown) {
      console.error("Error fetching study progress from Supabase:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      // Fall back to local cache or defaults if offline or on error
      loadCache();
    } finally {
      setLoading(false);
    }
  }, [user, cacheKey, loadCache]);

  // Load cache immediately, then fetch fresh data
  useEffect(() => {
    loadCache();
    fetchProgress();
  }, [fetchProgress, loadCache]);

  const updateProgress = useCallback(
    async (subject: string, completedPercentage: number) => {
      const clampedPercentage = Math.min(100, Math.max(0, Math.round(completedPercentage)));
      const now = new Date().toISOString();

      // Optimistic UI: update local state and local cache immediately
      setProgress((prev) => {
        const existingIndex = prev.findIndex(
          (p) => p.subject.toLowerCase() === subject.toLowerCase(),
        );
        const updated = [...prev];
        const newItem: StudyProgress = {
          user_id: user?.id || "anonymous",
          subject,
          completed_percentage: clampedPercentage,
          last_studied_at: now,
          updated_at: now,
        };

        if (existingIndex > -1) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            completed_percentage: clampedPercentage,
            last_studied_at: now,
            updated_at: now,
          };
        } else {
          updated.push(newItem);
        }

        localStorage.setItem(cacheKey, JSON.stringify(updated));
        return updated;
      });

      if (!user) {
        return;
      }

      try {
        const existingItem = progress.find(
          (p) => p.subject.toLowerCase() === subject.toLowerCase(),
        );

        const payload: DBStudyProgress = {
          user_id: user.id,
          subject,
          completed_percentage: clampedPercentage,
          updated_at: now,
        };

        if (existingItem?.id) {
          payload.id = existingItem.id;
        }

        const { error: supabaseError } = await supabase
          .from("curriculum_progress")
          .upsert(payload, { onConflict: "user_id,subject" });

        if (supabaseError) {
          throw supabaseError;
        }

        // Re-fetch to ensure perfect alignment with server timestamps/ids
        await fetchProgress();
      } catch (err: unknown) {
        console.error("Error updating study progress in Supabase:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [user, progress, cacheKey, fetchProgress],
  );

  return {
    progress,
    loading,
    error,
    refreshProgress: fetchProgress,
    updateProgress,
  };
}
