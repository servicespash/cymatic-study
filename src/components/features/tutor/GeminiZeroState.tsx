import React from "react";
import { motion } from "framer-motion";
import { Sparkles, RotateCw, ArrowRight } from "lucide-react";
import {
  useAdaptiveSuggestions,
  getSuggestionIcon,
  type AdaptiveSuggestion,
} from "@/hooks/useAdaptiveSuggestions";

interface GeminiZeroStateProps {
  displayName?: string;
  onSelectPrompt?: (prompt: string) => void;
  className?: string;
}

export function GeminiZeroState({
  displayName = "Latif",
  onSelectPrompt,
  className = "",
}: GeminiZeroStateProps) {
  const { greeting, suggestions, rotateSuggestions, recordInteraction } =
    useAdaptiveSuggestions(displayName);

  const handlePromptClick = (s: AdaptiveSuggestion) => {
    recordInteraction(s.title);
    if (onSelectPrompt) {
      onSelectPrompt(s.prompt);
    }
  };

  return (
    <div
      className={`flex flex-col items-center justify-center text-center px-4 py-8 max-w-2xl mx-auto space-y-8 select-none ${className}`}
    >
      {/* 4-Pointed Multicolored Gemini Spark Star */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative group cursor-pointer"
        onClick={rotateSuggestions}
        title="Click to refresh suggestions"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-indigo-500 to-amber-400 rounded-full blur-xl opacity-40 group-hover:opacity-75 transition-opacity" />
        <svg
          viewBox="0 0 48 48"
          className="relative w-12 h-12 sm:w-14 sm:h-14 transition-transform group-hover:scale-110 drop-shadow-lg"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M24 0C24 13.255 13.255 24 0 24C13.255 24 24 34.745 24 48C24 34.745 34.745 24 48 24C34.745 24 24 13.255 24 0Z"
            fill="url(#geminiSparkGrad)"
          />
          <defs>
            <linearGradient
              id="geminiSparkGrad"
              x1="0"
              y1="0"
              x2="48"
              y2="48"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#38bdf8" />
              <stop offset="0.35" stopColor="#818cf8" />
              <stop offset="0.7" stopColor="#c084fc" />
              <stop offset="1" stopColor="#fbbf24" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Dynamic Personalized Greeting */}
      <motion.div
        key={greeting}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-1"
      >
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground">
          {greeting}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground font-medium">
          Ask a question, practice concepts, or start a creative design &amp; coding sprint.
        </p>
      </motion.div>

      {/* Adaptive Suggestion Cards (Styled like Gemini Mobile Screenshots) */}
      <div className="w-full space-y-2.5 max-w-xl">
        {suggestions.map((item, idx) => {
          const IconComponent = getSuggestionIcon(item.iconName);
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.08 }}
              onClick={() => handlePromptClick(item)}
              type="button"
              className="group flex w-full items-center justify-between gap-3.5 p-4 rounded-2xl border border-border/80 bg-card hover:bg-card/90 hover:border-primary/50 text-left transition-all shadow-sm hover:shadow-md cursor-pointer hover:translate-x-0.5"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="p-2.5 rounded-xl bg-muted/70 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                  <IconComponent className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {item.title}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0" />
            </motion.button>
          );
        })}
      </div>

      {/* Quick Action: Shuffle Suggestions */}
      <div className="flex items-center gap-2 pt-2">
        <button
          onClick={rotateSuggestions}
          type="button"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-border/70 bg-muted/40 hover:bg-muted text-[11px] font-bold text-muted-foreground hover:text-foreground transition-all"
        >
          <RotateCw className="w-3 h-3" />
          <span>More Suggestions</span>
        </button>
      </div>
    </div>
  );
}

export default GeminiZeroState;
