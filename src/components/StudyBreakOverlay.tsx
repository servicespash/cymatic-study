import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, Sparkles, Timer, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useStudyReminders } from "@/hooks/useStudyReminders";
import { BreathingGuide } from "./BreathingGuide";

const INTERVAL_OPTIONS = [10, 15, 30, 45, 60];

export function StudyBreakOverlay() {
  const { config, updateConfig, nextReminderTime } = useStudyReminders();
  const [isOpen, setIsOpen] = useState(false);

  // Interval trigger timer based on user chosen interval
  useEffect(() => {
    if (!config.enabled || config.intervalMinutes <= 0) return;

    const ms = config.intervalMinutes * 60 * 1000;
    const timer = setInterval(() => {
      setIsOpen(true);
    }, ms);

    return () => clearInterval(timer);
  }, [config.enabled, config.intervalMinutes]);

  const handleSessionComplete = () => {
    toast.success("✨ Study break & hydration completed! Mind refreshed for your syllabus.");
  };

  return (
    <>
      {/* Floating wellness pill button on bottom right */}
      {!isOpen && (
        <aside
          aria-label="Wellness and Study Break Control"
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 group"
        >
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-card/95 hover:bg-card border border-primary/40 shadow-xl hover:shadow-primary/20 hover:scale-[1.02] transition-all backdrop-blur-xl text-foreground text-xs font-bold"
            title={`Next study break at: ${nextReminderTime ? nextReminderTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Scheduled"}`}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
            </span>
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span>4-7-8 Breathing &amp; Hydration</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-mono">
              {config.intervalMinutes}m
            </span>
          </button>
        </aside>
      )}

      {/* Fullscreen Interactive Wellness Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-2xl rounded-3xl border border-border/90 bg-card p-4 sm:p-6 shadow-2xl space-y-4 my-auto overflow-hidden"
            >
              {/* Top Bar with interval configuration and close */}
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2 text-left">
                  <div className="p-2 rounded-xl bg-primary/15 text-primary border border-primary/20">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-foreground tracking-tight">
                      Mindful Cognitive Refresh
                    </h3>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      Uganda Secondary Curriculum Wellness Engine
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Close session"
                  aria-label="Close study break overlay"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Interval frequency picker chips */}
              <div className="flex items-center justify-between gap-2 flex-wrap bg-muted/40 p-2.5 rounded-2xl border border-border/50 text-xs">
                <span className="font-bold text-muted-foreground flex items-center gap-1.5 text-[11px]">
                  <Timer className="w-3.5 h-3.5 text-primary" /> Auto-Trigger Frequency:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {INTERVAL_OPTIONS.map((mins) => (
                    <button
                      key={mins}
                      onClick={() => updateConfig({ intervalMinutes: mins })}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                        config.intervalMinutes === mins
                          ? "bg-primary text-primary-foreground shadow-sm scale-105"
                          : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60"
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Embedded Breathing Guide with 4-7-8 and 15s Water Sipper */}
              <BreathingGuide
                autoStart={true}
                onComplete={handleSessionComplete}
                className="border-0 bg-transparent p-0 shadow-none"
              />

              {/* Dismiss / Resume CTA */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    toast.success("Ready to conquer the syllabus! Keep up the momentum.");
                  }}
                  className="w-full py-3.5 rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-border"
                >
                  <span>Back To Study Dashboard</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default StudyBreakOverlay;
