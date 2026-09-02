import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { z } from "zod";

export function useRealtimeData<T>(
  table: 'news' | 'news_broadcasts' | 'profiles' | 'submissions' | 'reports',
  schema: z.ZodObject<any>,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*',
  dependencies: any[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Fetch from Cache (IndexedDB)
    async function fetchFromCache() {
      try {
        const cachedData = await (db as any)[table].toArray();
        if (cachedData.length > 0) {
          setData(cachedData);
          setLoading(false);
        }
      } catch (err) {
        console.error("Cache fetch error:", err);
      }
    }
    fetchFromCache();

    // 2. Fetch from Supabase and Update Cache
    async function fetchData() {
      try {
        setLoading(true);
        const { data: remoteData, error } = await supabase.from(table).select("*");
        if (error) throw error;
        
        if (remoteData) {
          // Validate with Zod
          const validatedData = remoteData.map((item) => schema.parse(item));
          setData(validatedData as T[]);
          
          // Persist to cache
          await db.transaction('rw', (db as any)[table], async () => {
            await (db as any)[table].clear();
            await (db as any)[table].bulkAdd(validatedData);
          });
        }
      } catch (err) {
        console.error("Supabase fetch error:", err);
        setError("Failed to fetch data. Using cached data (if available).");
      } finally {
        setLoading(false);
      }
    }
    fetchData();

    // Setup subscription
    const channel = supabase
      .channel(`public:${table}`)
      .on(
        'postgres_changes',
        { event, schema: 'public', table },
        (payload) => {
          if (event === 'INSERT' || payload.eventType === 'INSERT') {
            try {
              const validated = schema.parse(payload.new);
              setData((prev) => [...prev, validated as T]);
              (db as any)[table].add(validated);
            } catch (e) {
              console.error("Validation error on insert:", e);
            }
          } else if (event === 'UPDATE' || payload.eventType === 'UPDATE') {
            try {
              const validated = schema.parse(payload.new);
              setData((prev) => prev.map((item: any) => (item.id === validated.id ? validated : item)));
              (db as any)[table].put(validated);
            } catch (e) {
              console.error("Validation error on update:", e);
            }
          } else if (event === 'DELETE' || payload.eventType === 'DELETE') {
            setData((prev) => prev.filter((item: any) => item.id !== payload.old.id));
            (db as any)[table].delete(payload.old.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, event, ...dependencies]);

  return { data, loading, error };
}
