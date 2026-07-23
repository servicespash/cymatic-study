import { useState, useEffect } from "react";

/**
 * Hook to detect if a URL is a live session (YouTube Live, Zoom, etc.)
 */
export function useLiveSession(url: string | null | undefined) {
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (!url) {
      setIsLive(false);
      return;
    }

    // Heuristics for live sessions
    const liveKeywords = ["/live", "youtube.com/live", "twitch.tv/", "zoom.us/j/"];
    const isLiveUrl = liveKeywords.some((keyword) => url.toLowerCase().includes(keyword));
    
    // Check for specific live indicators in query params if needed
    try {
      const urlObj = new URL(url);
      if (urlObj.searchParams.get("live") === "true") {
        setIsLive(true);
        return;
      }
    } catch (e) {
      // Not a valid URL, skip
    }

    setIsLive(isLiveUrl);
  }, [url]);

  return isLive;
}
