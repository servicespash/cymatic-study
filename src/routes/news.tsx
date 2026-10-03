import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FoundersSpotlight } from "@/components/FoundersSpotlight";
import { NewsFeed } from "@/components/NewsFeed";
import { useNewsFeed, NewsBroadcastItem, resolveMediaDetails } from "@/lib/news-service";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RefreshCw, Search, Radio, BookOpen, Volume2, Award, X } from "lucide-react";
import { NewsNotificationBadge } from "@/components/NewsNotificationBadge";

export const Route = createFileRoute("/news")({
  head: () => ({ meta: [{ title: "News & Podcasts — Latty's Cymatic Study" }] }),
  component: () => <NewsPage />,
});

type FilterType = "all" | "curriculum" | "live" | "podcasts" | "exams";

function NewsPage() {
  const { items, loading, refreshing, error, lastSynced, refreshFeed } = useNewsFeed();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filterCounts = useMemo(() => {
    const counts = {
      all: items.length,
      curriculum: 0,
      live: 0,
      podcasts: 0,
      exams: 0,
    };

    items.forEach((item) => {
      const cat = (item.category || "").toLowerCase();
      const media = resolveMediaDetails({
        media_url: item.media_url,
        media_type: item.media_type,
        category: item.category,
        priority: item.priority,
        title: item.title,
      });

      if (
        item.is_curriculum_update === true ||
        cat.includes("curriculum") ||
        item.media_type === "curriculum_update"
      ) {
        counts.curriculum += 1;
      }

      if (
        media.isLive ||
        cat.includes("live") ||
        cat.includes("broadcast") ||
        (item.media_type || "").toLowerCase().includes("live") ||
        item.title.toLowerCase().includes("live")
      ) {
        counts.live += 1;
      }

      if (
        media.isAudio ||
        cat.includes("podcast") ||
        (item.media_type || "").toLowerCase().includes("podcast")
      ) {
        counts.podcasts += 1;
      }

      if (
        cat.includes("exam") ||
        item.title.toLowerCase().includes("uneb") ||
        item.title.toLowerCase().includes("candidate") ||
        item.title.toLowerCase().includes("registration")
      ) {
        counts.exams += 1;
      }
    });

    return counts;
  }, [items]);

  const filteredItems = useMemo(() => {
    let result = items;

    // Apply category filter
    if (activeFilter === "curriculum") {
      result = result.filter(
        (item) =>
          item.is_curriculum_update === true ||
          (item.category || "").toLowerCase().includes("curriculum") ||
          item.media_type === "curriculum_update",
      );
    } else if (activeFilter === "live") {
      result = result.filter((item) => {
        const media = resolveMediaDetails({
          media_url: item.media_url,
          media_type: item.media_type,
          category: item.category,
          priority: item.priority,
          title: item.title,
        });
        const cat = (item.category || "").toLowerCase();
        return (
          media.isLive ||
          cat.includes("live") ||
          cat.includes("broadcast") ||
          (item.media_type || "").toLowerCase().includes("live") ||
          item.title.toLowerCase().includes("live")
        );
      });
    } else if (activeFilter === "podcasts") {
      result = result.filter((item) => {
        const media = resolveMediaDetails({
          media_url: item.media_url,
          media_type: item.media_type,
          category: item.category,
          priority: item.priority,
          title: item.title,
        });
        const cat = (item.category || "").toLowerCase();
        return (
          media.isAudio ||
          cat.includes("podcast") ||
          (item.media_type || "").toLowerCase().includes("podcast")
        );
      });
    } else if (activeFilter === "exams") {
      result = result.filter((item) => {
        const cat = (item.category || "").toLowerCase();
        return (
          cat.includes("exam") ||
          item.title.toLowerCase().includes("uneb") ||
          item.title.toLowerCase().includes("candidate") ||
          item.title.toLowerCase().includes("registration")
        );
      });
    }

    // Apply text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((item) => {
        const inTitle = item.title?.toLowerCase().includes(q);
        const inBody = item.body?.toLowerCase().includes(q);
        const inCat = item.category?.toLowerCase().includes(q);
        return inTitle || inBody || inCat;
      });
    }

    return result;
  }, [items, activeFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10 w-full min-w-0">
        {/* Header Block */}
        <header className="mb-6 sm:mb-8 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-zinc-900 dark:text-white break-words">
                  Cymatic Spotlight
                </h1>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </div>
              </div>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
                Curated national curriculum updates, verified UNEB examination circulars, and live
                scientific masterclasses.
              </p>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
              <button
                type="button"
                onClick={refreshFeed}
                disabled={loading || refreshing}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 px-3.5 py-2 text-xs font-bold text-cyan-600 dark:text-cyan-400 transition-colors border border-cyan-500/20 disabled:opacity-50 cursor-pointer shadow-sm"
                title={
                  lastSynced
                    ? `Last synchronized at ${lastSynced.toLocaleTimeString()}`
                    : "Refresh feed from database"
                }
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${refreshing || loading ? "animate-spin" : ""}`}
                />
                <span>{refreshing ? "Syncing..." : "Refresh"}</span>
              </button>
            </div>
          </div>

          {/* Curriculum Notification Alert Bar */}
          <NewsNotificationBadge
            onSelectCurriculum={() => setActiveFilter("curriculum")}
            className="self-start"
          />
        </header>

        {/* Featured Founder & Institutional Spotlight */}
        <section className="mb-8">
          <FoundersSpotlight />
        </section>

        {/* Filter and Search Bar Section */}
        <section className="mb-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
          {/* Segmented Filter Buttons (Zero-Pill Compliance) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none min-w-0">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === "all"
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
              }`}
            >
              All Broadcasts
              <span className="text-[10px] opacity-70">({filterCounts.all})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("curriculum")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === "curriculum"
                  ? "bg-cyan-500 text-zinc-950 font-bold shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
              }`}
            >
              <BookOpen className="h-3 w-3" />
              Curriculum
              <span className="text-[10px] opacity-70">({filterCounts.curriculum})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("live")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === "live"
                  ? "bg-red-500 text-white font-bold shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
              }`}
            >
              <Radio className="h-3 w-3 text-red-500 group-hover:text-white" />
              Live & Video
              <span className="text-[10px] opacity-70">({filterCounts.live})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("podcasts")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === "podcasts"
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
              }`}
            >
              <Volume2 className="h-3 w-3" />
              Podcasts
              <span className="text-[10px] opacity-70">({filterCounts.podcasts})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("exams")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === "exams"
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
              }`}
            >
              <Award className="h-3 w-3" />
              Exams & UNEB
              <span className="text-[10px] opacity-70">({filterCounts.exams})</span>
            </button>
          </div>

          {/* Quick Keyword Search Input */}
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search broadcasts..."
              className="w-full pl-8.5 pr-8 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5 cursor-pointer"
                title="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </section>

        {/* Feed Grid Area */}
        <section>
          {error && items.length === 0 ? (
            <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs mb-6 flex items-center justify-between">
              <span>Database query failed: {error.message}. Showing local cache if available.</span>
              <button
                type="button"
                onClick={refreshFeed}
                className="underline font-bold ml-3 cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : null}

          <ErrorBoundary>
            <NewsFeed
              items={filteredItems}
              loading={loading && items.length === 0}
              filterLabel={
                activeFilter !== "all" ? activeFilter : searchQuery ? `"${searchQuery}"` : undefined
              }
              onResetFilter={() => {
                setActiveFilter("all");
                setSearchQuery("");
              }}
            />
          </ErrorBoundary>
        </section>
      </main>
    </div>
  );
}

export default NewsPage;
