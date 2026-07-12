import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLiveBroadcast } from "@/lib/live-broadcast-context";
import { Link } from "@tanstack/react-router";
import { Minimize2, ExternalLink, X, MessageSquare } from "lucide-react";

/**
 * LivePulseIndicator: The 'Pro-Tier' entry point.
 * State 1: Minimized Pulsating Pill (Top-Left)
 * State 2: Badge Panel (Join Chat / Minimize)
 */
export const LivePulseIndicator = () => {
  const { activeBroadcast } = useLiveBroadcast();
  const [isOpen, setIsOpen] = useState(false);

  if (!activeBroadcast) return null;

  return (
    <div className="fixed top-20 left-4 z-[200]">
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.button
            key="pill"
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 bg-zinc-900/80 backdrop-blur-md border border-white/10 text-white px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap hover:bg-zinc-800 transition-colors"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest">LIVE</span>
          </motion.button>
        ) : (
          <motion.div
            key="panel"
            className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl w-72"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-white truncate">
                Live: {activeBroadcast.title}
              </span>
              <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white">
                <Minimize2 className="h-4 w-4" />
              </button>
            </div>
            <Link
              to="/news"
              search={{ id: activeBroadcast.id }}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-bold py-2.5 rounded-xl hover:opacity-90 transition-opacity"
              onClick={() => setIsOpen(false)}
            >
              <MessageSquare className="h-4 w-4" /> Join Live Chat{" "}
              <ExternalLink className="h-3 w-3" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
