import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Droplets,
  Sparkles,
  CheckCircle2,
  FastForward,
} from "lucide-react";

export type BreathingPhase = "idle" | "inhale" | "hold" | "exhale" | "water" | "completed";

interface BreathingGuideProps {
  onComplete?: () => void;
  className?: string;
  autoStart?: boolean;
}

const PHASE_CONFIG: Record<
  BreathingPhase,
  {
    name: string;
    duration: number; // in seconds
    instruction: string;
    subtext: string;
    color: string;
    lungGlow: string;
    chestScale: number;
  }
> = {
  idle: {
    name: "4-7-8 Relaxing Breath",
    duration: 0,
    instruction: "Find a comfortable seated posture. Rest your hands gently on your lap.",
    subtext: "Press Start to begin your restorative breathing cycle.",
    color: "from-blue-500 to-indigo-600",
    lungGlow: "#06b6d4",
    chestScale: 1.0,
  },
  inhale: {
    name: "Inhale Slowly (Nose)",
    duration: 4,
    instruction: "Breathe in quietly and deeply through your nose for 4 seconds...",
    subtext: "Feel your diaphragm expand and oxygen circulate into your lungs.",
    color: "from-cyan-500 to-blue-600",
    lungGlow: "#38bdf8",
    chestScale: 1.25,
  },
  hold: {
    name: "Hold Your Breath",
    duration: 7,
    instruction: "Keep your breath steady and calm for 7 seconds. Do not strain...",
    subtext: "Allow oxygen to saturate your bloodstream and relax your nervous system.",
    color: "from-indigo-500 to-purple-600",
    lungGlow: "#818cf8",
    chestScale: 1.25,
  },
  exhale: {
    name: "Exhale Completely (Mouth)",
    duration: 8,
    instruction:
      "Make a gentle whoosh sound, exhaling completely through your mouth for 8 seconds...",
    subtext: "Release all tension, screen fatigue, and cognitive load.",
    color: "from-emerald-500 to-teal-600",
    lungGlow: "#34d399",
    chestScale: 0.95,
  },
  water: {
    name: "Sip Water & Rehydrate",
    duration: 15,
    instruction: "Take slow, deliberate sips of water over the next 15 seconds.",
    subtext: "Water restores cerebral blood flow and replenishes cognitive energy.",
    color: "from-sky-500 to-cyan-600",
    lungGlow: "#38bdf8",
    chestScale: 1.0,
  },
  completed: {
    name: "Session Complete",
    duration: 0,
    instruction: "Wonderful job! Your mind and body are centered and refreshed.",
    subtext: "Ready to conquer your next study session or creative challenge.",
    color: "from-primary to-accent",
    lungGlow: "#06b6d4",
    chestScale: 1.0,
  },
};

