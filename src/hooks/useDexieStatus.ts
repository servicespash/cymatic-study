import { useState, useEffect, useCallback } from "react";
import { db as offlineDb, syncQueue } from "@/lib/offline-db";
import { db as appDb } from "@/lib/db";

export interface DexieStatus {
  isOnline: boolean;
  isDatabaseReady: boolean;
  isSyncing: boolean;
  pendingSyncCount: number;
  cachedRecordsCount: number;
  lastSyncTime: Date | null;
  triggerManualSync: () => Promise<void>;
}

export function useDexieStatus(): DexieStatus {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [isDatabaseReady, setIsDatabaseReady] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [cachedRecordsCount, setCachedRecordsCount] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(() => new Date());

  const checkDatabaseStatus = useCallback(async () => {
    try {
      if (!offlineDb.isOpen()) {
        await offlineDb.open();
      }
      if (!appDb.isOpen()) {
        await appDb.open();
      }
      setIsDatabaseReady(true);

      // Count unsynced items in offline queue
      const unsyncedAttempts = await offlineDb.attempts.where("synced").equals(0).count();
      const unsyncedPoints = await offlineDb.points.where("synced").equals(0).count();
      setPendingSyncCount(unsyncedAttempts + unsyncedPoints);

      // Count cached offline entities
      const attemptsCount = await offlineDb.attempts.count();
      const progressCount = await offlineDb.userProgress.count();
      const newsCount = await appDb.news_broadcasts.count();
      const sessionsCount = await appDb.chatSessions.count();
      setCachedRecordsCount(attemptsCount + progressCount + newsCount + sessionsCount);
    } catch (err) {
      console.warn("[DexieStatus] Check failed:", err);
      setIsDatabaseReady(false);
    }
  }, []);

  const triggerManualSync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);
    try {
      await syncQueue();
      setLastSyncTime(new Date());
      await checkDatabaseStatus();
    } catch (err) {
      console.error("[DexieStatus] Manual sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, checkDatabaseStatus]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      void triggerManualSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    void checkDatabaseStatus();
    const interval = setInterval(() => {
      void checkDatabaseStatus();
    }, 15000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [checkDatabaseStatus, triggerManualSync]);

  return {
    isOnline,
    isDatabaseReady,
    isSyncing,
    pendingSyncCount,
    cachedRecordsCount,
    lastSyncTime,
    triggerManualSync,
  };
}
