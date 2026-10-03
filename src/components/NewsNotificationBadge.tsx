import React from "react";
import { Sparkles, Bell, Check } from "lucide-react";
import { useCurriculumUpdatesNotification } from "@/lib/news-service";

interface NewsNotificationBadgeProps {
  onSelectCurriculum?: () => void;
  className?: string;
}

export const NewsNotificationBadge: React.FC<NewsNotificationBadgeProps> = ({
  onSelectCurriculum,
  className = "",
}) => {
  const { hasNew, count, latestItem, dismissNotification } = useCurriculumUpdatesNotification();

  if (!hasNew || !latestItem) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-2 rounded-xl bg-cyan-950/60 border border-cyan-500/30 px-3 py-1.5 text-xs text-cyan-200 shadow-sm transition-all ${className}`}
    >
      <div className="relative flex h-2 w-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
      </div>

      <div className="flex items-center gap-1.5 min-w-0">
        <span className="font-semibold text-white tracking-tight shrink-0">
          New Curriculum Update
        </span>
        {count > 1 && <span className="text-[10px] text-cyan-400 font-mono">(+{count - 1})</span>}
        <span
          className="text-zinc-400 truncate hidden sm:inline max-w-[200px]"
          title={latestItem.title}
        >
          — {latestItem.title}
        </span>
      </div>

      {onSelectCurriculum && (
        <button
          type="button"
          onClick={() => {
            onSelectCurriculum();
            dismissNotification();
          }}
          className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 underline underline-offset-2 ml-1 shrink-0 cursor-pointer"
        >
          View
        </button>
      )}

      <button
        type="button"
        onClick={dismissNotification}
        aria-label="Dismiss notification"
        title="Mark as read"
        className="ml-1 text-zinc-500 hover:text-zinc-300 p-0.5 rounded cursor-pointer transition-colors shrink-0"
      >
        <Check className="h-3 w-3" />
      </button>
    </div>
  );
};

export default NewsNotificationBadge;
