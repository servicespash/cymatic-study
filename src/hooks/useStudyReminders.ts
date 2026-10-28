import { useState, useEffect, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { toast } from "sonner";

export interface StudyReminderConfig {
  intervalMinutes: number; // e.g. 10, 15, 30, 60
  enabled: boolean;
  soundEnabled: boolean;
  type: "breathing" | "break" | "hydration" | "all";
}

const STORAGE_KEY = "cymatic_study_reminders_config_v1";
const NOTIFICATION_ID_BASE = 2000;

export function useStudyReminders() {
  const [config, setConfig] = useState<StudyReminderConfig>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn("Could not load study reminder config:", e);
      }
    }
    return {
      intervalMinutes: 30, // Default 30-minute study break interval
      enabled: true,
      soundEnabled: true,
      type: "all",
    };
  });

  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [nextReminderTime, setNextReminderTime] = useState<Date | null>(null);

  // Request native permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (Capacitor.isNativePlatform()) {
        const { LocalNotifications } = await import("@capacitor/local-notifications");
        const status = await LocalNotifications.requestPermissions();
        const granted = status.display === "granted";
        setHasPermission(granted);
        return granted;
      } else if (typeof window !== "undefined" && "Notification" in window) {
        const perm = await Notification.requestPermission();
        const granted = perm === "granted";
        setHasPermission(granted);
        return granted;
      }
      return false;
    } catch (err) {
      console.warn("Error requesting notification permissions:", err);
      return false;
    }
  }, []);

  // Cancel any scheduled study reminder notifications
  const cancelScheduledReminders = useCallback(async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const { LocalNotifications } = await import("@capacitor/local-notifications");
        const ids = Array.from({ length: 10 }, (_, i) => ({ id: NOTIFICATION_ID_BASE + i }));
        await LocalNotifications.cancel({ notifications: ids });
      }
      setNextReminderTime(null);
    } catch (err) {
      console.warn("Error canceling study reminders:", err);
    }
  }, []);

  // Schedule dynamic study reminders based on user desired intervals
  const scheduleReminders = useCallback(
    async (intervalMin: number, enabled: boolean = true) => {
      if (!enabled || intervalMin <= 0) {
        await cancelScheduledReminders();
        return;
      }

      const granted = await requestPermission();
      if (!granted) {
        toast.error("Notification permission required to schedule study reminders.");
        return;
      }

      await cancelScheduledReminders();

      const now = Date.now();
      const intervalMs = intervalMin * 60 * 1000;
      const nextTime = new Date(now + intervalMs);
      setNextReminderTime(nextTime);

      const reminderMessages = [
        {
          title: "🧘 Time for a 2-Minute Breathing Exercise",
          body: "Inhale, hold, exhale. Step back from the screen and refresh your cognitive focus.",
        },
        {
          title: "💧 Hydration & Posture Check",
          body: "Drink some water, roll your shoulders, and rest your eyes before the next study sprint.",
        },
        {
          title: "✨ Cymatic Study Break",
          body: "Great progress on your syllabus! Take a 5-minute break to consolidate your memory.",
        },
      ];

      if (Capacitor.isNativePlatform()) {
        try {
          const { LocalNotifications } = await import("@capacitor/local-notifications");

          // Schedule upcoming cycles dynamically
          const notifications = Array.from({ length: 6 }, (_, i) => {
            const scheduledAt = new Date(now + intervalMs * (i + 1));
            const msg = reminderMessages[i % reminderMessages.length];
            return {
              id: NOTIFICATION_ID_BASE + i,
              title: msg.title,
              body: msg.body,
              schedule: { at: scheduledAt },
              sound: config.soundEnabled ? "default" : undefined,
              actionTypeId: "STUDY_BREAK_ACTION",
              extra: { intervalMinutes: intervalMin, cycle: i + 1 },
            };
          });

          await LocalNotifications.schedule({ notifications });
          toast.success(`Study break reminders scheduled every ${intervalMin} minutes.`);
        } catch (err) {
          console.warn("Failed scheduling native study notifications:", err);
        }
      } else {
        toast.info(`Active study timer set for ${intervalMin} minutes.`);
      }
    },
    [cancelScheduledReminders, config.soundEnabled, requestPermission],
  );

  // Update configuration and persist
  const updateConfig = useCallback(
    (newConfig: Partial<StudyReminderConfig>) => {
      setConfig((prev) => {
        const merged = { ...prev, ...newConfig };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        } catch (e) {
          console.warn("Could not save study reminder config:", e);
        }
        scheduleReminders(merged.intervalMinutes, merged.enabled);
        return merged;
      });
    },
    [scheduleReminders],
  );

  // Initial schedule check on mount
  useEffect(() => {
    if (config.enabled) {
      scheduleReminders(config.intervalMinutes, true);
    }
  }, [config.enabled, config.intervalMinutes, scheduleReminders]);

  return {
    config,
    updateConfig,
    hasPermission,
    requestPermission,
    nextReminderTime,
    cancelScheduledReminders,
  };
}
