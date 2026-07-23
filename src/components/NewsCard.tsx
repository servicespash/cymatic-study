import React, { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Share2,
  Clock,
  Play,
  Radio,
  AlertCircle,
  BookOpen,
  Bell,
  Bookmark,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommentSection } from "./CommentSection";
import { MiniAudioPlayer } from "./MiniAudioPlayer";
import { LiveBadge } from "./LiveBadge";
import { useLiveSession } from "@/hooks/useLiveSession";
import { cn } from "@/lib/utils";

interface NewsCardProps {
  item: {
    id: string;
    title: string;
    body: string;
    media_url: string | null;
    media_type: string | null;
    category: string | null;
    published_at: string;
    is_ad?: boolean;
    priority?: string;
    is_active?: boolean;
  };
}

export const NewsCard: React.FC<NewsCardProps> = ({ item }) => {
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const isPodcast = item.media_type === "audio" || item.media_type === "podcast" || item.category?.toLowerCase() === "podcast";
  const isVideo = item.media_type?.startsWith("video") || item.media_type === "video_podcast";
  const detectedLive = useLiveSession(item.media_url);
  const isLive = item.media_type === "live_session" || item.category?.toLowerCase() === "live" || detectedLive;

  const getCategoryIcon = (category: string | null) => {
    if (isLive) return <Radio className="h-3 w-3 animate-pulse text-red-500" />;
    switch (category?.toLowerCase()) {
      case "exams":
        return <AlertCircle className="h-3 w-3" />;
      case "curriculum":
        return <BookOpen className="h-3 w-3" />;
      default:
        return <Bell className="h-3 w-3" />;
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
          className="text-primary underline break-all"
        >
          {part}
        </a>
      ) : (
        <span key={i}>{part}</span>
      ),
    );
  };

  return (
    <motion.div
      layout
      className="bg-card dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group h-full"
    >
      {item.media_url && !isPodcast && (
        <div className="relative aspect-video overflow-hidden bg-black">
          {isVideo ? (
            <video
              src={item.media_url}
              controls
              className="w-full h-full object-contain"
              poster={item.media_url.replace(/\.[^/.]+$/, ".jpg")}
            />
          ) : (
            <img
              src={item.media_url}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          )}
          {isLive && (
            <LiveBadge className="absolute top-3 left-3 shadow-xl" />
          )}
        </div>
      )}

      {isPodcast && item.media_url && <MiniAudioPlayer src={item.media_url} title={item.title} />}

      <div className="p-5 flex-1 flex flex-col gap-3 min-h-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] uppercase font-bold tracking-tight gap-1.5 px-2 py-0.5",
                isLive ? "border-red-500/50 text-red-500 bg-red-500/5" : ""
              )}
            >
              {getCategoryIcon(item.category)}
              {isLive ? "Live Session" : (item.category || "General")}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-medium">
            <Clock className="h-3 w-3" />
            {new Date(item.published_at).toLocaleDateString()}
          </div>
        </div>

        <h3 className="text-lg font-black leading-tight group-hover:text-primary transition-colors line-clamp-2">
          {item.title}
        </h3>

        <div className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed whitespace-pre-wrap flex-1 overflow-hidden">
          {renderBody(item.body)}
        </div>

        <div className="mt-4 pt-4 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={cn(
                "flex items-center gap-1.5 text-xs font-bold transition-colors",
                isLiked ? "text-red-500" : "text-zinc-500 hover:text-primary",
              )}
            >
              <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
              Like
            </button>
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-primary transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              Comments
            </button>
            <button
              onClick={() => setIsBookmarked(!isBookmarked)}
              className={cn(
                "flex items-center gap-1.5 text-xs font-bold transition-colors",
                isBookmarked ? "text-primary" : "text-zinc-500 hover:text-primary",
              )}
            >
              <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />
              Bookmark
            </button>
          </div>
        </div>
      </div>

      {showComments && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <CommentSection contentId={item.id} />
        </div>
      )}
    </motion.div>
  );
};
