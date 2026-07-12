import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

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
    <div className="p-4 flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2">
        <MessageCircle className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
          Student Discussion
        </h4>
      </div>

      {user ? (
        <form onSubmit={handleSubmit} className="flex gap-3 items-start">
          <Avatar className="h-8 w-8 border border-zinc-200 dark:border-zinc-800">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 flex flex-col gap-2">
            <Textarea
              placeholder="Add to the conversation..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px] bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 focus:ring-primary/20"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={!newComment.trim() || submitting}
                className="font-bold gap-2"
              >
                {submitting ? "..." : <Send className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4 text-center">
          <p className="text-xs text-zinc-500 font-medium">
            Please sign in to join the discussion.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4 mt-2">
        {loading ? null : comments.length === 0 ? null : (
          <AnimatePresence initial={false}>
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 group"
              >
                <Avatar className="h-8 w-8 border border-zinc-100 dark:border-zinc-800">
                  <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                  <AvatarFallback>{comment.profiles?.display_name?.[0] || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {comment.profiles?.display_name || "Anonymous Student"}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
