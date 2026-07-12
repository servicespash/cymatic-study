import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { FoundersSpotlight } from "@/components/FoundersSpotlight";
import { toast } from "sonner";
import { NewsFeed } from "@/components/NewsFeed";
import { useNewsFeed, NewsItem } from "@/lib/supabase-service";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Radio,
  RefreshCw,
} from "lucide-react";

export const Route = createFileRoute("/news")({
  head: () => ({ meta: [{ title: "News & Podcasts — Latty's Cymatic Hub" }] }),
  component: NewsPage,
});

// Represents the parsed JSON body for rich media types
type ParsedBody = {
  description?: string;
  subject?: string;
  speaker?: string;
  instructor?: string;
  duration?: string;
  scheduled_at?: string;
  achievement?: string;
  school?: string;
};

function NewsPage() {
  const { items, loading, refreshing, error, refreshFeed } = useNewsFeed();

  // Show error toast if real-time or fetch fails
  useEffect(() => {
    if (error) {
      toast.error("Failed to connect to network feed.");
    }
  }, [error]);

  const handleRefresh = async () => {
    await refreshFeed();
    toast.success("Content feed updated successfully!");
  };

  // Podcast Player State
  const [currentPodIndex, setCurrentPodIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);

  // Extract podcasts from items
  const podcastEpisodes = items
    .filter((item) => item.media_type === "podcast")
    .map((item) => {
      let parsed: ParsedBody = {};
      try {
        parsed = JSON.parse(item.body);
      } catch (e) {
        parsed = { description: item.body };
      }
      return {
        id: item.id,
        title: item.title,
        subject: parsed.subject || "General",
        description: parsed.description || "",
        audioUrl: item.media_url || "",
        duration: parsed.duration || "0:00",
        speaker: parsed.speaker || "Unknown",
      };
    });

  const activePodcast = podcastEpisodes[currentPodIndex] || null;

  // Audio Side Effects
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (audioRef.current && activePodcast) {
      audioRef.current.src = activePodcast.audioUrl;
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch((err) => console.log("Play deferred:", err));
      } else {
        audioRef.current.pause();
      }
    }
  }, [currentPodIndex, activePodcast]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handlePlayPause = () => {
    if (audioRef.current && activePodcast) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch((err) => console.log("Play deferred:", err));
      }
    }
  };

  const handleNext = () => {
    if (podcastEpisodes.length === 0) return;
    setCurrentPodIndex((prev) => (prev + 1) % podcastEpisodes.length);
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    if (podcastEpisodes.length === 0) return;
    setCurrentPodIndex((prev) => (prev - 1 + podcastEpisodes.length) % podcastEpisodes.length);
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Helper to format JSON bodies for NewsFeed cards
  const formatItemsForFeed = (feedItems: NewsItem[]) => {
    return feedItems.map((item) => {
      let bodyText = item.body;
      try {
        const parsed: ParsedBody = JSON.parse(item.body);
        bodyText = parsed.description || item.body;
      } catch (e) {
        // Not JSON, leave as is
      }
      return { ...item, body: bodyText };
    });
  };

  const curriculumItems = formatItemsForFeed(
    items.filter((i) => i.media_type === "curriculum_update"),
  );
  const shoutoutItems = formatItemsForFeed(
    items.filter((i) => i.media_type === "student_shoutout"),
  );
  const liveSessionItems = formatItemsForFeed(items.filter((i) => i.media_type === "live_session"));

  const categorizedFeeds = [
    { name: "Curriculum Updates", items: curriculumItems },
    { name: "Live Sessions", items: liveSessionItems },
    { name: "Student Shoutouts", items: shoutoutItems },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 p-4 pb-24 text-zinc-100">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleNext}
      />

      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
              Cymatic Spotlight &amp; Podium Podcasts
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Stay ahead with real-time NCDC curriculum news and premium audio masterclasses.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center gap-2 rounded-xl bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-400 hover:bg-cyan-500/20 transition-colors border border-cyan-500/20 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing Feed..." : "Refresh Feed"}
          </button>
        </div>

        <FoundersSpotlight />

        {/* Dual-column Grid: News on Left, Custom Podcasts Console on Right */}
        <div className="grid gap-8 lg:grid-cols-3 mt-8">
          {/* Left Column: News Feed */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-lg font-bold uppercase tracking-widest text-zinc-400 text-xs">
                NCDC Broadcast News &amp; Updates
              </h2>
            </div>

            {loading && (
              <div className="flex flex-col items-center justify-center p-12 bg-white/5 rounded-3xl border border-white/10">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
                <p className="text-sm text-zinc-400 mt-4">Tuning the frequency, please wait...</p>
              </div>
            )}

            {!loading && (
              <div className="space-y-10">
                {categorizedFeeds.map(
                  (cat) =>
                    cat.items.length > 0 && (
                      <section key={cat.name} className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                          <h3 className="text-base font-black text-white tracking-tight">
                            {cat.name}
                          </h3>
                        </div>
                        <NewsFeed items={cat.items} />
                      </section>
                    ),
                )}

                {categorizedFeeds.every((cat) => cat.items.length === 0) && (
                  <div className="text-center p-12 bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-800">
                    <p className="text-sm font-semibold text-zinc-400">No content found</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Custom Interactive Podcasts Console */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-cyan-400 animate-pulse" />
              <h2 className="text-lg font-bold uppercase tracking-widest text-zinc-400 text-xs">
                Podium Podcasts
              </h2>
            </div>

            {activePodcast ? (
              <>
                {/* Spotify-styled Premium Player UI */}
                <div className="glass rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl flex flex-col gap-5 relative overflow-hidden backdrop-blur-md">
                  <div className="absolute top-0 right-0 h-32 w-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

                  {/* Title & Cover */}
                  <div className="flex items-start gap-4">
                    <div className="relative h-16 w-16 shrink-0 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-md">
                      <Radio className="h-8 w-8 text-white" />
                      {isPlaying && (
                        <div className="absolute inset-0 flex items-end justify-center gap-0.5 pb-2 pointer-events-none bg-black/40 rounded-2xl">
                          <span className="h-3 w-1 bg-cyan-400 animate-[bounce_0.6s_infinite]" />
                          <span className="h-5 w-1 bg-cyan-400 animate-[bounce_0.6s_infinite_0.15s]" />
                          <span className="h-4 w-1 bg-cyan-400 animate-[bounce_0.6s_infinite_0.3s]" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="inline-block rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                        {activePodcast.subject}
                      </span>
                      <h3 className="text-base font-black text-white truncate mt-1">
                        {activePodcast.title}
                      </h3>
                      <p className="text-xs text-zinc-400 truncate">
                        Hosted by {activePodcast.speaker}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-zinc-400 leading-relaxed bg-black/20 rounded-xl p-3 border border-white/5">
                    {activePodcast.description}
                  </p>

                  {/* Timeline controls */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold">
                      <span>{formatTime(currentTime)}</span>
                      <span>{activePodcast.duration}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={duration || 100}
                      value={currentTime}
                      onChange={handleSeekChange}
                      className="w-full accent-cyan-400 cursor-pointer h-1 rounded-lg bg-zinc-800"
                    />
                  </div>

                  {/* Interactive buttons */}
                  <div className="flex items-center justify-between px-2">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="text-zinc-400 hover:text-white transition-colors"
                      title={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? (
                        <VolumeX className="h-5 w-5 text-red-400" />
                      ) : (
                        <Volume2 className="h-5 w-5" />
                      )}
                    </button>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={handlePrev}
                        className="text-zinc-400 hover:text-white transition-colors"
                        title="Previous Episode"
                      >
                        <SkipBack className="h-5 w-5" />
                      </button>

                      <button
                        onClick={handlePlayPause}
                        className="h-12 w-12 flex items-center justify-center rounded-full bg-cyan-500 text-black hover:scale-105 hover:bg-cyan-400 transition-all shadow-lg"
                        title={isPlaying ? "Pause" : "Play"}
                      >
                        {isPlaying ? (
                          <Pause className="h-6 w-6" />
                        ) : (
                          <Play className="h-6 w-6 ml-0.5" />
                        )}
                      </button>

                      <button
                        onClick={handleNext}
                        className="text-zinc-400 hover:text-white transition-colors"
                        title="Next Episode"
                      >
                        <SkipForward className="h-5 w-5" />
                      </button>
                    </div>

                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                      EP {currentPodIndex + 1}/{podcastEpisodes.length}
                    </span>
                  </div>
                </div>

                {/* Playlist Queue */}
                <div className="glass rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl flex flex-col gap-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">
                    Playlist Queue
                  </h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-none">
                    {podcastEpisodes.map((pod, index) => {
                      const isActive = index === currentPodIndex;
                      return (
                        <button
                          key={pod.id}
                          onClick={() => {
                            setCurrentPodIndex(index);
                            setIsPlaying(true);
                          }}
                          className={`w-full text-left p-3 rounded-2xl flex items-center justify-between gap-3 transition-all border ${
                            isActive
                              ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                              : "bg-white/5 border-transparent hover:bg-white/10 hover:border-white/5 text-zinc-300"
                          }`}
                        >
                          <div className="min-w-0 flex items-center gap-3">
                            <span className="text-xs text-zinc-500 font-bold shrink-0">
                              0{index + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-black truncate">{pod.title}</p>
                              <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                                {pod.speaker} · {pod.subject}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-zinc-500 shrink-0 uppercase tracking-tight">
                            {pod.duration}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="glass rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl flex flex-col items-center justify-center min-h-[300px]">
                <Radio className="h-12 w-12 text-zinc-600 mb-4" />
                <p className="text-sm font-semibold text-zinc-400">No podcasts available yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
