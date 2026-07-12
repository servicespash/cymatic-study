import React, { useState } from "react";
import { Sparkles, X, ChevronRight, Check, AlertCircle, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { quizQuestions } from "@/data/quizzes";
import { useTermProgress } from "@/hooks/useTermProgress";
import { toast } from "sonner";

export function QuickQuizButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const { completeTaskAndSync } = useTermProgress();

  // Generate 3 random questions for the mini-quiz
  const [questions] = useState(() => {
    const shuffled = [...quizQuestions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  });

  const activeQuestion = questions[currentIdx];

  const handleOptionClick = (idx: number) => {
    if (isAnswered) return;
    setSelectedOpt(idx);
  };

  const handleSubmit = () => {
    if (selectedOpt === null) return;
    setIsAnswered(true);
    if (selectedOpt === activeQuestion.correctIndex) {
      setCorrectCount((c) => c + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx < 2) {
      setCurrentIdx(currentIdx + 1);
      setSelectedOpt(null);
      setIsAnswered(false);
    } else {
      setQuizDone(true);

      // Award mini-quiz points via useTermProgress
      const ptsEarned = correctCount * 5; // up to 15 points
      if (ptsEarned > 0) {
        completeTaskAndSync({
          id: `quick-quiz-${Date.now()}`,
          title: "Dashboard Quick Mini-Quiz",
          subject: "Math",
          description: `Scored ${correctCount}/3 on the quick mini-quiz.`,
          taskType: "quiz",
          points: ptsEarned,
          isCompleted: true,
          priority: false,
          snoozed: false,
          snoozeCount: 0,
          tutorExplanation: "Completed rapid mini-quiz assessment to keep memory fresh.",
          created_by: "tutor",
          created_at: new Date().toISOString(),
        });
      }
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setCurrentIdx(0);
    setSelectedOpt(null);
    setIsAnswered(false);
    setCorrectCount(0);
    setQuizDone(false);
  };

  return (
    <>
      {/* FLOATING ACTION BUTTON */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-glow hover:shadow-cyan-500/30 transition-all"
        aria-label="Start Quick Quiz"
      >
        <Sparkles className="h-4.5 w-4.5 animate-bounce" />
        <span>Quick Quiz</span>
      </motion.button>

      {/* QUICK QUIZ MODAL */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-glow shadow-black/80"
            >
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-1 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all"
              >
                <X className="h-4 w-4" />
              </button>

              {!quizDone ? (
                <div className="space-y-5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-cyan-400" />
                    <div>
                      <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
                        Quick Assessment Challenge
                      </h3>
                      <p className="text-[10px] text-zinc-500">Question {currentIdx + 1} of 3</p>
                    </div>
                  </div>

                  {/* Progress Indicator Dots */}
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all ${
                          i === currentIdx
                            ? "bg-cyan-500"
                            : i < currentIdx
                              ? "bg-zinc-700"
                              : "bg-zinc-900"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Question */}
                  <div className="space-y-4">
                    <p className="text-sm font-semibold leading-relaxed text-zinc-200 bg-zinc-900/40 p-4 rounded-xl border border-zinc-900">
                      {activeQuestion.question}
                    </p>

                    {/* Options */}
                    <div className="space-y-2">
                      {activeQuestion.options.map((opt, i) => {
                        const isSelected = selectedOpt === i;
                        const isCorrect = isAnswered && i === activeQuestion.correctIndex;
                        const isWrong =
                          isAnswered && isSelected && i !== activeQuestion.correctIndex;

                        return (
                          <button
                            key={i}
                            disabled={isAnswered}
                            onClick={() => handleOptionClick(i)}
                            className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-xs font-semibold transition-all duration-200 ${
                              isCorrect
                                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                                : isWrong
                                  ? "border-rose-500/50 bg-rose-500/10 text-rose-400"
                                  : isSelected
                                    ? "border-cyan-500 bg-cyan-950/40 text-cyan-300"
                                    : "border-zinc-900 bg-zinc-950 hover:bg-zinc-900 text-zinc-400"
                            }`}
                          >
                            <span>{opt}</span>
                            {isAnswered && i === activeQuestion.correctIndex && (
                              <Check className="h-4 w-4 text-emerald-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Question Explanation if Answered */}
                  {isAnswered && activeQuestion.explanation && (
                    <div className="flex gap-2 p-3 bg-zinc-900/60 rounded-xl border border-zinc-900 text-[11px] text-zinc-400">
                      <AlertCircle className="h-4 w-4 text-cyan-500 flex-shrink-0" />
                      <p>{activeQuestion.explanation}</p>
                    </div>
                  )}

                  {/* Control Buttons */}
                  <div className="flex justify-end">
                    {!isAnswered ? (
                      <button
                        disabled={selectedOpt === null}
                        onClick={handleSubmit}
                        className="rounded-xl bg-cyan-500 hover:bg-cyan-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-40 shadow-glow shadow-cyan-500/15"
                      >
                        Submit
                      </button>
                    ) : (
                      <button
                        onClick={handleNext}
                        className="flex items-center gap-1 rounded-xl bg-cyan-500 hover:bg-cyan-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-glow shadow-cyan-500/15"
                      >
                        <span>{currentIdx < 2 ? "Next Question" : "Finish Assessment"}</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                // SUCCESS VIEW
                <div className="text-center py-6 space-y-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                    <Award className="h-8 w-8 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Quiz Completed!</h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      You scored {correctCount} out of 3.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-zinc-900/50 border border-zinc-900 text-xs font-medium text-zinc-300 max-w-xs mx-auto">
                    {correctCount === 3
                      ? "🏆 Exceptional! Full +15 XP awarded directly to your 90-day trajectory."
                      : correctCount > 0
                        ? `👍 Great job! +${correctCount * 5} XP awarded directly to your 90-day trajectory.`
                        : "Keep practicing! Take another quick quiz anytime to boost your continuous grades."}
                  </div>
                  <button
                    onClick={handleClose}
                    className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-600 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-glow shadow-cyan-500/15"
                  >
                    Back to Dashboard
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
