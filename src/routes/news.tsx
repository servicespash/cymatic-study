import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { FoundersSpotlight } from "@/components/FoundersSpotlight";
import { toast } from "sonner";
import { NewsFeed } from "@/components/NewsFeed";
import { useNewsFeed } from "@/lib/supabase-service";
import { RoleGuard } from "@/components/RoleGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RefreshCw } from "lucide-react";
import { NewsNotificationBadge } from "@/components/NewsNotificationBadge";

export const Route = createFileRoute("/news")({
  head: () => ({ meta: [{ title: "News & Podcasts — Latty's Cymatic Study" }] }),
  component: () => (
    <RoleGuard>
      <NewsPage />
    </RoleGuard>
  ),
});

function NewsPage() {
  const { items, loading, error, refreshFeed } = useNewsFeed();
  const [filter, setFilter] = useState<string>("all");

  const filteredItems = useMemo(() => {
    return filter === "all"
      ? items
      : items.filter((item) => item.category === filter);
  }, [items, filter]);

  useEffect(() => {
    if (error) {
      toast.error(`Failed to load news feed: ${error.message}`);
    }
  }, [error]);

  return (
    <div className="app-container dashboard-container min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl w-full min-w-0">
        <div className="mb-6 sm:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white break-words">
              Cymatic Spotlight
            </h1>
            <NewsNotificationBadge />
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 leading-relaxed">
              Real-time curriculum news and updates.
            </p>
          </div>
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-xs text-white"
            >
              <option value="all">All Categories</option>
              <option value="curriculum">Curriculum</option>
              <option value="live">Live Sessions</option>
              <option value="podcast">Podcasts</option>
            </select>
            <button
              onClick={refreshFeed}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500/10 px-4 py-2.5 text-xs sm:text-sm font-bold text-cyan-400 hover:bg-cyan-500/20 transition-colors border border-cyan-500/20 disabled:opacity-50 shrink-0 self-start md:self-auto"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        <FoundersSpotlight />

        <div className="grid gap-6 sm:gap-8 mt-6 sm:mt-8 min-w-0">
          <div className="space-y-8 sm:space-y-12 min-w-0">
            <div className="flex items-center gap-3 mb-2 px-1">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                Live News & Updates
              </h2>
            </div>

            {loading && (
              <div className="flex flex-col items-center justify-center p-12 bg-white/5 rounded-3xl border border-white/10">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
                <p className="text-sm text-zinc-400 mt-4">Tuning the frequency...</p>
              </div>
            )}

            {!loading && (
              <ErrorBoundary>
                <NewsFeed items={filteredItems} />
              </ErrorBoundary>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
