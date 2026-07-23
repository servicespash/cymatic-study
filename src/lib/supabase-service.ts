import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type NewsItem = {
  id: string;
  title: string;
  body: string;
  media_url: string | null;
  media_type: string | null;
  category: string | null;
  published_at: string;
  is_ad?: boolean;
  priority?: string;
  is_active?: boolean;
};

export function useNewsFeed() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchItems = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      // If we want to trigger a backend sync, we can optionally call the API route
      if (forceRefresh) {
        await fetch("/api/ncdc-news", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ forceRefresh: true }),
        }).catch((err) => console.error("Sync API failed", err));
      }

      const { data, error: sbError } = await supabase
        .from("news_broadcasts")
        .select("*")
        .order("published_at", { ascending: false });

      if (sbError) throw sbError;

      setItems(data || []);
    } catch (err) {
      console.error("Fetch Error:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch news"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchItems();

    // Set up real-time subscription for reactive updates
    const channel = supabase
      .channel("news_broadcasts_changes")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERT, UPDATE, DELETE
          schema: "public",
          table: "news_broadcasts",
        },
        (payload) => {
          console.log("Real-time update received!", payload);

          setItems((currentItems) => {
            if (payload.eventType === "INSERT") {
              const newItem = payload.new as NewsItem;
              // Prevent duplicates if already exists
              if (currentItems.some((item) => item.id === newItem.id)) {
                return currentItems;
              }
              const updated = [newItem, ...currentItems];
              return updated.sort(
                (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime(),
              );
            } else if (payload.eventType === "UPDATE") {
              const updatedItem = payload.new as NewsItem;
              const updated = currentItems.map((item) =>
                item.id === updatedItem.id ? updatedItem : item,
              );
              return updated.sort(
                (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime(),
              );
            } else if (payload.eventType === "DELETE") {
              return currentItems.filter((item) => item.id !== payload.old.id);
            }
            return currentItems;
          });
        },
      )
      .subscribe();

    // Cleanup stale state on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchItems]);

  return {
    items,
    loading,
    refreshing,
    error,
    refreshFeed: () => fetchItems(true),
  };
}
