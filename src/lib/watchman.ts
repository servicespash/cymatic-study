import { supabase } from "@/integrations/supabase/client";
import { Preferences as Storage } from "@capacitor/preferences";

// --- Phase 5: Daily Uptime Tracker ---
const UPTIME_LIMIT_MINUTES = 30;
const TRIAL_DAYS_LIMIT = 7;

export interface WatchmanState {
  isTrialExpired: boolean;
  isQuotaExceeded: boolean;
  usedMinutes: number;
  remainingMinutes: number;
  isVerified: boolean;
  totalUptimeMinutes: number;
}

export const checkWatchman = async (userId?: string): Promise<WatchmanState> => {
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  // 1. Install/Trial Date Logic
  let { value: installDateStr } = await Storage.get({ key: "cymatic_install_date" });
  if (!installDateStr) {
    installDateStr = now.toISOString();
    await Storage.set({ key: "cymatic_install_date", value: installDateStr });
  }
  const installDate = new Date(installDateStr);
  const diffDays = Math.floor((now.getTime() - installDate.getTime()) / (1000 * 60 * 60 * 24));

  // 2. Daily Uptime Tracking
  const uptimeKey = `uptime_minutes_${today}`;
  const { value: uptimeStr } = await Storage.get({ key: uptimeKey });
  const totalUptimeMinutes = parseInt(uptimeStr || "0", 10);

  // 3. AI Usage Tracking (Legacy, but kept for compatibility)
  const aiUsageKey = `ai_usage_${today}`;
  const { value: aiUsedStr } = await Storage.get({ key: aiUsageKey });
  const aiUsedMinutes = parseInt(aiUsedStr || "0", 10);

  // 4. Verification Status from DB
  let isVerified = false;
  if (userId) {
    try {
      const { data } = await supabase
        .from("profiles" as any)
        .select("is_verified" as any)
        .eq("id", userId)
        .single();
      isVerified = !!(data as any)?.is_verified;
    } catch (e) {
      console.warn("Watchman: Verification check failed", e);
    }
  }

  const isTrialExpired = diffDays >= TRIAL_DAYS_LIMIT && !isVerified;
  const isQuotaExceeded = totalUptimeMinutes >= UPTIME_LIMIT_MINUTES && !isVerified;

  return {
    isTrialExpired,
    isQuotaExceeded,
    usedMinutes: aiUsedMinutes,
    remainingMinutes: Math.max(0, UPTIME_LIMIT_MINUTES - totalUptimeMinutes),
    isVerified,
    totalUptimeMinutes,
  };
};

export const incrementUptime = async () => {
  const today = new Date().toISOString().split("T")[0];
  const uptimeKey = `uptime_minutes_${today}`;
  const { value: current } = await Storage.get({ key: uptimeKey });
  const newValue = parseInt(current || "0", 10) + 1;
  await Storage.set({ key: uptimeKey, value: String(newValue) });
  return newValue;
};

export const recordAIUsage = async (minutes: number = 1) => {
  const today = new Date().toISOString().split("T")[0];
  const usageKey = `ai_usage_${today}`;
  const { value: current } = await Storage.get({ key: usageKey });
  const newValue = parseInt(current || "0", 10) + minutes;
  await Storage.set({ key: usageKey, value: String(newValue) });
};

// --- Legacy Export (Keep to avoid breaking changes) ---
export const WATCHMAN_LIMITS = {
  DAILY_AI_MINUTES: UPTIME_LIMIT_MINUTES,
  TRIAL_DAYS: TRIAL_DAYS_LIMIT,
};
