import React from "react";
import { USER_MOODS, useUserMood, type UserMood } from "@/lib/user-mood-context";
import { cn } from "@/lib/utils";
import { useTutor } from "@/lib/TutorService";
import { generateEmpathyResponse, getTimeContext } from "@/lib/empathy-engine";
import { useAuth } from "@/lib/auth-context";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export const MoodPicker: React.FC<{ onSelect?: (m: UserMood) => void }> = ({ onSelect }) => {
  const { mood, setMood } = useUserMood();
  const { speak, persona } = useTutor();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleMoodSelect = async (m: UserMood) => {
    setMood(m);
    if (onSelect) onSelect(m);

    // Side effects as per plan.md
    if (m === "focused") {
      toast.success("Focus Mode: 25-minute Pomodoro started. You got this!", {
        description: "Adams: Headphones on, distractions off — we cooking.",
      });
      // In a real app, this would start a global timer
    } else if (m === "confused") {
      navigate({ to: "/tutor" });
    } else if (m === "tired") {
      toast.info("Adams: Aight fam, rest is part of the grind. Try one small quiz then nap.", {
        action: {
          label: "Go to Quizzes",
          onClick: () => navigate({ to: "/quizzes" }),
        },
      });
    }

    // Dynamic AI feedback for mood selection
    const isOnline = typeof navigator !== "undefined" && navigator.onLine;
    const name = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "learner";

    const feedback = await generateEmpathyResponse(
      persona,
      {
        name,
        mood: m,
        time: getTimeContext(),
        isOnline,
      },
      "mood_change",
    );

    if (feedback) {
      // Stressed mood drops TTS rate to 0.7
      void speak(feedback, {
        force: true,
        rate: m === "stressed" ? 0.7 : undefined,
      });
    }
  };

  return (
    <div className="flex items-center gap-2 p-1 bg-muted/30 rounded-full border border-border/50 backdrop-blur-sm shadow-sm">
      {USER_MOODS.map((m) => (
        <button
          key={m.key}
          onClick={() => handleMoodSelect(m.key)}
          title={m.label}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full text-xl transition-all duration-300 hover:scale-110 active:scale-95",
            mood === m.key
              ? "bg-background shadow-glow-sm scale-110 border border-primary/20"
              : "opacity-60 hover:opacity-100",
          )}
        >
          <span className={cn(mood === m.key && "animate-pulse")}>{m.emoji}</span>
        </button>
      ))}
    </div>
  );
};
