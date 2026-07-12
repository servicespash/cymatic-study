import { useEffect } from "react";
import { SupabaseClient } from "@supabase/supabase-js";
import { toast } from "sonner";

interface Payload {
  new?: Record<string, unknown>;
}

interface Refetchers {
  news: () => Promise<void>;
  lessons: () => Promise<void>;
  projects: () => Promise<void>;
  quizzes: () => Promise<void>;
}

export function attachNotificationHandler(supabase: SupabaseClient, refetchers: Refetchers) {
  const lessonsChannel = supabase
    .channel("notifications:lessons")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "lessons" },
      async (payload: Payload) => {
        const subject = (payload.new?.subject as string) ?? "Lesson";
        toast.success(`New ${subject} Lesson Added!`);
        await refetchers.lessons();
      },
    );

  const newsChannel = supabase
    .channel("notifications:news")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "news_broadcasts" },
      async (payload: Payload) => {
        const headline =
          (payload.new?.title as string) ?? (payload.new?.headline as string) ?? "Update";
        toast.info(`New Update: ${headline}`);
        await refetchers.news();
      },
    );

  const projectsChannel = supabase
    .channel("notifications:projects")
    .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, async () => {
      await refetchers.projects();
    });

  const quizzesChannel = supabase
    .channel("notifications:quizzes")
    .on("postgres_changes", { event: "*", schema: "public", table: "quizzes" }, async () => {
      await refetchers.quizzes();
    });

  lessonsChannel.subscribe();
  newsChannel.subscribe();
  projectsChannel.subscribe();
  quizzesChannel.subscribe();

  return () => {
    void supabase.removeChannel(lessonsChannel);
    void supabase.removeChannel(newsChannel);
    void supabase.removeChannel(projectsChannel);
    void supabase.removeChannel(quizzesChannel);
  };
}

export default function useNotifications(supabase: SupabaseClient, refetchers: Refetchers) {
  useEffect(() => {
    const cleanup = attachNotificationHandler(supabase, refetchers);
    return cleanup;
  }, [supabase, refetchers]);
}
