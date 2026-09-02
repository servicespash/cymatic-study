import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface NewsArticle {
  id: string;
  title: string;
  body: string;
  summary?: string;
  media_url?: string | null;
  media_type?: string | null;
  category?: string | null;
  published_at: string;
  author?: string;
  is_featured?: boolean;
}

const CACHE_KEY = "cymatic_news_cache_v1";

export async function fetchNewsArticles(forceRefresh = false): Promise<NewsArticle[]> {
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Error reading news cache:", e);
    }
  }

  try {
    // Query 'news_broadcasts' table directly
    const { data, error } = await supabase
      .from("news_broadcasts")
      .select("*")
      .order("published_at", { ascending: false });

    if (error) throw error;

    const articles: NewsArticle[] = (data || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      body: item.body || "",
      summary: item.body?.slice(0, 150) + "..." || "",
      media_url: item.media_url || null,
      media_type: item.media_type || "article",
      category: item.category || "Education",
      published_at: item.published_at || new Date().toISOString(),
      author: item.media_provider || "NCDC Broadcast Desk",
      is_featured: item.priority === "high" || false,
    }));

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(articles));
    } catch (e) {
      console.warn("Failed to write news cache:", e);
    }

    return articles;
  } catch (err) {
    console.warn("Supabase news_broadcasts fetch failed, falling back to cache:", err);
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {}

    // Ultimate fallback
    return [];
  }
}

export function useNewsService() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNews = useCallback(async (force = false) => {
    if (force) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await fetchNewsArticles(force);
      setArticles(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load news articles.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNews();

    // Subscribe to real-time updates for news broadcasts in Supabase
    const channel = supabase
      .channel("news-broadcasts-realtime-sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "news_broadcasts",
        },
        () => {
          console.log("Real-time news broadcast update detected! Refreshing news feed...");
          loadNews(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadNews]);

  return {
    articles,
    loading,
    refreshing,
    error,
    refreshNews: () => loadNews(true),
  };
}
