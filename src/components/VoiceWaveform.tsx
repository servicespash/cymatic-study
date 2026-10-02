import React from "react";
import { motion } from "framer-motion";

interface VoiceWaveformProps {
  isSpeaking: boolean;
  color?: string;
  count?: number;
}

/**
 * VoiceWaveform Component
 * A high-fidelity animated waveform that reacts to the 'speaking' state.
 * Uses framed-motion for smooth, organic movement.
 */
export const VoiceWaveform: React.FC<VoiceWaveformProps> = ({
  isSpeaking,
  color = "bg-primary",
  count = 12,
}) => {
  return (
    <div className="flex items-center justify-center gap-1 h-8 px-2 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className={`w-1 rounded-full ${color}`}
          initial={{ height: 4 }}
          animate={
            isSpeaking
              ? {
                  height: [4, 12, 24, 8, 20, 4][i % 6],
                  opacity: [0.4, 1, 0.6, 0.8][i % 4],
                }
              : { height: 4, opacity: 0.3 }
          }
          transition={
            isSpeaking
              ? {
                  duration: 0.6 + (i % 0.4),
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.05,
                }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
};
