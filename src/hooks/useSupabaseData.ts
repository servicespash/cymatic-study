import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';

export function useSupabaseData<T>(
  query: any,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    
    query
      .then(({ data, error }: { data: T | null; error: PostgrestError | null }) => {
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
