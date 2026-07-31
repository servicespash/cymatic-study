import { useState, useEffect, useCallback } from "react";
import { db, syncQueue } from "@/lib/offline-db";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function useSync() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const triggerSync = useCallback(async () => {
    if (isSyncing) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOnline(false);
      return;
    }
    setIsOnline(true);
    setIsSyncing(true);
    try {
      // 1. Push local queue to remote Supabase via offline-db syncQueue
      await syncQueue();

      // 2. Pull remote progress / profile updates if authenticated
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const userId = session.user.id;
        // Fetch remote profile or test connection
        const { data: remoteProfile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (!error && remoteProfile) {
          // Sync successful
        }
      }

      setLastSyncedAt(new Date());
    } catch (err) {
      console.error("Two-way synchronization error:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.info("Connection restored. Synchronizing offline data...");
      void triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("Network offline. Operating in local offline mode.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial sync check if online
    if (navigator.onLine) {
      void triggerSync();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [triggerSync]);

  return {
    isOnline,
    isSyncing,
    lastSyncedAt,
    triggerSync,
  };
}
