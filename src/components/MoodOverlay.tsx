import React from "react";
import { useUserMood, USER_MOODS } from "@/lib/user-mood-context";
import { cn } from "@/lib/utils";

export const MoodOverlay: React.FC = () => {
  const { mood } = useUserMood();
  const meta = USER_MOODS.find((m) => m.key === mood);

  if (!mood || !meta) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[40] pointer-events-none bg-gradient-to-b transition-all duration-1000 animate-in fade-in fill-mode-both",
        meta.tint,
      )}
      style={{
        boxShadow: "inset 0 0 150px rgba(0,0,0,0.2)",
      }}
    />
  );
};
