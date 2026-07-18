import { useEffect, useState } from "react";
import { useSubjectProgress } from "@/hooks/useSubjectProgress";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Sparkles,
  Clock,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/offline-db";

const COCH_TIPS = [
  "Spacing out your study blocks is mathematically proven to double long-term memory retention.",
  "Your brain consolidates memory when you sleep, but active recall within 48 hours solidifies it.",
  "Just 5 minutes of practicing a weak subject today halts the forgetting curve completely.",
  "Adams says: 'Peep the syllabus, fam! Skipping subjects ruins the streak. Let's do 5 questions now.'",
  "Hawa says: 'A garden needs gentle, daily care. Let us touch this subject once more before night falls.'",
];

export function SubjectPracticeReminder() {
  const { progress, refreshProgress } = useSubjectProgress();
  const navigate = useNavigate();
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");
  const [coachTip, setCoachTip] = useState(COCH_TIPS[0]);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
    // Set a random coaching tip
    setCoachTip(COCH_TIPS[Math.floor(Math.random() * COCH_TIPS.length)]);
  }, []);

  // Filter subjects idle for over 48 hours
  const idleSubjects = progress.filter((p) => {
    const elapsedMs = Date.now() - new Date(p.lastInteracted).getTime();
    return elapsedMs > 48 * 60 * 60 * 1000;
  });

  // Request browser push notification permission
  const handleRequestPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.info("Your browser does not support native push notifications.");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === "granted") {
        toast.success("🔔 Local alerts enabled! We'll notify you on your desktop/phone.");
        // Fire a test notification
        new Notification("Cymatic Study Alerts", {
          body: "Smart notifications activated. We'll remind you here when a subject goes cold!",
          icon: "/favicon.ico",
        });
      } else {
        toast.warning("Notification permission denied.");
      }
    } catch {
      console.warn("Notification request permission rejected or failed.");
    }
  };

  // Automatically trigger native browser notification once per session when neglected subjects are detected
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      notificationPermission !== "granted"
    )
      return;
    if (idleSubjects.length === 0) return;

    const notifiedKey = `notified_subjects_${new Date().toDateString()}`;
    if (sessionStorage.getItem(notifiedKey)) return;

    const names = idleSubjects.map((i) => i.subject).join(", ");
    try {
      new Notification("Study Streak Reminder", {
        body: `You haven't practiced ${names} in over 48 hours. Keep your memory sharp with a quick quiz!`,
        icon: "/favicon.ico",
      });
      sessionStorage.setItem(notifiedKey, "true");
    } catch {
      console.warn("Failed to trigger native notification.");
    }
  }, [idleSubjects, notificationPermission]);

  // Quick action: navigate to quiz page
  const handleRevisit = (sub: string) => {
    toast.info(`Launching quick practice for ${sub}...`);
    navigate({
      to: "/quizzes",
      search: { subject: sub.toLowerCase() },
    });
  };

  // Helper to format remaining hours or elapsed days beautifully
  const formatLastPracticed = (lastInteracted: string) => {
    const elapsedMs = Date.now() - new Date(lastInteracted).getTime();
    const elapsedHours = Math.floor(elapsedMs / (1000 * 60 * 60));
    if (elapsedHours < 24) {
      return `${elapsedHours} hours ago`;
    }
    const elapsedDays = (elapsedHours / 24).toFixed(1);
    return `${elapsedDays} days ago`;
  };

  // Dev simulation tool: manually set Chemistry & Biology lastInteracted to 3 days ago, and others to now
  const handleSimulateInactivity = async () => {
    try {
      const now = Date.now();
      const updates = [
        { subject: "Chemistry", days: 2.5, pct: 20 },
        { subject: "Biology", days: 3.5, pct: 35 },
        { subject: "Math", days: 0.1, pct: 50 },
        { subject: "Physics", days: 0.2, pct: 40 },
      ];

      for (const item of updates) {
        const time = new Date(now - item.days * 24 * 60 * 60 * 1000).toISOString();
        await db.userProgress.put({
          subject: item.subject,
          completedPercentage: item.pct,
          lastInteracted: time,
        });
      }

      toast.success("🧪 Simulation applied! Chemistry and Biology set to >48h inactive.");
      setIsDismissed(false);
      refreshProgress();
    } catch (err) {
      console.error(err);
      toast.error("Failed to run simulation.");
    }
  };

  if (idleSubjects.length === 0 || isDismissed) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-gradient-to-br from-amber-500/10 via-zinc-900 to-zinc-950 border border-amber-500/30 rounded-2xl p-5 relative overflow-hidden shadow-xl"
    >
      {/* Background glow element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col md:flex-row gap-5 items-start relative z-10">
        {/* Alert Icon & Push Enable */}
        <div className="flex flex-row md:flex-col items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 shadow-glow-sm shadow-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="h-6 w-6 animate-pulse" />
          </div>

          {notificationPermission !== "granted" && (
            <button
              onClick={handleRequestPermission}
              title="Enable native desktop alerts"
              className="text-[10px] text-zinc-400 font-bold hover:text-amber-400 transition-all flex items-center gap-1 bg-zinc-950/80 px-2 py-1 rounded-md border border-zinc-800"
            >
              <Bell className="h-3 w-3" /> Alerts
            </button>
          )}
        </div>

        {/* Content body */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
              <Clock className="h-4 w-4" /> Revisit Reminder (Over 48 Hours Inactive)
            </h4>
            <div className="flex items-center gap-2">
              {/* Simulator button */}
              <button
                onClick={handleSimulateInactivity}
                title="Reset simulation of >48h gaps"
                className="text-[10px] text-zinc-500 hover:text-zinc-300 font-semibold flex items-center gap-1 bg-zinc-950 px-2 py-1 rounded border border-zinc-900 transition-all"
              >
                <RefreshCw className="h-3 w-3" /> Test Gap
              </button>
              <button
                onClick={() => setIsDismissed(true)}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 font-bold"
              >
                Snooze
              </button>
            </div>
          </div>

          <h3 className="text-lg font-black tracking-tight text-white leading-tight">
            Keep your knowledge fresh! You haven't practiced these subjects lately:
          </h3>

          {/* List of idle subjects */}
          <div className="flex flex-wrap gap-2 pt-1">
            {idleSubjects.map((sub) => (
              <div
                key={sub.subject}
                onClick={() => handleRevisit(sub.subject)}
                className="group flex items-center gap-3 bg-zinc-950/90 hover:bg-zinc-900 px-4 py-2.5 rounded-xl border border-zinc-800 hover:border-amber-500/40 cursor-pointer transition-all duration-200"
              >
                <div className="text-left">
                  <span className="text-xs font-black text-zinc-200 block">{sub.subject}</span>
                  <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5 text-amber-500" /> Idle for{" "}
                    {formatLastPracticed(sub.lastInteracted)}
                  </span>
                </div>
                <div className="h-6 w-6 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            ))}
          </div>

          {/* Cognitive Tip */}
          <div className="flex items-start gap-2 bg-zinc-950/40 p-3 rounded-xl border border-zinc-900/60 text-zinc-400 text-xs leading-relaxed italic">
            <Sparkles className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              <strong className="text-amber-500/90 not-italic font-bold uppercase text-[9px] tracking-wider block mb-0.5">
                Cymatic Socratic Tip:
              </strong>
              {coachTip}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
