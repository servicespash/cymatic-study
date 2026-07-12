import { motion } from "framer-motion";

export function BreathingGuide() {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-zinc-900/80 rounded-2xl border border-zinc-800/80 shadow-xl">
      <h3 className="text-white font-semibold text-lg tracking-tight mb-8">Guided Breathing</h3>
      <div className="relative flex items-center justify-center w-32 h-32">
        <div className="absolute w-20 h-20 bg-cyan-500/20 rounded-full animate-breathe" />
        <div className="absolute w-16 h-16 bg-cyan-400 rounded-full" />
      </div>
      <p className="text-zinc-400 text-sm mt-8">Inhale... Exhale...</p>
    </div>
  );
}
