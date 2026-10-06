import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PostgrestError } from "@supabase/supabase-js";
import { useAuth } from "@/lib/auth-context";

const isUUID = (val?: string | null) =>
  Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim()));

export function useSupabaseData<T>(
  query: any,
  dependencies: any[] = [],
  manualOrganizationId?: string | null,
) {
  const { organizationId: contextOrgId } = useAuth();
  const organizationId = manualOrganizationId || contextOrgId;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);

    let finalQuery = query;
    if (organizationId) {
      // STRICT FILTERING: Prevent cross-school data leakage
      try {
        if (typeof query.eq === "function") {
          const tableName = (query as any).table?.table || "";
          const isUuid = isUUID(organizationId);

          if (tableName === "news_broadcasts" || tableName === "news") {
            console.log("useSupabaseData: Skipping org filter for news_broadcasts");
          } else if (isUuid) {
            finalQuery = query.eq("org_id", organizationId);
          } else {
            finalQuery = query.eq("school_key", organizationId);
          }
        }
      } catch (e) {
        console.warn(
          "useSupabaseData: Could not apply organizationId filter to provided query.",
          e,
        );
      }
    }

    finalQuery.then(({ data, error }: { data: T | null; error: PostgrestError | null }) => {
      if (active) {
        setData(data);
        setError(error);
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [organizationId, ...dependencies]);

  return { data, loading, error };
}
