import { useState, useEffect } from "react";
import { Brain, Calendar, Award, CheckCircle2, RotateCcw, Sparkles, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateSM2, type SM2Card } from "@/lib/sm2";
import { useGamificationStore } from "@/store/useGamificationStore";
import { toast } from "sonner";

const INITIAL_CARDS: SM2Card[] = [
  {
    id: "card-1",
    subject: "Physics",
    topicTitle: "Newton's Laws of Motion & Momentum",
    interval: 1,
    repetitions: 0,
    easeFactor: 2.5,
    lastReviewed: new Date().toISOString(),
    nextReview: new Date().toISOString(),
    masteryLevel: 15,
  },
  {
    id: "card-2",
    subject: "Mathematics",
    topicTitle: "Quadratic Equations & Complex Numbers",
    interval: 1,
    repetitions: 0,
    easeFactor: 2.5,
    lastReviewed: new Date().toISOString(),
    nextReview: new Date().toISOString(),
    masteryLevel: 20,
  },
  {
    id: "card-3",
    subject: "Chemistry",
    topicTitle: "Moles, Stoichiometry & Gas Laws",
    interval: 1,
    repetitions: 0,
    easeFactor: 2.5,
    lastReviewed: new Date().toISOString(),
    nextReview: new Date().toISOString(),
    masteryLevel: 10,
  },
  {
    id: "card-4",
    subject: "Biology",
    topicTitle: "Cell Division, Genetics & DNA Replication",
    interval: 1,
    repetitions: 0,
    easeFactor: 2.5,
    lastReviewed: new Date().toISOString(),
    nextReview: new Date().toISOString(),
    masteryLevel: 25,
  },
];

export function SpacedRepetitionModule() {
  const [cards, setCards] = useState<SM2Card[]>(() => {
    const saved = localStorage.getItem("lattys-sm2-cards");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_CARDS;
      }
    }
    return INITIAL_CARDS;
  });

  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const { addXp, addCompletedTask } = useGamificationStore();

  useEffect(() => {
    localStorage.setItem("lattys-sm2-cards", JSON.stringify(cards));
  }, [cards]);

  const activeCard = cards[activeCardIndex] || cards[0];

  const handleRate = (quality: number) => {
    const result = calculateSM2(
      quality,
      activeCard.repetitions,
      activeCard.interval,
      activeCard.easeFactor,
    );

    const updated = cards.map((c, i) => {
      if (i === activeCardIndex) {
        return {
          ...c,
          interval: result.interval,
          repetitions: result.repetitions,
          easeFactor: result.easeFactor,
          lastReviewed: new Date().toISOString(),
          nextReview: result.nextReview,
          masteryLevel: result.masteryLevel,
        };
      }
      return c;
    });

    setCards(updated);
    setIsFlipped(false);
    addXp(15);

    if (result.masteryLevel >= 80) {
      toast.success(`Mastery milestone reached for ${activeCard.topicTitle}! +15 XP`);
      addCompletedTask({
        date: new Date().toISOString(),
        taskId: activeCard.id,
        scorePct: result.masteryLevel,
        title: activeCard.topicTitle,
        taskType: "spaced_repetition",
      });
    } else {
      toast.info(`Review scheduled in ${result.interval} day(s) using SM-2 algorithm.`);
    }

    // Move to next card
    if (activeCardIndex + 1 < cards.length) {
      setActiveCardIndex(activeCardIndex + 1);
    } else {
      setActiveCardIndex(0);
    }
  };

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-2xl text-zinc-100 max-w-3xl mx-auto my-6">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-cyan-400 animate-pulse" />
            <h2 className="text-lg font-extrabold">Spaced Repetition Studio (SM-2 Algorithm)</h2>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Optimized memory retention for NCDC secondary curriculum topics.
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            Card {activeCardIndex + 1} of {cards.length}
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Card List / Schedule Overview */}
        <div className="space-y-3 md:col-span-1 border-r border-zinc-800 pr-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
            Curriculum Deck
          </h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {cards.map((c, idx) => (
              <button
                key={c.id}
                onClick={() => {
                  setActiveCardIndex(idx);
                  setIsFlipped(false);
                }}
                className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex flex-col gap-1 ${
                  activeCardIndex === idx
                    ? "border-cyan-500 bg-cyan-500/10 text-cyan-200"
                    : "border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>{c.subject}</span>
                  <span className="text-[10px] text-cyan-400 font-mono">
                    {c.masteryLevel}% Mastery
                  </span>
                </div>
                <p className="truncate text-zinc-300">{c.topicTitle}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Active Flashcard Study Area */}
        <div className="md:col-span-2 flex flex-col justify-between space-y-6">
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="relative cursor-pointer rounded-2xl border border-zinc-700 bg-gradient-to-br from-zinc-950 to-zinc-900 p-8 min-h-[220px] flex flex-col justify-between shadow-xl transition-transform hover:border-zinc-600"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                {activeCard.subject}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                Interval: {activeCard.interval}d | EF: {activeCard.easeFactor}
              </span>
            </div>

            <div className="my-6 text-center space-y-2">
              <h3 className="text-base font-bold text-zinc-100">{activeCard.topicTitle}</h3>
              <p className="text-xs text-zinc-400">
                {isFlipped
                  ? "Core Principle: Review NCDC curriculum learning outcomes, solve derivation problems, and test your conceptual understanding."
                  : "Click card to reveal recall prompt & core principle"}
              </p>
            </div>

            <div className="text-center text-[11px] text-cyan-400 font-semibold flex items-center justify-center gap-1">
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{isFlipped ? "Showing Principle" : "Click to Flip"}</span>
            </div>
          </div>

          {/* SM-2 Quality Rating Buttons */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-zinc-400 block text-center">
              Rate your recall performance (SM-2 algorithm):
            </span>
            <div className="grid grid-cols-6 gap-2">
              {[
                {
                  score: 0,
                  label: "0 - Blackout",
                  color: "hover:bg-rose-500/20 border-rose-500/30 text-rose-400",
                },
                {
                  score: 1,
                  label: "1 - Incorrect",
                  color: "hover:bg-orange-500/20 border-orange-500/30 text-orange-400",
                },
                {
                  score: 2,
                  label: "2 - Hard",
                  color: "hover:bg-amber-500/20 border-amber-500/30 text-amber-400",
                },
                {
                  score: 3,
                  label: "3 - Good",
                  color: "hover:bg-blue-500/20 border-blue-500/30 text-blue-400",
                },
                {
                  score: 4,
                  label: "4 - Easy",
                  color: "hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400",
                },
                {
                  score: 5,
                  label: "5 - Perfect",
                  color: "hover:bg-cyan-500/20 border-cyan-500/30 text-cyan-400",
                },
              ].map((btn) => (
                <button
                  key={btn.score}
                  onClick={() => handleRate(btn.score)}
                  className={`rounded-xl border bg-zinc-950 p-2.5 text-center text-[10px] font-bold transition-all ${btn.color}`}
                >
                  <div className="text-sm font-extrabold">{btn.score}</div>
                  <div className="truncate">{btn.label.split(" - ")[1]}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
