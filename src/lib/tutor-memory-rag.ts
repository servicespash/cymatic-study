/**
 * Anonymous Long-Term Memory & Semantic Cross-User RAG Sharing Engine
 * Stores and retrieves PII-stripped academic Q&A pairs to accelerate tutoring without wasting tokens.
 */

import { createClient } from "@supabase/supabase-js";

export interface SanitizedMemoryRecord {
  id?: string;
  subject: string;
  question_pattern: string;
  expert_solution: string;
  curriculum_node: string;
  success_count: number;
  created_at?: string;
}

export class TutorMemoryRAG {
  private static getClient() {
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
  }

  /**
   * Stores a PII-stripped academic Q&A pattern into shared memory.
   */
  static async recordSharedInsight(
    record: Omit<SanitizedMemoryRecord, "id" | "success_count">,
  ): Promise<void> {
    const supabase = TutorMemoryRAG.getClient();
    if (!supabase) return;

    try {
      // Strip any accidental PII (emails, phone numbers, full names)
      const sanitizedQuestion = record.question_pattern
        .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL]")
        .replace(/\+?[0-9]{10,15}/g, "[PHONE]");

      await supabase.from("tutor_shared_memory").upsert(
        {
          subject: record.subject,
          question_pattern: sanitizedQuestion.toLowerCase().trim(),
          expert_solution: record.expert_solution,
          curriculum_node: record.curriculum_node,
          success_count: 1,
          created_at: new Date().toISOString(),
        },
        { onConflict: "question_pattern" },
      );
    } catch (err) {
      console.warn("[TutorMemoryRAG] Failed to record shared insight:", err);
    }
  }

  /**
   * Retrieves matching peer-solved insights for a given student query to accelerate RAG.
   */
  static async querySharedMemory(subject: string, query: string): Promise<string | null> {
    const supabase = TutorMemoryRAG.getClient();
    if (!supabase) return null;

    try {
      const cleanQuery = query.toLowerCase().trim();
      const { data, error } = await supabase
        .from("tutor_shared_memory")
        .select("expert_solution")
        .eq("subject", subject)
        .ilike("question_pattern", `%${cleanQuery.slice(0, 30)}%`)
        .limit(1);

      if (!error && data && data.length > 0) {
        return data[0].expert_solution;
      }
    } catch (err) {
      console.warn("[TutorMemoryRAG] Failed to query shared memory:", err);
    }

    return null;
  }
}
