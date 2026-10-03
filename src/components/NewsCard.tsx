import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Share2,
  Clock,
  Radio,
  BookOpen,
  Bookmark,
  Heart,
  Volume2,
  ExternalLink,
  User,
  GraduationCap,
} from "lucide-react";
import { CommentSection } from "./CommentSection";
import { MiniAudioPlayer } from "./MiniAudioPlayer";
import { LiveBadge } from "./LiveBadge";
import { useLiveSession } from "@/hooks/useLiveSession";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { NewsBroadcastItem, parseNewsBody, resolveMediaDetails } from "@/lib/news-service";

interface NewsCardProps {
  item: NewsBroadcastItem;
}

export const NewsCard: React.FC<NewsCardProps> = ({ item }) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState<number>(item.likes_count || 0);

  const detectedLive = useLiveSession(item.media_url);
  const media = useMemo(
    () =>
      resolveMediaDetails({
        media_url: item.media_url,
        media_type: item.media_type,
        category: item.category,
        priority: item.priority,
        title: item.title,
      }),
    [item.media_url, item.media_type, item.category, item.priority, item.title],
  );

  const isLive = media.isLive || detectedLive;
  const parsedBody = useMemo(() => parseNewsBody(item.body), [item.body]);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    async function fetchUserInteractions() {
      try {
        const { data: interactionData } = await supabase
          .from("content_interactions")
          .select("is_liked, is_bookmarked")
          .eq("user_id", user!.id)
          .eq("content_id", item.id)
          .maybeSingle();

        if (interactionData && isMounted) {
          setIsLiked(!!interactionData.is_liked);
          setIsBookmarked(!!interactionData.is_bookmarked);
        }
      } catch (err) {
        console.warn("Could not fetch user interactions:", err);
      }
    }
    fetchUserInteractions();
    return () => {
      isMounted = false;
    };
  }, [user, item.id]);

  const handleLike = async () => {
    if (!user) {
      toast.info("Please sign in to like broadcasts.");
      return;
    }

    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikeCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

    try {
      await supabase.from("content_interactions").upsert(
        {
          user_id: user.id,
          content_id: item.id,
          is_liked: nextLiked,
          is_bookmarked: isBookmarked,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,content_id" },
      );
      toast.success(nextLiked ? "Broadcast liked!" : "Like removed");
    } catch (err) {
      console.warn("Failed to update like in DB:", err);
      setIsLiked(!nextLiked);
      setLikeCount((prev) => (!nextLiked ? prev + 1 : Math.max(0, prev - 1)));
      toast.error("Failed to update like interaction.");
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      toast.info("Please sign in to bookmark broadcasts.");
      return;
    }

    const nextBookmarked = !isBookmarked;
    setIsBookmarked(nextBookmarked);

    try {
      await supabase.from("content_interactions").upsert(
        {
          user_id: user.id,
          content_id: item.id,
          is_liked: isLiked,
          is_bookmarked: nextBookmarked,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,content_id" },
      );
      toast.success(nextBookmarked ? "Broadcast bookmarked!" : "Bookmark removed");
    } catch (err) {
      console.warn("Failed to update bookmark in DB:", err);
      setIsBookmarked(!nextBookmarked);
      toast.error("Failed to update bookmark.");
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: parsedBody.text.slice(0, 120),
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(`${item.title}\n${shareUrl}`);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Unable to copy link.");
    }
  };

  const renderBody = (text: string) => {
    if (!text) return null;
    const urlRe = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRe).map((part, i) =>
      urlRe.test(part) ? (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 break-all inline-flex items-center gap-0.5"
        >
          <span>{part}</span>
          <ExternalLink className="h-3 w-3 inline shrink-0 opacity-70" />
        </a>
      ) : (
        <span key={i}>{part}</span>
      ),
    );
  };

  const formattedDate = useMemo(() => {
    try {
      return new Date(item.published_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Recent";
    }
  }, [item.published_at]);

  const displayCategory =
    item.category?.trim() || (item.is_curriculum_update ? "Curriculum" : "General");

  return (
    <motion.article
      layout
      className="bg-card dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-zinc-700/80 transition-all flex flex-col group max-w-full min-w-0"
    >
      {/* Media Presentation Container */}
      {media.hasMedia && (
        <div className="relative w-full aspect-video bg-black overflow-hidden flex items-center justify-center">
          {/* YouTube or Vimeo iframe embed */}
          {media.youtubeEmbedUrl ? (
            <iframe
              src={media.youtubeEmbedUrl}
              title={item.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
            />
          ) : media.isVideoFile ? (
            <video
              src={media.url}
              controls
              playsInline
              preload="metadata"
              className="w-full h-full object-contain"
            />
          ) : media.isAudio ? (
            <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-3 text-cyan-400">
                <Volume2 className="h-6 w-6" />
              </div>
              <p className="text-xs font-semibold text-zinc-300 max-w-md line-clamp-1">
                {item.title}
              </p>
              <div className="w-full max-w-md mt-2">
                <MiniAudioPlayer src={media.url} title={item.title} />
              </div>
            </div>
          ) : media.isImage ? (
            <img
              src={media.url}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                // If image fails, hide or fallback gracefully
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <iframe
              src={media.url}
              title={item.title}
              className="w-full h-full border-0"
              allowFullScreen
              loading="lazy"
            />
          )}

          {/* Live indicator overlay */}
          {isLive && (
            <div className="absolute top-3 left-3 z-10">
              <LiveBadge showIcon />
            </div>
          )}
        </div>
      )}

      {/* Standalone Audio Player when no video frame */}
      {!media.hasMedia && media.isAudio && (
        <div className="p-4 bg-zinc-950/60 border-b border-zinc-800">
          <MiniAudioPlayer src={media.url} title={item.title} />
        </div>
      )}

      {/* Card Content Area */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-4 min-h-0 min-w-0">
        <div>
          {/* Unboxed Metadata Kicker (Zero-Pill Compliance) */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400 mb-2.5">
            {isLive ? (
              <span className="inline-flex items-center gap-1 font-bold text-red-500 uppercase tracking-wider text-[11px]">
                <Radio className="h-3 w-3 animate-pulse" />
                Live Broadcast
              </span>
            ) : (
              <span className="font-semibold text-zinc-700 dark:text-zinc-300 capitalize">
                {displayCategory}
              </span>
            )}

            <span aria-hidden="true" className="text-zinc-600">
              ·
            </span>

            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3 shrink-0" />
              <time dateTime={item.published_at}>{formattedDate}</time>
            </span>

            {item.is_curriculum_update && (
              <>
                <span aria-hidden="true" className="text-zinc-600">
                  ·
                </span>
                <span className="text-cyan-400 font-medium">NCDC Official</span>
              </>
            )}

            {parsedBody.duration && (
              <>
                <span aria-hidden="true" className="text-zinc-600">
                  ·
                </span>
                <span>{parsedBody.duration}</span>
              </>
            )}
          </div>

          {/* Main Title */}
          <h3 className="text-lg sm:text-xl font-bold leading-snug text-zinc-900 dark:text-zinc-100 group-hover:text-cyan-400 transition-colors break-words">
            {item.title}
          </h3>

          {/* Structured Speaker / Subject Meta (if parsed from body JSON) */}
          {(parsedBody.speaker || parsedBody.instructor || parsedBody.subject) && (
            <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-zinc-400 border-l-2 border-cyan-500/40 pl-2.5 py-0.5">
              {(parsedBody.speaker || parsedBody.instructor) && (
                <div className="inline-flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="text-zinc-300 font-medium">
                    {parsedBody.speaker || parsedBody.instructor}
                  </span>
                </div>
              )}
              {parsedBody.subject && (
                <div className="inline-flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5 text-zinc-400" />
                  <span>{parsedBody.subject}</span>
                </div>
              )}
            </div>
          )}

          {/* Body Narrative */}
          <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-300/90 leading-relaxed whitespace-pre-line break-words line-clamp-4">
            {renderBody(parsedBody.text)}
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleLike}
              className={cn(
                "inline-flex items-center gap-1.5 font-medium transition-colors py-1 cursor-pointer",
                isLiked
                  ? "text-red-500"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200",
              )}
              aria-label={isLiked ? "Unlike broadcast" : "Like broadcast"}
            >
              <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
              <span>{likeCount > 0 ? likeCount : "Like"}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowComments(!showComments)}
              className={cn(
                "inline-flex items-center gap-1.5 font-medium transition-colors py-1 cursor-pointer",
                showComments
                  ? "text-cyan-400"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200",
              )}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Comments</span>
            </button>

            <button
              type="button"
              onClick={handleBookmark}
              className={cn(
                "inline-flex items-center gap-1.5 font-medium transition-colors py-1 cursor-pointer",
                isBookmarked
                  ? "text-cyan-400"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200",
              )}
              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark broadcast"}
            >
              <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />
              <span className="hidden sm:inline">Bookmark</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleShare}
            className="text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Share broadcast"
            aria-label="Share broadcast"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Expandable Comment Section */}
      {showComments && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/70 p-4 sm:p-5">
          <CommentSection contentId={item.id} />
        </div>
      )}
    </motion.article>
  );
};

export default NewsCard;
