import { supabase } from "@/integrations/supabase/client";

export interface DataServiceOptions {
  forceRefresh?: boolean;
}

export interface NewsBroadcastRecord {
  id: string;
  title: string;
  body?: string;
  media_url?: string | null;
  media_type?: string | null;
  category?: string | null;
  published_at?: string;
  media_provider?: string;
  priority?: string;
  is_active?: boolean;
}

export interface TeacherProfileRecord {
  id: string;
  user_id?: string;
  full_name?: string;
  subject_specialty?: string;
  email?: string;
  avatar_url?: string;
  created_at?: string;
}

export interface StudentRecord {
  id: string;
  user_id?: string;
  full_name?: string;
  grade_level?: string;
  school_id?: string;
  created_at?: string;
}

/**
 * Robust DataService utility providing unified, typed Supabase fetchers
 * and mutators for news_broadcasts, teacher_profiles, student_records, and generic entities.
 */
export class DataService {
  /**
   * Generic fetcher for any table with optional sorting and selection
   */
  static async fetchTable<T>(
    tableName: string,
    selectQuery = "*",
    orderBy?: { column: string; ascending?: boolean },
  ): Promise<{ data: T[] | null; error: any }> {
    try {
      let query = supabase.from(tableName).select(selectQuery);
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false });
      }
      const { data, error } = await query;
      if (error) {
        console.warn(`DataService fetchTable error on [${tableName}]:`, error.message);
        return { data: null, error };
      }
      return { data: (data as T[]) || [], error: null };
    } catch (err) {
      console.error(`DataService fetchTable exception on [${tableName}]:`, err);
      return { data: null, error: err };
    }
  }

  /**
   * Fetch news_broadcasts with sorting by published_at
   */
  static async fetchNewsBroadcasts(_options?: DataServiceOptions): Promise<{ data: NewsBroadcastRecord[]; error: any }> {
    const { data, error } = await this.fetchTable<NewsBroadcastRecord>("news_broadcasts", "*", {
      column: "published_at",
      ascending: false,
    });
    return { data: data || [], error };
  }

  /**
   * Fetch teacher_profiles with fallback to profiles table filtering by role 'teacher'
   */
  static async fetchTeacherProfiles(): Promise<{ data: TeacherProfileRecord[]; error: any }> {
    const { data, error } = await this.fetchTable<TeacherProfileRecord>("teacher_profiles", "*");
    if (!error && data && data.length > 0) {
      return { data, error: null };
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "teacher");

    return {
      data: (profileData || []).map((p: any) => ({
        id: p.id || p.user_id,
        user_id: p.user_id || p.id,
        full_name: p.full_name || p.username || "Teacher",
        subject_specialty: p.subject_specialty || "General",
        email: p.email || "",
        avatar_url: p.avatar_url || "",
        created_at: p.created_at,
      })),
      error: profileError,
    };
  }

  /**
   * Fetch student_records with fallback to profiles table filtering by role 'student'
   */
  static async fetchStudentRecords(): Promise<{ data: StudentRecord[]; error: any }> {
    const { data, error } = await this.fetchTable<StudentRecord>("student_records", "*");
    if (!error && data && data.length > 0) {
      return { data, error: null };
    }

    const { data: studentProfiles, error: studentError } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "student");

    return {
      data: (studentProfiles || []).map((p: any) => ({
        id: p.id || p.user_id,
        user_id: p.user_id || p.id,
        full_name: p.full_name || p.username || "Student",
        grade_level: p.grade_level || "S1",
        school_id: p.school_id || "",
        created_at: p.created_at,
      })),
      error: studentError,
    };
  }

  /**
   * Generic upsert helper for database records
   */
  static async upsertRecord<T>(tableName: string, record: Partial<T>, onConflict?: string) {
    try {
      const query = supabase.from(tableName).upsert(record as any, onConflict ? { onConflict } : undefined);
      const { data, error } = await query.select();
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error(`DataService upsert error on [${tableName}]:`, err);
      return { data: null, error: err };
    }
  }

  /**
   * Generic delete helper for database records
   */
  static async deleteRecord(tableName: string, matchColumn: string, matchValue: any) {
    try {
      const { error } = await supabase.from(tableName).delete().eq(matchColumn, matchValue);
      if (error) throw error;
      return { error: null };
    } catch (err) {
      console.error(`DataService delete error on [${tableName}]:`, err);
      return { error: err };
    }
  }
}

export default DataService;
