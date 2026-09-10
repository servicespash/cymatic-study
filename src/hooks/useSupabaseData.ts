import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PostgrestError } from "@supabase/supabase-js";

export function useSupabaseData<T>(
  query: any,
  dependencies: any[] = [],
  organizationId?: string | null,
) {
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
          finalQuery = query.eq("organization_id", organizationId);
        }
      } catch (e) {
        console.warn("useSupabaseData: Could not apply organizationId filter to provided query.", e);
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
  }, dependencies);

  return { data, loading, error };
}
