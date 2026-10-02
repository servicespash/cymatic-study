/**
 * Institutional Tenant School Context Binding
 * Pulls live school data, district parameters, and institutional term info from Supabase for real-time educational alignment.
 */

import { createClient } from "@supabase/supabase-js";

export interface TenantSchoolContext {
  schoolName: string;
  district: string;
  term: string;
  curriculumType: string;
}

export class TenantContextService {
  private static getClient() {
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
  }

  /**
   * Fetches tenant school details for an authenticated user.
   */
  static async fetchTenantContext(userId?: string): Promise<TenantSchoolContext> {
    const defaultContext: TenantSchoolContext = {
      schoolName: "National Secondary Institution (Uganda)",
      district: "Kampala",
      term: "Term 2, 2026",
      curriculumType: "NCDC Lower & Upper Secondary Curriculum",
    };

    if (!userId) return defaultContext;

    const supabase = TenantContextService.getClient();
    if (!supabase) return defaultContext;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("school_name, district, metadata")
        .eq("user_id", userId)
        .maybeSingle();

      if (!error && data) {
        return {
          schoolName: (data as any).school_name || defaultContext.schoolName,
          district: (data as any).district || defaultContext.district,
          term: (data as any).metadata?.term || defaultContext.term,
          curriculumType: defaultContext.curriculumType,
        };
      }
    } catch (err) {
      console.warn("[TenantContextService] Failed to fetch tenant school context:", err);
    }

    return defaultContext;
  }
}
