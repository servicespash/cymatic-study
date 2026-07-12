import { db } from "../lib/offline-db";
import { supabase } from "@/integrations/supabase/client";
import { type QuizQuestion } from "@/data/quizzes";

export const QuizRepository = {
  async getQuestionsByTopic(topicId: string): Promise<QuizQuestion[]> {
    // 1. Get from local cache (synchronous/immediate return)
    const cached = await db.quizQuestions.where("topicId").equals(topicId).toArray();

    // 2. Fire-and-forget background update (revalidate)
    this.revalidate(topicId).catch((err) =>
      console.error(`Background revalidation failed for topic ${topicId}:`, err),
    );

    // 3. Return cached immediately, or fetch if empty
    if (cached.length > 0) {
      return cached;
    }

    // Wait for the fetch if we have absolutely no cache
    return await this.revalidate(topicId);
  },

  async revalidate(topicId: string): Promise<QuizQuestion[]> {
    const { data, error } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("topic_id", topicId);

    if (error) throw error;

    const questions: QuizQuestion[] = data.map((q) => ({
      id: q.id,
      topicId: q.topic_id,
      question: q.question,
      options: q.options,
      correctIndex: q.correct_index,
      explanation: q.explanation || undefined,
    }));

    // Update local cache
    await db.quizQuestions.bulkPut(questions);

    return questions;
  },
};
