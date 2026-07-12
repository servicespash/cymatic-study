import React from "react";
import { motion } from "framer-motion";
import { useLiveBroadcast } from "@/lib/live-broadcast-context";

export const LiveBadge = () => {
  const { activeBroadcast } = useLiveBroadcast();
  if (!activeBroadcast) return null;

  return (
    <motion.button
      onClick={() => {
        const el = document.getElementById(activeBroadcast.id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }}
      className="fixed top-20 right-4 z-[100] flex items-center gap-2 bg-red-600/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full shadow-lg animate-pulse"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
    >
      <div className="h-2 w-2 rounded-full bg-white animate-ping" />
      <span className="text-xs font-bold uppercase tracking-widest">LIVE</span>
    </motion.button>
  );
};
