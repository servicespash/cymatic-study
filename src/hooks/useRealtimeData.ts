import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { z } from "zod";

function resolveDexieTable(tableName: string) {
  const tableMap: Record<string, any> = {
    news: db.news || db.news_broadcasts,
    news_broadcasts: db.news_broadcasts,
    profiles: db.profiles,
    submissions: db.submissions,
    project_submissions: db.project_submissions || db.submissions,
  };
  return tableMap[tableName] || (db as any)[tableName] || null;
}

export function useRealtimeData<T>(
  table: "news" | "news_broadcasts" | "profiles" | "submissions" | "reports" | "project_submissions" | "dashboard_tasks",
  schema: z.ZodObject<any>,
  event: "INSERT" | "UPDATE" | "DELETE" | "*" = "*",
  dependencies: any[] = [],
  organizationId?: string | null,
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const targetTable = resolveDexieTable(table);

    // 1. Fetch from Cache (IndexedDB)
    async function fetchFromCache() {
      try {
        if (targetTable) {
          let cachedData = await targetTable.toArray();
          if (organizationId) {
            cachedData = cachedData.filter(
              (item: any) =>
                item.organization_id === organizationId ||
                item.school_id === organizationId ||
                item.org_id === organizationId,
            );
          }
          if (cachedData.length > 0) {
            setData(cachedData);
            setLoading(false);
          }
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
        let query = (supabase.from as any)(table).select("*");

        if (organizationId) {
          // STRICT FILTERING: Prevent cross-school data leakage
          query = query.eq("organization_id", organizationId);
        }

        const { data: remoteData, error } = await query;
        if (error) throw error;

        if (remoteData) {
          // Validate with Zod
          const validatedData = remoteData.map((item: any) => schema.parse(item));
          setData(validatedData as T[]);

          // Persist to cache safely
          if (targetTable) {
            await db.transaction("rw", targetTable, async () => {
              await targetTable.clear();
              if (targetTable.bulkPut) {
                await targetTable.bulkPut(validatedData);
              } else if (targetTable.bulkAdd) {
                await targetTable.bulkAdd(validatedData);
              }
            });
          }
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
      .on("postgres_changes", { event, schema: "public", table }, (payload) => {
        const liveTable = resolveDexieTable(table);
        if (event === "INSERT" || payload.eventType === "INSERT") {
          try {
            const validated = schema.parse(payload.new);
            if (liveTable) {
              if (liveTable.put) {
                liveTable.put(validated).catch(console.error);
              } else if (liveTable.add) {
                liveTable.add(validated).catch(console.error);
              }
            }
            setData((prev) => [...prev, validated as T]);
          } catch (e) {
            console.error("Validation error on insert:", e);
          }
        } else if (event === "UPDATE" || payload.eventType === "UPDATE") {
          try {
            const validated = schema.parse(payload.new);
            if (liveTable) {
              liveTable.put(validated).catch(console.error);
            }
            setData((prev) =>
              prev.map((item: any) => (item.id === validated.id ? validated : item)),
            );
          } catch (e) {
            console.error("Validation error on update:", e);
          }
        } else if (event === "DELETE" || payload.eventType === "DELETE") {
          setData((prev) => prev.filter((item: any) => item.id !== payload.old?.id));
          if (liveTable && payload.old?.id) {
            liveTable.delete(payload.old.id).catch(console.error);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, event, ...dependencies]);

  return { data, loading, error };
}
