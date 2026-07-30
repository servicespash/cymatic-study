// Offline-first queue using Dexie. Syncs to Supabase when online.
import Dexie, { type Table } from "dexie";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type QueuedAttempt = {
  id?: number;
  user_id: string;
  topic_id: string;
  answers: { questionId: string; selectedIndex: number }[];
  score_pct: number;
  passed: boolean;
  created_at: string;
  synced: number; // 0 | 1
};

export type QueuedPoints = {
  id?: number;
  user_id: string;
  points: number;
  source: string;
  meta?: Record<string, unknown> | null;
  created_at: string;
  synced: number;
};

export type QueuedNotification = {
  id?: number;
  body: string;
  created_at: string;
  read: number;
};

export type SubjectProgress = {
  subject: string; // "Math" | "Physics" | "Chemistry" | "Biology"
  completedPercentage: number;
  lastInteracted: string;
};

export type RecentActivity = {
  id?: number;
  type: string; // "quiz" | "lesson" | "project" | "chat"
  description: string;
  timestamp: string;
};

class CymaticDB extends Dexie {
  attempts!: Table<QueuedAttempt, number>;
  points!: Table<QueuedPoints, number>;
  notifications!: Table<QueuedNotification, number>;
  quizQuestions!: Table<unknown, string>;
  userProgress!: Table<SubjectProgress, string>;
  recentActivity!: Table<RecentActivity, number>;
  constructor() {
    super("cymatic-hub");
    this.version(3).stores({
      attempts: "++id, user_id, topic_id, synced, created_at",
      points: "++id, user_id, synced, created_at",
      notifications: "++id, read, created_at",
      quizQuestions: "id, topicId",
      userProgress: "subject, completedPercentage, lastInteracted",
      recentActivity: "++id, type, timestamp",
    });
  }
}

export const db = new CymaticDB();

export const PASS_THRESHOLD = 70;

export async function recordQuizAttempt(opts: {
  userId: string;
  topicId: string;
  answers: { questionId: string; selectedIndex: number }[];
  scorePct: number; // Still passed for local UI feedback
}) {
  const passed = opts.scorePct >= PASS_THRESHOLD;
  const now = new Date().toISOString();
  await db.attempts.add({
    user_id: opts.userId,
    topic_id: opts.topicId,
    answers: opts.answers,
    score_pct: opts.scorePct,
    passed,
    created_at: now,
    synced: 0,
  });

  // Local points are just for UI; server will re-calculate and award real points
  if (passed) {
    const pts = 10 + Math.max(0, Math.floor((opts.scorePct - PASS_THRESHOLD) / 5));
    await db.points.add({
      user_id: opts.userId,
      points: pts,
      source: "quiz",
      meta: { topic_id: opts.topicId, score_pct: opts.scorePct },
      created_at: now,
      synced: 0,
    });
  }
  void syncQueue();
  return { passed };
}

export async function pushNotification(body: string) {
  await db.notifications.add({
    body,
    created_at: new Date().toISOString(),
    read: 0,
  });
}

export async function unreadCount() {
  return db.notifications.where("read").equals(0).count();
}

let syncing = false;
export async function syncQueue() {
  if (syncing) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  syncing = true;
  try {
    const pendingA = await db.attempts.where("synced").equals(0).toArray();
    for (const a of pendingA) {
      // Server re-calculates score based on answers and awards points.
      // This RPC now handles the logic server-side for security.
      const { error } = await (
        supabase as unknown as {
          rpc: (name: string, args: Record<string, unknown>) => Promise<{ error: Error | null }>;
        }
      ).rpc("submit_quiz_attempt", {
        _topic_id: a.topic_id,
        _answers: a.answers,
      });
      if (!error && a.id != null) {
        await db.attempts.update(a.id, { synced: 1 });
      }
    }
    if (pendingA.length > 0) {
      toast.success("Progress synced successfully!");
    }
    // Points are awarded server-side by the trigger on task_attempts.
    // We mark local point rows synced so they don't get double-counted if we ever
    // implemented a direct point sync (which we are moving away from).
    const pendingP = await db.points.where("synced").equals(0).toArray();
    for (const p of pendingP) {
      if (p.id != null) await db.points.update(p.id, { synced: 1 });
    }
  } catch (e) {
    console.warn("sync failed", e);
  } finally {
    syncing = false;
  }
}

export async function logRecentActivity(
  type: "quiz" | "lesson" | "project" | "chat",
  description: string,
) {
  const timestamp = new Date().toISOString();
  await db.recentActivity.add({ type, description, timestamp });
}

export async function updateSubjectProgress(subject: string, percentage: number) {
  const lastInteracted = new Date().toISOString();
  const clamped = Math.min(100, Math.max(0, Math.round(percentage)));
  await db.userProgress.put({
    subject,
    completedPercentage: clamped,
    lastInteracted,
  });
}

export async function getSubjectProgress(subject: string): Promise<number> {
  const record = await db.userProgress.get(subject);
  return record ? record.completedPercentage : 15; // default 15% initial progress
}

export async function getAllSubjectProgress(): Promise<SubjectProgress[]> {
  const records = await db.userProgress.toArray();
  const subjects = [
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
  const finalProgress: SubjectProgress[] = [];

  for (const sub of subjects) {
    const existing = records.find((r) => r.subject === sub);
    if (existing) {
      finalProgress.push(existing);
    } else {
      const defaultRecord = {
        subject: sub,
        completedPercentage: 0, // Initialize at zero as requested
        lastInteracted: new Date().toISOString(),
      };
      await db.userProgress.put(defaultRecord);
      finalProgress.push(defaultRecord);
    }
  }
  return finalProgress;
}

export async function getRecentActivities(limit = 10): Promise<RecentActivity[]> {
  const list = await db.recentActivity.orderBy("timestamp").reverse().limit(limit).toArray();
  return list;
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => void syncQueue());
}
