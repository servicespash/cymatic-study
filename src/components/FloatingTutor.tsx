import { useState, useEffect } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { MessagesSquare, Phone, Smile, X, Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTutor } from "@/lib/TutorService";
import { useAuth } from "@/lib/auth-context";
import { useUserMood, USER_MOODS, tutorReplyForMood, type UserMood } from "@/lib/user-mood-context";
import { cn } from "@/lib/utils";
import { VisionLiveSession } from "./VisionLiveSession";

export const LiquidWaveform = ({
  state,
  persona,
}: {
  state: "Idle" | "Thinking" | "Speaking";
  persona: string;
}) => (
  <div className="flex h-6 items-end justify-center gap-0.5 opacity-80">
    {[...Array(5)].map((_, i) => (
      <motion.div
        key={i}
        className={cn("w-1 rounded-full", persona === "Adams" ? "bg-blue-500" : "bg-violet-500")}
        animate={{
          height: state === "Speaking" ? [10, 24, 10] : state === "Thinking" ? 10 : 4,
        }}
        transition={{
          repeat: Infinity,
          duration: state === "Speaking" ? 0.5 : 2,
          delay: i * 0.1,
        }}
      />
    ))}
  </div>
);

export function FloatingTutor() {
  const { pathname } = useLocation();
  const { persona, speak, speaking, setVoice } = useTutor();
  const { user } = useAuth();
  const { mood, setMood, meta } = useUserMood();
  const [openMood, setOpenMood] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showLive, setShowLive] = useState(false);
  const [tutorState, setTutorState] = useState<"Idle" | "Thinking" | "Speaking">("Idle");

  useEffect(() => {
    setTutorState(speaking ? "Speaking" : "Idle");
  }, [speaking]);

  if (pathname === "/login" || pathname === "/signup") return null;

  const pick = (m: UserMood) => {
    setMood(m);
    setOpenMood(false);
    const name =
      (user?.user_metadata?.display_name as string | undefined) || user?.email?.split("@")[0];
    const line = tutorReplyForMood(persona.name, m, name);
    void speak(line, { force: true });
  };

  return (
    <>
      <VisionLiveSession open={showLive} onClose={() => setShowLive(false)} />

      {meta && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-hidden
          className={cn(
            "pointer-events-none fixed inset-0 z-10 bg-gradient-to-b transition-opacity duration-200",
            meta.tint,
          )}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-5 right-4 z-50 flex flex-col items-end gap-2"
      >
        <AnimatePresence>
          {openMood && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.2 }}
              className="mb-1 grid w-64 grid-cols-4 gap-2 rounded-2xl border border-border bg-card/95 p-3 shadow-glow backdrop-blur"
            >
              <div className="col-span-4 mb-1 flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground">How do you feel?</p>
                <button onClick={() => setOpenMood(false)} aria-label="Close mood picker">
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
              {USER_MOODS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => pick(m.key)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-[10px] font-medium transition-smooth hover:scale-105",
                    mood === m.key
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background/60 text-muted-foreground",
                  )}
                >
                  <span className="text-lg">{m.emoji}</span>
                  {m.label}
                </button>
              ))}
              {mood && (
                <button
                  onClick={() => {
                    setMood(null);
                    setOpenMood(false);
                  }}
                  className="col-span-4 mt-1 rounded-lg border border-border bg-background/60 px-2 py-1.5 text-[11px] text-muted-foreground hover:bg-muted"
                >
                  Clear mood
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 30 }}
              className="flex flex-col items-end gap-2.5 mb-2"
            >
              {/* Ask Adam */}
              <Link
                to="/tutor"
                onClick={() => {
                  setVoice("male");
                  setExpanded(false);
                }}
                className="flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-600/90 hover:bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-glow transition-smooth hover:scale-105"
              >
                <MessagesSquare className="h-4 w-4" />
                <span>Ask Adam 👨‍🏫</span>
              </Link>

              {/* Ask Hawa */}
              <Link
                to="/tutor"
                onClick={() => {
                  setVoice("female");
                  setExpanded(false);
                }}
                className="flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-600/90 hover:bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-glow transition-smooth hover:scale-105"
              >
                <MessagesSquare className="h-4 w-4" />
                <span>Ask Hawa 👩‍🏫</span>
              </Link>

              {/* Call Live */}
              <button
                onClick={() => {
                  setShowLive(true);
                  setExpanded(false);
                }}
                className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-600/90 hover:bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-glow transition-smooth hover:scale-105"
              >
                <Phone className="h-4 w-4 fill-current animate-pulse" />
                <span>Call Live 📞</span>
              </button>

              {/* Empathy Mood */}
              <button
                onClick={() => {
                  setOpenMood((v) => !v);
                  setExpanded(false);
                }}
                className="flex items-center gap-2 rounded-full border border-zinc-700/30 bg-zinc-800/90 hover:bg-zinc-800 px-4 py-2.5 text-xs font-bold text-white shadow-glow transition-smooth hover:scale-105"
              >
                <Smile className="h-4 w-4" />
                <span>Set Mood {meta ? meta.emoji : "😊"}</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2">
          {tutorState !== "Idle" && (
            <div className="mr-1 bg-black/60 px-3 py-1.5 rounded-full border border-border/40 backdrop-blur-md">
              <LiquidWaveform state={tutorState} persona={persona.name} />
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex h-14 w-14 items-center justify-center rounded-full border-4 border-primary/20 bg-primary text-primary-foreground shadow-glow transition-smooth relative"
          >
            <Bot className="h-7 w-7" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
            </span>
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}
