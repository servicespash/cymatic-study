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

/**
 * useStudyProgress Custom Hook
 * Fetches user learning progress from the Supabase "curriculum_progress" table.
 * Implements persistent caching using localStorage for immediate offline loading,
 * with background synchronization, optimistic updates, and offline/guest fallbacks.
 */
export function useStudyProgress() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<StudyProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const cacheKey = user ? `study_progress_${user.id}` : "study_progress_guest";

  // Helper to load cache synchronously
  const loadCache = useCallback(() => {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as StudyProgress[];
        setProgress(parsed);
        return true;
      } catch (e) {
        console.error("Failed to parse cached study progress:", e);
      }
    }
    return false;
  }, [cacheKey]);

  const fetchProgress = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        // Fallback for guest mode: load from cache and exit
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
        const mappedData: StudyProgress[] = (data as DBStudyProgress[]).map((item) => ({
          id: item.id,
          user_id: item.user_id || user.id,
          subject: item.subject || "",
          completed_percentage: Number(item.completed_percentage ?? item.completedPercentage ?? 0),
          last_studied_at: item.last_studied_at ?? item.lastInteracted ?? item.updated_at,
          updated_at: item.updated_at,
        }));

        setProgress(mappedData);
        // Cache the latest synced progress
        localStorage.setItem(cacheKey, JSON.stringify(mappedData));
      }
    } catch (err: unknown) {
      console.error("Error fetching study progress from Supabase:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      // Fall back to local cache if offline or on error
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
          user_id: user?.id || "guest",
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
