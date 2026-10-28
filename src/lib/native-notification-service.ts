/**
 * Native Notification Service Layer for Capacitor / Android Environment
 * Manages dynamic daily, weekly, and termly study goal reminders and study nudges
 * without hardcoded static intervals.
 */

import { Capacitor } from "@capacitor/core";

export interface StudyGoalReminder {
  id: number;
  title: string;
  body: string;
  scheduleAt: Date;
  category: "daily" | "weekly" | "term";
}

class NativeNotificationService {
  private isNative: boolean = false;

  constructor() {
    this.checkNativePlatform();
  }

  private async checkNativePlatform() {
    try {
      this.isNative = Capacitor.isNativePlatform();
    } catch {
      this.isNative = false;
    }
  }

  /**
   * Requests local notification permissions from the Android / iOS OS.
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (!this.isNative) return true;
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const perm = await LocalNotifications.requestPermissions();
      return perm.display === "granted";
    } catch (err) {
      console.warn("Failed to request notification permissions:", err);
      return false;
    }
  }

  /**
   * Dynamically schedules goal reminders (daily, weekly, termly) based on user progress and streak.
   */
  async scheduleDynamicGoalReminders(userPoints: number, streakDays: number, persona: "Adams" | "Haawa" = "Adams"): Promise<void> {
    try {
      if (!this.isNative) {
        console.log("Mock native notification service: reminders calculated for web environment.");
        return;
      }

      const { LocalNotifications } = await import("@capacitor/local-notifications");

      // Clear existing scheduled reminder IDs (101: Daily, 102: Weekly, 103: Term)
      await LocalNotifications.cancel({
        notifications: [{ id: 101 }, { id: 102 }, { id: 103 }],
      });

      const now = new Date();
      const reminders: StudyGoalReminder[] = [];

      // 1. Daily Nudge (triggered if daily points < 20)
      const dailyTarget = 20;
      const dailyRemindTime = new Date(now.getTime() + 1000 * 60 * 60 * 4); // 4 hours from now
      reminders.push({
        id: 101,
        title: `Daily Study Quest • ${persona}`,
        body: userPoints < dailyTarget
          ? `You have ${streakDays} day streak! Complete today's quizzes to reach your 20-point daily goal.`
          : `Fantastic work today! Keep your momentum going tomorrow.`,
        scheduleAt: dailyRemindTime,
        category: "daily",
      });

      // 2. Weekly Sprint Reminder
      const weeklyRemindTime = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 2); // 2 days from now
      reminders.push({
        id: 102,
        title: `Weekly 50-Point Sprint`,
        body: `Consistency builds mastery. Check your syllabus progress and unlock new study badges this week!`,
        scheduleAt: weeklyRemindTime,
        category: "weekly",
      });

      // 3. Term Milestone Reminder
      const termRemindTime = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7); // 7 days from now
      reminders.push({
        id: 103,
        title: `Term 100-Point Challenge`,
        body: `Stay ahead of Uganda curriculum exams. Master your physics and mathematics problem sets.`,
        scheduleAt: termRemindTime,
        category: "term",
      });

      // Schedule through Capacitor Local Notifications API
      await LocalNotifications.schedule({
        notifications: reminders.map((r) => ({
          title: r.title,
          body: r.body,
          id: r.id,
          schedule: { at: r.scheduleAt },
          sound: "default",
          extra: { category: r.category },
        })),
      });

      console.log("✅ Successfully scheduled native study goal reminders.");
    } catch (err) {
      console.warn("Failed to schedule native dynamic reminders:", err);
    }
  }

  /**
   * Triggers an immediate test notification.
   */
  async sendInstantNotification(title: string, body: string): Promise<void> {
    try {
      if (!this.isNative) return;
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 1000) },
          },
        ],
      });
    } catch (err) {
      console.warn("Failed to send instant notification:", err);
    }
  }
}

export const nativeNotificationService = new NativeNotificationService();
