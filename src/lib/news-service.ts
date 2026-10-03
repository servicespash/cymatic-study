import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface NewsBroadcastItem {
  id: string;
  title: string;
  body: string;
  media_url: string | null;
  media_type: string | null;
  is_ad?: boolean;
  is_active: boolean;
  published_at: string;
  is_curriculum_update?: boolean | null;
  category?: string | null;
  priority?: string | null;
  expires_at?: string | null;
  media_provider?: string | null;
  likes_count?: number;
}

export interface ParsedNewsBody {
  text: string;
  description?: string;
  subject?: string;
  speaker?: string;
  instructor?: string;
  duration?: string;
  scheduled_at?: string;
}

/**
 * Safely parses the body of a news item, which can be raw text or stringified JSON.
 */
export function parseNewsBody(rawBody: string | null | undefined): ParsedNewsBody {
  if (!rawBody) return { text: "" };
  const trimmed = rawBody.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      return {
        text: parsed.description || parsed.text || parsed.summary || rawBody,
        description: parsed.description,
        subject: parsed.subject,
        speaker: parsed.speaker || parsed.instructor || parsed.author,
        instructor: parsed.instructor,
        duration: parsed.duration,
        scheduled_at: parsed.scheduled_at,
      };
    } catch {
      // Fallback to raw text
    }
  }
  return { text: rawBody };
}

/**
 * Resolves media type and embed properties from media_url and media_type.
 */
export function resolveMediaDetails(item: {
  media_url: string | null;
  media_type: string | null;
  category?: string | null;
  priority?: string | null;
  title?: string;
  body?: string; // Add body for scheduled_at check
}) {
  const url = item.media_url?.trim() || "";
  const mediaType = (item.media_type || "").toLowerCase();
  const category = (item.category || "").toLowerCase();
  const title = (item.title || "").toLowerCase();
  
  // Parse body for scheduled_at
  const { scheduled_at } = parseNewsBody(item.body || "");
  const now = new Date();
  
  let isLive =
    mediaType === "live_session" ||
    mediaType === "live" ||
    category === "live" ||
    category === "broadcast" ||
    item.priority === "urgent" ||
    title.includes("live session") ||
    title.includes("livestream") ||
    url.includes("/live") ||
    url.includes("youtube.com/live");

  // Refine live status based on scheduled_at if available
  if (scheduled_at) {
      const scheduledDate = new Date(scheduled_at);
      const duration = 2 * 60 * 60 * 1000; // Assume 2-hour sessions
      if (now >= scheduledDate && now <= new Date(scheduledDate.getTime() + duration)) {
          isLive = true;
      } else if (now > new Date(scheduledDate.getTime() + duration)) {
          isLive = false; // Session concluded
      }
  }

  const isAudio =
    mediaType === "audio" ||
    mediaType === "podcast" ||
    category === "podcast" ||
    url.endsWith(".mp3") ||
    url.endsWith(".wav") ||
    url.endsWith(".aac") ||
    url.endsWith(".ogg");

  // Check YouTube
  let youtubeEmbedUrl: string | null = null;
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    let videoId: string | null = null;
    if (url.includes("/embed/")) {
      const match = url.match(/\/embed\/([a-zA-Z0-9_-]+)/);
      if (match) videoId = match[1];
    } else if (url.includes("watch?v=")) {
      const match = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
      if (match) videoId = match[1];
    } else if (url.includes("youtu.be/")) {
      const match = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
      if (match) videoId = match[1];
    }

    if (videoId) {
      youtubeEmbedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
    } else if (url.includes("/embed/")) {
      youtubeEmbedUrl = url;
    }
  }

  const isVideoFile =
    url.endsWith(".mp4") ||
    url.endsWith(".webm") ||
    url.endsWith(".m4v") ||
    (mediaType.startsWith("video") && !youtubeEmbedUrl);

  const isEmbedVideo = !!youtubeEmbedUrl || url.includes("vimeo.com");

  const isImage =
    !isAudio &&
    !isVideoFile &&
    !isEmbedVideo &&
    (url.endsWith(".jpg") ||
      url.endsWith(".jpeg") ||
      url.endsWith(".png") ||
      url.endsWith(".webp") ||
      url.endsWith(".svg") ||
      mediaType === "image");

  return {
    hasMedia: !!url,
    url,
    isLive,
    isAudio,
    isVideoFile,
    isEmbedVideo,
    youtubeEmbedUrl,
    isImage,
  };
}

const LOCAL_STORAGE_CACHE_KEY = "cymatic_news_broadcasts_cache_v2";
const LAST_FETCH_KEY = "cymatic_news_broadcasts_last_fetch_v2";
const CACHE_TTL_MS = 60 * 1000; // 1 minute fresh window, but local cache serves instantly

