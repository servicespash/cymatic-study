import React from "react";
import { NewsCard } from "./NewsCard";
import { NewsBroadcastItem } from "@/lib/news-service";
import { Newspaper, RotateCcw } from "lucide-react";

interface NewsFeedProps {
  items: NewsBroadcastItem[];
  loading?: boolean;
  onResetFilter?: () => void;
  filterLabel?: string;
}

export function NewsFeed({ items, loading = false, onResetFilter, filterLabel }: NewsFeedProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 w-full min-w-0">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div
            key={n}
            className="rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-card dark:bg-zinc-900/60 overflow-hidden flex flex-col animate-pulse"
          >
            <div className="w-full aspect-video bg-zinc-200 dark:bg-zinc-800" />
            <div className="p-5 flex-1 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="h-3 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-5 w-4/5 bg-zinc-300 dark:bg-zinc-700 rounded" />
                <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-4 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded" />
              </div>
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800/80 flex justify-between">
                <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-4 w-8 bg-zinc-200 dark:bg-zinc-800 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 sm:p-16 text-center rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/40 my-4">
        <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
          <Newspaper className="h-6 w-6" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
          No broadcasts found
        </h3>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mb-6 leading-relaxed">
          {filterLabel
            ? `There are currently no active broadcasts matching the "${filterLabel}" filter.`
            : "No active news broadcasts or live podcasts are currently available in the database."}
        </p>

        {onResetFilter && (
          <button
            type="button"
            onClick={onResetFilter}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 px-4 py-2 text-xs font-semibold text-cyan-400 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Show All Broadcasts
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 w-full min-w-0">
      {items.map((item) => (
        <NewsCard key={item.id} item={item} />
      ))}
    </div>
  );
}

export default NewsFeed;
