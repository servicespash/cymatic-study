import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Timer, Check, Bell, Sparkles, X } from "lucide-react";
import { useStudyReminders } from "@/hooks/useStudyReminders";
import { toast } from "sonner";

const STORAGE_ONBOARDING_KEY = "cymatic_wellness_onboarding_accepted_v1";

const INTERVALS = [
  { mins: 15, label: "15 min", desc: "Short intensive study bursts" },
  { mins: 30, label: "30 min", desc: "Recommended balanced cadence" },
  { mins: 45, label: "45 min", desc: "Deep work & focused revision" },
  { mins: 60, label: "60 min", desc: "Extended lecture or project mode" },
];

export function WellnessOnboardingModal() {
  const { config, updateConfig, requestPermission } = useStudyReminders();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMins, setSelectedMins] = useState(30);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const accepted = localStorage.getItem(STORAGE_ONBOARDING_KEY);
      if (!accepted) {
        // Delay slightly for smooth page entrance
        const timer = setTimeout(() => setIsOpen(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      // localStorage error fallback
    }
  }, []);

  const handleAccept = async (minutes: number) => {
    try {
      localStorage.setItem(STORAGE_ONBOARDING_KEY, "true");
    } catch (e) {}

    updateConfig({ intervalMinutes: minutes, enabled: true });
    await requestPermission();
    setIsOpen(false);
    toast.success(`🧘 Study wellness active! Rest reminders set every ${minutes} minutes.`);
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_ONBOARDING_KEY, "true");
    } catch (e) {}
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-2xl text-left space-y-6 overflow-hidden"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-12 -right-12 w-44 h-44 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            aria-label="Dismiss wellness setup"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-primary/15 text-primary border border-primary/25 shadow-sm">
              <Heart className="w-6 h-6 text-rose-400 animate-pulse" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="w-3 h-3" />
                Cognitive Health &amp; Retention
              </span>
              <h3 className="text-xl font-black text-foreground tracking-tight mt-1">
                Automate Your Study Breaks?
              </h3>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Long study sessions without cognitive pauses reduce information retention by up to 40%.
            We’ve set a default <strong>30-minute</strong> interval with a gentle 4-7-8 breathing
            avatar guide and 15-second hydration reminder.
          </p>

          {/* Interval Selection Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            {INTERVALS.map((item) => {
              const isSelected = selectedMins === item.mins;
              return (
                <button
                  key={item.mins}
                  onClick={() => setSelectedMins(item.mins)}
                  className={`p-3 rounded-2xl border text-left transition-all relative ${
                    isSelected
                      ? "border-primary bg-primary/10 text-foreground shadow-sm"
                      : "border-border/70 bg-card hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Timer className="w-3.5 h-3.5 text-primary" />
                      {item.label}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                  </div>
                  <p className="text-[10px] leading-tight text-muted-foreground">{item.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => handleAccept(selectedMins)}
              className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-wider shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
            >
              <Bell className="w-4 h-4" />
              <span>Accept {selectedMins}-Minute Breaks &amp; Remind Me</span>
            </button>

            <button
              onClick={handleDismiss}
              className="w-full py-2.5 text-center text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              I will configure this later in settings
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default WellnessOnboardingModal;
