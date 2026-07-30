import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RegistryMember } from "@/components/InstitutionalRegistryModule";

export function useRegistryMembers(schoolId: string) {
  const [members, setMembers] = useState<RegistryMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMembers() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("registry_members")
          .select("*")
          .eq("org_id", schoolId);

        if (error) throw error;
        setMembers(data as RegistryMember[]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (schoolId) {
      fetchMembers();
    }
  }, [schoolId]);

  return { members, loading, error };
}
