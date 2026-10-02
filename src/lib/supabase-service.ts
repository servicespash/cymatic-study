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
  const [diagnosticError, setDiagnosticError] = useState<string | null>(null);

  const fetchItems = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);
    setDiagnosticError(null);

    try {
      // If we want to trigger a backend sync, we can optionally call the API route
      if (forceRefresh) {
        await fetch("/api/ncdc-news", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ forceRefresh: true }),
        }).catch((err) => console.error("Sync API failed", err));
      }

      // Try to query the actual 'news_broadcasts' table
      const query = supabase
        .from("news_broadcasts")
        .select("*")
        .eq("is_active", true)
        .order("published_at", { ascending: false });

      const { data, error: sbError } = await query;

      if (sbError) throw sbError;

      setItems(data || []);
      setDiagnosticError(null);
    } catch (err: any) {
      console.error("Supabase fetch from 'content' table failed:", err);

      // Capture the exact error details
      let errorMsg = "Unknown error";
      if (err && typeof err === "object") {
        errorMsg = err.message || err.details || JSON.stringify(err);
        if (err.code) {
          errorMsg = `[SQL State ${err.code}] ${errorMsg}`;
        }
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }

      setDiagnosticError(errorMsg);
      setError(err instanceof Error ? err : new Error(errorMsg));

      // Fallback to empty array in case of connection failure
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchItems();

    // Set up real-time subscription for reactive updates on 'news_broadcasts' table
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
          console.log("Real-time update received for 'news_broadcasts'!", payload);

          setItems((currentItems) => {
            if (payload.eventType === "INSERT") {
              const newItem = payload.new as NewsItem;
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
    diagnosticError,
    refreshFeed: () => fetchItems(true),
  };
}