export function BreathingGuide({
  onComplete,
  className = "",
  autoStart = false,
}: BreathingGuideProps) {
  const [phase, setPhase] = useState<BreathingPhase>(autoStart ? "inhale" : "idle");
  const [secondsRemaining, setSecondsRemaining] = useState<number>(autoStart ? 4 : 0);
  const [cycleCount, setCycleCount] = useState<number>(1);
  const totalCycles = 2; // 2 complete 4-7-8 cycles before 15s water sip
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play subtle calming tone on phase change
  const playChime = (freq = 440) => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.85);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  };

  // Main timer loop
  useEffect(() => {
    if (phase === "idle" || phase === "completed" || isPaused) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Advance phase
          handlePhaseTransition();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, isPaused, cycleCount]);

  const handlePhaseTransition = () => {
    if (phase === "inhale") {
      playChime(520);
      setPhase("hold");
      setSecondsRemaining(7);
    } else if (phase === "hold") {
      playChime(390);
      setPhase("exhale");
      setSecondsRemaining(8);
    } else if (phase === "exhale") {
      if (cycleCount < totalCycles) {
        playChime(440);
        setCycleCount((c) => c + 1);
        setPhase("inhale");
        setSecondsRemaining(4);
      } else {
        // Transition to 15s water hydration sequence
        playChime(580);
        setPhase("water");
        setSecondsRemaining(15);
      }
    } else if (phase === "water") {
      playChime(660);
      setPhase("completed");
      if (onComplete) onComplete();
    }
  };

  const handleStart = () => {
    setIsPaused(false);
    setCycleCount(1);
    setPhase("inhale");
    setSecondsRemaining(4);
    playChime(440);
  };

  const handlePauseResume = () => {
    setIsPaused((p) => !p);
  };

  const handleReset = () => {
    setIsPaused(false);
    setPhase("idle");
    setCycleCount(1);
    setSecondsRemaining(0);
  };

  const handleSkipToWater = () => {
    setIsPaused(false);
    setPhase("water");
    setSecondsRemaining(15);
    playChime(580);
  };

  const currentInfo = PHASE_CONFIG[phase];
  const maxDuration = currentInfo.duration || 1;
  const progressPct =
    phase === "idle"
      ? 0
      : phase === "completed"
        ? 100
        : Math.round(((maxDuration - secondsRemaining) / maxDuration) * 100);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-card/95 via-card/85 to-background p-6 sm:p-8 shadow-2xl backdrop-blur-xl ${className}`}
    >
      {/* Top Header & Sound Toggle */}
      <div className="flex items-center justify-between border-b border-border/50 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black tracking-tight text-foreground">
              4-7-8 Breathing &amp; Hydration Guide
            </h3>
            <p className="text-[11px] font-medium text-muted-foreground">
              Uganda Curriculum Mindful Wellness &middot; Cycle {cycleCount} of {totalCycles}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled((s) => !s)}
            className="p-2 rounded-xl border border-border/60 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title={soundEnabled ? "Mute audio chimes" : "Enable audio chimes"}
            aria-label="Toggle chime sound"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-primary" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Main Interactive Stage: Meditative Figure & Water Sipper */}
      <div className="relative flex flex-col items-center justify-center py-4 min-h-[300px]">
        {phase === "water" ? (
          /* 15-Second Water Sipping Animation */
          <motion.div
            key="water-stage"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center justify-center space-y-4"
          >
            {/* Animated Tumbler / Glass of Water */}
            <div className="relative w-36 h-52 border-4 border-cyan-400/60 rounded-b-3xl rounded-t-lg bg-card/60 backdrop-blur-md overflow-hidden shadow-glow flex flex-col justify-end p-1">
              {/* Dynamic Water Liquid with descent */}
              <motion.div
                className="w-full bg-gradient-to-t from-cyan-500 via-blue-500 to-sky-400 rounded-b-2xl relative"
                initial={{ height: "85%" }}
                animate={{ height: `${Math.max(15, (secondsRemaining / 15) * 85)}%` }}
                transition={{ duration: 1, ease: "linear" }}
              >
                {/* Surface Waves */}
                <div className="absolute -top-2 left-0 right-0 h-3 bg-white/40 rounded-full blur-[1px] animate-pulse" />
                {/* Floating Bubbles */}
                <div className="absolute bottom-2 left-4 w-2 h-2 rounded-full bg-white/50 animate-bounce" />
                <div className="absolute bottom-6 right-5 w-3 h-3 rounded-full bg-white/40 animate-bounce delay-150" />
              </motion.div>

              {/* Water droplet indicator */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Droplets className="w-10 h-10 text-white/80 drop-shadow-md animate-pulse" />
              </div>
            </div>

            <div className="text-center space-y-1">
              <span className="text-2xl font-black font-mono text-cyan-400">
                {secondsRemaining}s
              </span>
              <p className="text-xs font-bold text-foreground">Hydration In Progress</p>
            </div>
          </motion.div>
        ) : (
          /* Meditative Stylized Human Figure with Glowing Lungs */
          <div className="relative flex items-center justify-center w-full max-w-xs h-64">
            {/* Ambient Aura Ripple */}
            <motion.div
              animate={{
                scale: phase === "inhale" || phase === "hold" ? 1.3 : 0.9,
                opacity: phase === "hold" ? 0.75 : 0.45,
              }}
              transition={{
                duration: phase === "inhale" ? 4 : phase === "exhale" ? 8 : 1,
                ease: "easeInOut",
              }}
              className={`absolute w-52 h-52 rounded-full bg-gradient-to-tr ${currentInfo.color} blur-3xl opacity-30`}
            />

            {/* Stylized Avatar SVG */}
            <motion.svg
              viewBox="0 0 200 240"
              className="w-56 h-64 drop-shadow-2xl z-10 animate-breathe"
              animate={{
                scale: currentInfo.chestScale,
                y: phase === "inhale" ? -6 : phase === "exhale" ? 4 : 0,
              }}
              transition={{
                duration:
                  phase === "inhale" ? 4 : phase === "hold" ? 7 : phase === "exhale" ? 8 : 1,
                ease: "easeInOut",
              }}
            >
              <defs>
                <linearGradient id="avatarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#1e293b" stopOpacity="0.9" />
                </linearGradient>
                <radialGradient id="lungGlowGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={currentInfo.lungGlow} stopOpacity="1" />
                  <stop offset="70%" stopColor={currentInfo.lungGlow} stopOpacity="0.5" />
                  <stop offset="100%" stopColor={currentInfo.lungGlow} stopOpacity="0" />
                </radialGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Head / Face (Friendly Cartoon Avatar with Meditative Eyes) */}
              <g id="head">
                <circle cx="100" cy="46" r="28" fill="#1e293b" stroke="#38bdf8" strokeWidth="2.5" />
                {/* Hair/Top contour */}
                <path
                  d="M 75 42 Q 100 20 125 42"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                />
                {/* Serene Closed Eyes (gentle curves) */}
                <path
                  d="M 86 46 Q 91 50 96 46"
                  stroke="#93c5fd"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M 104 46 Q 109 50 114 46"
                  stroke="#93c5fd"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
                {/* Soft Smile */}
                <path
                  d="M 94 58 Q 100 62 106 58"
                  stroke="#93c5fd"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
              </g>

              {/* Neck */}
              <rect
                x="94"
                y="74"
                width="12"
                height="14"
                rx="3"
                fill="#1e293b"
                stroke="#38bdf8"
                strokeWidth="1.5"
              />

              {/* Torso & Ribcage */}
              <path
                d="M 64 96 Q 100 84 136 96 L 128 174 Q 100 182 72 174 Z"
                fill="#0f172a"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />

              {/* Shoulders & Arms in Meditative Rest */}
              <path
                d="M 64 96 C 42 110 38 150 48 180 C 52 192 68 190 70 178"
                stroke="#38bdf8"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M 136 96 C 158 110 162 150 152 180 C 148 192 132 190 130 178"
                stroke="#38bdf8"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />

              {/* Lungs (Left & Right) with Dynamic Expansion and Glow */}
              <motion.g
                id="lungs"
                filter="url(#glow)"
                animate={{
                  opacity: phase === "idle" ? 0.4 : phase === "hold" ? 1.0 : 0.85,
                  scale: phase === "inhale" || phase === "hold" ? 1.15 : 0.9,
                }}
                transition={{ duration: 1 }}
              >
                {/* Left Lung */}
                <path
                  d="M 94 106 C 82 106 74 116 74 132 C 74 150 84 158 92 156 C 96 156 96 142 96 128 Z"
                  fill="url(#lungGlowGrad)"
                  stroke={currentInfo.lungGlow}
                  strokeWidth="1.5"
                />
                {/* Right Lung */}
                <path
                  d="M 106 106 C 118 106 126 116 126 132 C 126 150 116 158 108 156 C 104 156 104 142 104 128 Z"
                  fill="url(#lungGlowGrad)"
                  stroke={currentInfo.lungGlow}
                  strokeWidth="1.5"
                />
                {/* Trachea & Bronchi */}
                <path
                  d="M 100 88 L 100 112 M 100 112 L 88 126 M 100 112 L 112 126"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </motion.g>

              {/* Meditative Hands Clasping at Lap */}
              <path
                d="M 72 178 Q 100 190 128 178"
                stroke="#38bdf8"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
            </motion.svg>

            {/* Countdown Badge overlay */}
            {phase !== "idle" && phase !== "completed" && (
              <div className="absolute bottom-2 flex flex-col items-center justify-center">
                <span className="text-3xl font-black font-mono tracking-tight text-foreground drop-shadow-md">
                  {secondsRemaining}s
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Instructional Feedback & Pacing Text */}
      <div className="text-center space-y-1.5 my-4">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
          {currentInfo.name}
        </span>
        <h4 className="text-base sm:text-lg font-bold text-foreground">
          {currentInfo.instruction}
        </h4>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">{currentInfo.subtext}</p>
      </div>

      {/* Progress Bar */}
      {phase !== "idle" && phase !== "completed" && (
        <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden mb-6">
          <motion.div
            className={`h-full bg-gradient-to-r ${currentInfo.color}`}
            initial={{ width: "0%" }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5, ease: "linear" }}
          />
        </div>
      )}

      {/* Action Controls */}
      <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
        {phase === "idle" ? (
          <button
            onClick={handleStart}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-wider shadow-xl hover:scale-[1.02] transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Begin 4-7-8 Sequence</span>
          </button>
        ) : phase === "completed" ? (
          <button
            onClick={handleStart}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-wider shadow-xl hover:scale-[1.02] transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart Exercise</span>
          </button>
        ) : (
          <>
            <button
              onClick={handlePauseResume}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-secondary text-secondary-foreground font-bold text-xs uppercase tracking-wider hover:bg-secondary/90 transition-all border border-border"
            >
              {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
              <span>{isPaused ? "Resume" : "Pause"}</span>
            </button>

            {phase !== "water" && (
              <button
                onClick={handleSkipToWater}
                className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-muted/80 text-foreground font-bold text-xs hover:bg-muted transition-all border border-border"
                title="Skip breathing and jump to 15-second water hydration"
              >
                <FastForward className="w-4 h-4 text-cyan-400" />
                <span>Drink Water Now</span>
              </button>
            )}

            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground font-bold text-xs transition-all border border-border"
              title="Reset session"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default BreathingGuide;