function loadCachedNews(): NewsBroadcastItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => item && item.is_active !== false);
    }
  } catch (err) {
    console.warn("Failed to load news from localStorage cache:", err);
  }
  return [];
}

function saveCachedNews(items: NewsBroadcastItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(items));
    localStorage.setItem(LAST_FETCH_KEY, Date.now().toString());
  } catch (err) {
    console.warn("Failed to write news to localStorage cache:", err);
  }
}

export function useNewsFeed() {
  const [items, setItems] = useState<NewsBroadcastItem[]>(() => loadCachedNews());
  const [loading, setLoading] = useState<boolean>(() => loadCachedNews().length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(() => {
    if (typeof window === "undefined") return null;
    const ts = localStorage.getItem(LAST_FETCH_KEY);
    return ts ? new Date(parseInt(ts, 10)) : null;
  });

  const fetchItems = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        if (items.length === 0) {
          setLoading(true);
        }
      }
      setError(null);

      try {
        const { data, error: sbError } = await supabase
          .from("news_broadcasts")
          .select("*")
          .eq("is_active", true)
          .order("published_at", { ascending: false });

        if (sbError) {
          throw sbError;
        }

        const activeItems = (data || []).filter((item) => item.is_active !== false);

        setItems(activeItems);
        saveCachedNews(activeItems);
        const now = new Date();
        setLastSynced(now);
      } catch (err: any) {
        console.warn("Supabase news_broadcasts fetch failed, relying on cache:", err);
        const errorObj =
          err instanceof Error ? err : new Error(err?.message || "Failed to load news");
        setError(errorObj);
        // Keep existing cached items so user never experiences an empty screen
        const cached = loadCachedNews();
        if (cached.length > 0 && items.length === 0) {
          setItems(cached);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [items.length],
  );

  useEffect(() => {
    fetchItems(false);
  }, [fetchItems]);

  useEffect(() => {
    // Generate a unique channel name for this instance
    const channelId = `news_broadcasts_${Math.random().toString(36).substring(2, 11)}`;
    const channel = supabase.channel(channelId);

    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "news_broadcasts",
        },
        (payload) => {
          setItems((prevItems) => {
            let updated = [...prevItems];
            if (payload.eventType === "INSERT") {
              const newItem = payload.new as NewsBroadcastItem;
              if (newItem.is_active !== false) {
                const exists = updated.some((it) => it.id === newItem.id);
                if (!exists) {
                  updated = [newItem, ...updated];
                }
              }
            } else if (payload.eventType === "UPDATE") {
              const updatedItem = payload.new as NewsBroadcastItem;
              if (updatedItem.is_active === false) {
                // Remove deactivated items
                updated = updated.filter((it) => it.id !== updatedItem.id);
              } else {
                const index = updated.findIndex((it) => it.id === updatedItem.id);
                if (index >= 0) {
                  updated[index] = updatedItem;
                } else {
                  updated = [updatedItem, ...updated];
                }
              }
            } else if (payload.eventType === "DELETE") {
              const oldId = payload.old?.id;
              if (oldId) {
                updated = updated.filter((it) => it.id !== oldId);
              }
            }

            // Always maintain sorted by published_at descending
            updated.sort((a, b) => {
              const dateA = new Date(a.published_at || 0).getTime();
              const dateB = new Date(b.published_at || 0).getTime();
              return dateB - dateA;
            });

            saveCachedNews(updated);
            return updated;
          });
        },
      )
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") {
          console.log(`News Realtime Status: ${status}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    items,
    loading,
    refreshing,
    error,
    lastSynced,
    refreshFeed: () => fetchItems(true),
  };
}

/**
 * Hook to count unread or recent curriculum updates for notifications.
 */
export function useCurriculumUpdatesNotification() {
  const { items } = useNewsFeed();
  const [dismissedId, setDismissedId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("cymatic_curriculum_update_dismissed");
  });

  const recentCurriculumUpdates = useMemo(() => {
    return items.filter((item) => {
      const isCurriculum =
        item.is_curriculum_update === true ||
        (item.category || "").toLowerCase() === "curriculum" ||
        item.media_type === "curriculum_update";
      return isCurriculum && item.is_active;
    });
  }, [items]);

  const latestCurriculumItem = recentCurriculumUpdates[0] || null;
  const hasNew = Boolean(latestCurriculumItem && latestCurriculumItem.id !== dismissedId);

  const dismissNotification = useCallback(() => {
    if (latestCurriculumItem) {
      setDismissedId(latestCurriculumItem.id);
      if (typeof window !== "undefined") {
        localStorage.setItem("cymatic_curriculum_update_dismissed", latestCurriculumItem.id);
      }
    }
  }, [latestCurriculumItem]);

  return {
    hasNew,
    count: recentCurriculumUpdates.length,
    latestItem: latestCurriculumItem,
    dismissNotification,
  };
}
