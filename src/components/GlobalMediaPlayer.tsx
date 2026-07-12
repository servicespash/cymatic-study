import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLiveBroadcast, Broadcast } from "@/lib/live-broadcast-context";
import { Button } from "@/components/ui/button";
import { Play, Pause, FileText, X, Minimize2 } from "lucide-react";

// Helper to determine media type
const getProvider = (url: string) => {
  if (!url) return "none";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("vimeo.com")) return "vimeo";
  if (url.includes("twitch.tv")) return "twitch";
  return "direct";
};

const CustomVideoControls = ({
  videoRef,
  isLive,
}: {
  videoRef: React.RefObject<HTMLVideoElement>;
  isLive: boolean;
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const changeSpeed = () => {
    const newSpeed = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    setSpeed(newSpeed);
    if (videoRef.current) videoRef.current.playbackRate = newSpeed;
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex items-center gap-2">
      <Button size="sm" variant="ghost" onClick={togglePlay}>
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      <Button size="sm" variant="ghost" onClick={changeSpeed} className="text-xs">
        {speed}x
      </Button>
      {isLive && <span className="ml-auto text-xs font-bold text-red-500 animate-pulse">LIVE</span>}
    </div>
  );
};

const MediaRenderer = ({ broadcast, isLive }: { broadcast: Broadcast; isLive: boolean }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const provider = getProvider(broadcast.media_url);

  if (provider === "youtube") {
    const id = broadcast.media_url.split("/").pop()?.split("?v=").pop()?.split("&")[0];
    return (
      <iframe
        src={`https://www.youtube.com/embed/${id}`}
        className="w-full aspect-video"
        allowFullScreen
      />
    );
  }

  if (provider === "vimeo") {
    const id = broadcast.media_url.split("/").pop();
    return (
      <iframe
        src={`https://player.vimeo.com/video/${id}`}
        className="w-full aspect-video"
        allowFullScreen
      />
    );
  }

  // Direct video with custom controls
  return (
    <div className="relative group w-full aspect-video bg-zinc-900 rounded-lg overflow-hidden">
      <video ref={videoRef} src={broadcast.media_url} className="w-full h-full object-contain" />
      <CustomVideoControls videoRef={videoRef} isLive={isLive} />
    </div>
  );
};

export const GlobalMediaPlayer = React.memo(() => {
  const { activeBroadcast, selectedBroadcast, selectBroadcast } = useLiveBroadcast();
  const [isMinimized, setIsMinimized] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  const currentMedia = selectedBroadcast || activeBroadcast;
  const isLiveMode = !!activeBroadcast && !selectedBroadcast;

  if (!currentMedia) return null;

  return (
    <AnimatePresence>
      {isMinimized ? (
        <motion.button
          key="pill"
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-4 right-4 z-[200] bg-red-600/90 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-pulse"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
        >
          <div className="h-2 w-2 rounded-full bg-white animate-ping" />
          <span className="text-xs font-bold uppercase">{isLiveMode ? "LIVE" : "PODCAST"}</span>
        </motion.button>
      ) : (
        <motion.div
          key="player"
          className="fixed top-0 left-0 w-full z-[200] bg-zinc-950 p-4 border-b border-zinc-800 shadow-2xl"
          initial={{ y: -200 }}
          animate={{ y: 0 }}
          exit={{ y: -200 }}
        >
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-bold text-white">{currentMedia.title}</h2>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowTranscript(!showTranscript)}
                >
                  <FileText className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsMinimized(true)}>
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => selectBroadcast(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="relative">
              <MediaRenderer broadcast={currentMedia} isLive={isLiveMode} />

              {showTranscript && (
                <div className="absolute inset-0 bg-zinc-950/95 p-6 overflow-y-auto text-sm text-zinc-300 z-10">
                  <h3 className="font-bold text-white mb-2">Transcript</h3>
                  <p>{currentMedia.body || "No transcript available."}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

GlobalMediaPlayer.displayName = "GlobalMediaPlayer";
