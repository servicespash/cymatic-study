import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ThumbsUp,
  ThumbsDown,
  Share2,
  Bookmark,
  Download,
  Bell,
  BellOff,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Define a type for the media item
export interface MediaItem {
  id: string;
  title?: string;
  media_url?: string;
  media_provider?: "youtube" | "vimeo" | "dailymotion" | "twitch" | string;
}

const getDomain = (url: string) => {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace("www.", "").split(".")[0];
  } catch {
    return "unknown";
  }
};

const UniversalMediaHandler = ({ item }: { item: MediaItem }) => {
  if (!item?.media_url) return null;

  const provider = item.media_provider || getDomain(item.media_url);
  const dynamicOrigin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || "https://lattys-cymatic-hub.com";

  const renderContent = () => {
    switch (provider) {
      case "youtube": {
        const youtubeId = item.media_url.split("/").pop()?.split("?v=").pop()?.split("&")[0];
        return (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            className="absolute inset-0 w-full h-full"
            allowFullScreen
          />
        );
      }
      case "vimeo": {
        const vimeoId = item.media_url.split("/").pop();
        return (
          <iframe
            src={`https://player.vimeo.com/video/${vimeoId}`}
            className="absolute inset-0 w-full h-full"
            allowFullScreen
          />
        );
      }
      case "dailymotion": {
        const dmId = item.media_url.split("/").pop();
        return (
          <iframe
            src={`https://www.dailymotion.com/embed/video/${dmId}`}
            className="absolute inset-0 w-full h-full"
            allowFullScreen
          />
        );
      }
      case "twitch": {
        const twitchChannel = item.media_url.split("/").pop();
        return (
          <iframe
            src={`https://player.twitch.tv/?channel=${twitchChannel}&parent=${new URL(dynamicOrigin).hostname}`}
            className="absolute inset-0 w-full h-full"
            allowFullScreen
          />
        );
      }
      default:
        return (
          <video
            src={item.media_url}
            controls
            className="absolute inset-0 w-full h-full object-cover"
          />
        );
    }
  };

  return (
    <div className="relative w-full pt-[56.25%] bg-zinc-900 rounded-lg overflow-hidden">
      {renderContent()}
    </div>
  );
};

export interface ReactionCounts {
  like: number;
  dislike: number;
}

export const InteractionPodium = ({
  item,
  itemId,
  categoryId,
  initialReaction,
  initialCounts,
  isSubscribedToCategory,
}: {
  item: MediaItem;
  itemId: string;
  categoryId: string;
  initialReaction: "like" | "dislike" | null;
  initialCounts: ReactionCounts;
  isSubscribedToCategory: boolean;
}) => {
  const { user, profile } = useAuth();
  const [reaction, setReaction] = useState<"like" | "dislike" | null>(initialReaction);
  const [counts, setCounts] = useState<ReactionCounts>(initialCounts);
  const [isSubscribed, setIsSubscribed] = useState(isSubscribedToCategory);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loadingState, setLoadingState] = useState<Record<string, boolean>>({});

  const setLoading = (key: string, loading: boolean) =>
    setLoadingState((prev) => ({ ...prev, [key]: loading }));

  const checkAuth = () => {
    if (!user) {
      toast.info("Please sign in to continue");
      return false;
    }
    return true;
  };

  const handleReaction = async (type: "like" | "dislike") => {
    if (!checkAuth()) return;
    const previous = { reaction, counts };
    const newReaction = type === reaction ? null : type;
    setReaction(newReaction);
    setCounts((prev) => ({
      ...prev,
      [type]: prev[type] + (type === reaction ? -1 : 1),
      ...(reaction && reaction !== type
        ? {
            [reaction as "like" | "dislike"]: prev[reaction as "like" | "dislike"] - 1,
          }
        : {}),
    }));
    try {
      if (type === reaction)
        await supabase.from("reactions").delete().eq("user_id", user!.id).eq("content_id", itemId);
      else
        await supabase
          .from("reactions")
          .upsert({ user_id: user!.id, content_id: itemId, reaction: type });
    } catch (err: unknown) {
      setReaction(previous.reaction);
      setCounts(previous.counts);
      toast.error("Failed to update reaction");
    }
  };

  const handleSubscription = async () => {
    if (!checkAuth()) return;
    const previousState = isSubscribed;
    setIsSubscribed(!previousState);
    setLoading("sub", true);
    try {
      if (previousState)
        await supabase
          .from("user_subscriptions")
          .delete()
          .eq("user_id", user!.id)
          .eq("category_id", categoryId);
      else
        await supabase
          .from("user_subscriptions")
          .insert({ user_id: user!.id, category_id: categoryId });
      toast.success(previousState ? "Unsubscribed" : "Subscribed");
    } catch {
      setIsSubscribed(previousState);
      toast.error("Subscription failed");
    } finally {
      setLoading("sub", false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const baseUrl =
      import.meta.env.VITE_SITE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "https://lattys-cymatic-hub.com");
    const shareUrl = `${baseUrl}/news?id=${itemId}`;
    const shareData = {
      title: item?.title || "Update",
      text: `${item?.title || "Update"} - Latty's Cymatic Hub`,
      url: shareUrl,
    };
    try {
      if (navigator.share && navigator.canShare(shareData)) await navigator.share(shareData);
      else await navigator.clipboard.writeText(`${shareData.text}\n${shareUrl}`);
      toast.success("Shared successfully");
      await supabase
        .from("engagement_logs")
        .insert({ user_id: user?.id, content_id: itemId, action: "share" });
    } catch (err: unknown) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        toast.error("Could not share");
      }
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!checkAuth()) return;
    setLoading("bookmark", true);
    const prevState = isBookmarked;
    setIsBookmarked(!prevState);
    try {
      if (prevState)
        await supabase
          .from("user_bookmarks")
          .delete()
          .eq("user_id", user!.id)
          .eq("content_id", itemId);
      else await supabase.from("user_bookmarks").insert({ user_id: user!.id, content_id: itemId });
      toast.success(prevState ? "Bookmark removed" : "Bookmarked!");
    } catch {
      setIsBookmarked(prevState);
      toast.error("Failed to update bookmark");
    } finally {
      setLoading("bookmark", false);
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item?.media_url) {
      toast.error("No media available");
      return;
    }
    window.open(item.media_url, "_blank");
    toast.info("Opening media in new tab...");
  };

  return (
    <div className="relative z-[100] pointer-events-auto flex flex-col gap-4 p-4 border-t border-zinc-800/50 bg-zinc-950/50">
      <UniversalMediaHandler item={item} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleReaction("like");
            }}
            className={cn(reaction === "like" && "text-primary")}
          >
            <ThumbsUp className="h-4 w-4 mr-1" /> {counts.like}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleReaction("dislike");
            }}
            className={cn(reaction === "dislike" && "text-red-500")}
          >
            <ThumbsDown className="h-4 w-4 mr-1" /> {counts.dislike}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleSubscription();
            }}
            disabled={loadingState["sub"]}
          >
            {loadingState["sub"] ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSubscribed ? (
              <Bell className="h-4 w-4" />
            ) : (
              <BellOff className="h-4 w-4" />
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBookmark}
            disabled={loadingState["bookmark"]}
          >
            {loadingState["bookmark"] ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-primary")} />
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={profile?.avatar_url} />
          <AvatarFallback>{profile?.display_name?.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <Input
          className="rounded-full bg-zinc-900 border-zinc-800 focus:border-primary"
          placeholder="Add a comment..."
        />
      </div>
    </div>
  );
};
