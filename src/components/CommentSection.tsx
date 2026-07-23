import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface CommentSectionProps {
  contentId: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ contentId }) => {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();

    // Subscribe to new comments
    const channel = supabase
      .channel(`comments-${contentId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "content_comments",
          filter: `content_id=eq.${contentId}`,
        },
        () => {
          fetchComments();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [contentId]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("content_comments")
        .select("*, profiles(display_name, avatar_url)")
        .eq("content_id", contentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComments((data as unknown as Comment[]) || []);
    } catch (err: unknown) {
      console.warn("Error fetching comments:", err);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim() || submitting) return;

    const optimisticComment: Comment = {
      id: `temp-${Date.now()}`,
      user_id: user.id,
      content: newComment.trim(),
      created_at: new Date().toISOString(),
      profiles: {
        display_name: profile?.display_name || "You",
        avatar_url: profile?.avatar_url || null,
      },
    };

    setComments((prev) => [optimisticComment, ...prev]);
    const commentText = newComment.trim();
    setNewComment("");
    setSubmitting(true);

    try {
      const { error } = await supabase.from("content_comments").insert({
        content_id: contentId,
        user_id: user.id,
        content: commentText,
      });

      if (error) throw error;
    } catch (err: unknown) {
      console.warn("Failed to post comment:", err);
      setComments((prev) => prev.filter((c) => c.id !== optimisticComment.id));
      toast.error("Failed to post comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden">
      <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-black uppercase tracking-[0.15em] text-zinc-500">
            Student Discussion
          </h4>
        </div>
        <div className="text-[10px] font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
          {comments.length} Thoughts
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
              <MessageCircle className="h-6 w-6 text-zinc-300" />
            </div>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
              Be the first to share your thoughts
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4 group"
              >
                <Avatar className="h-9 w-9 shrink-0 border-2 border-white dark:border-zinc-800 shadow-sm">
                  <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {comment.profiles?.display_name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                      {comment.profiles?.display_name || "Anonymous Student"}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-bold">
                      {new Date(comment.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl rounded-tl-none p-3 border border-zinc-100 dark:border-zinc-800/50">
                    <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30">
        {user ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="relative group">
              <Textarea
                placeholder="Add to the conversation..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[100px] w-full resize-none bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:ring-primary/20 rounded-2xl p-4 text-sm transition-all"
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-3">
                <span className={cn(
                  "text-[10px] font-black transition-colors",
                  newComment.length > 400 ? "text-red-500" : "text-zinc-400"
                )}>
                  {newComment.length}/500
                </span>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newComment.trim() || submitting || newComment.length > 500}
                  className="rounded-xl font-black gap-2 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                  {submitting ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Post
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-4 text-center border border-dashed border-zinc-300 dark:border-zinc-700">
            <p className="text-xs text-zinc-500 font-black uppercase tracking-[0.1em]">
              Sign in to join the discussion
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
