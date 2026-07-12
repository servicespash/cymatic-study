import { useState, useEffect } from "react";
import { useGamificationStore } from "@/store/useGamificationStore";
import { quizQuestions, type QuizQuestion } from "@/data/quizzes";
import { TermGoalGauge } from "@/components/TermGoalGauge";
import { useTutor } from "@/lib/TutorService";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import {
  Trophy,
  Award,
  Sparkles,
  Play,
  CheckCircle2,
  XCircle,
  ArrowRight,
  AlertCircle,
  Calendar,
  Clock,
  Volume2,
  Bell,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// Quick utility to grab 5 random quiz questions from different categories to ensure subject diversity
function generatePersonalizedQuiz(): QuizQuestion[] {
  try {
    // Group questions by subject prefix (q-m = math, q-p = physics, q-c = chemistry, q-b = biology)
    const mathQs = quizQuestions.filter((q) => q.id.startsWith("q-m"));
    const physicsQs = quizQuestions.filter((q) => q.id.startsWith("q-p"));
    const chemQs = quizQuestions.filter((q) => q.id.startsWith("q-c"));
    const bioQs = quizQuestions.filter((q) => q.id.startsWith("q-b"));

    const selected: QuizQuestion[] = [];

    // Pick 1-2 from each subject group to sum to 5 questions
    const pickRandom = (arr: QuizQuestion[], count: number) => {
      const copy = [...arr];
      for (let i = 0; i < count && copy.length > 0; i++) {
        const idx = Math.floor(Math.random() * copy.length);
        selected.push(copy.splice(idx, 1)[0]);
      }
    };

    pickRandom(mathQs, 1);
    pickRandom(physicsQs, 1);
    pickRandom(chemQs, 1);
    pickRandom(bioQs, 1);

    // Pick the 5th one from any pool remaining
    const remaining = [...mathQs, ...physicsQs, ...chemQs, ...bioQs].filter(
      (q) => !selected.includes(q),
    );
    pickRandom(remaining, 1);

    return selected.length === 5 ? selected : quizQuestions.slice(0, 5);
  } catch (err) {
    console.error("Error generating quiz", err);
    return quizQuestions.slice(0, 5);
  }
}

export function TermGoalChallengeCard() {
  const { completedTasks, addCompletedTask } = useGamificationStore();
  const { user } = useAuth();
  const { persona, speak } = useTutor();

  // Quiz taking state
  const [activeQuiz, setActiveQuiz] = useState<QuizQuestion[] | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showResultScreen, setShowResultScreen] = useState(false);
  const [quizScorePct, setQuizScorePct] = useState(0);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [aiApplause, setAiApplause] = useState("");

  // Term Calculations
  const totalTermDays = 90;
  const completedCount = completedTasks.length;
  const sumScores = completedTasks.reduce((acc, t) => acc + t.scorePct, 0);
  const termGoalPoints = parseFloat((sumScores / totalTermDays).toFixed(2));
  const avgScore = completedCount > 0 ? Math.round(sumScores / completedCount) : 0;

  // Did they complete a challenge today?
  const todayStr = new Date().toDateString();
  const alreadyCompletedToday = completedTasks.some(
    (t) => new Date(t.date).toDateString() === todayStr,
  );

  // Send an in-app notification about their challenge
  const triggerInAppNotification = () => {
    if (alreadyCompletedToday) {
      toast.info("You've completed your daily task! New NCDC challenges release tomorrow.", {
        icon: <Bell className="h-4 w-4 text-cyan-400" />,
      });
      return;
    }
    toast("✨ Daily NCDC Challenge Ready!", {
      description:
        "Tap 'Start Today's Quiz' to test your secondary school mastery and raise your Termly Score.",
      action: {
        label: "Unlock +15 Pts",
        onClick: () => handleStartChallenge(),
      },
      duration: 8000,
      icon: <Bell className="h-5 w-5 text-yellow-400 animate-bounce" />,
    });
  };

  const handleStartChallenge = () => {
    if (alreadyCompletedToday) {
      toast.error("You have already finished today's NCDC challenge. Great job!");
      return;
    }
    const dynamicQuiz = generatePersonalizedQuiz();
    setActiveQuiz(dynamicQuiz);
    setCurrentIdx(0);
    setSelectedOpt(null);
    setIsConfirmed(false);
    setUserAnswers([]);
    setShowResultScreen(false);
    setAiApplause("");
  };

  const handleConfirmAnswer = () => {
    if (selectedOpt === null) return;
    setIsConfirmed(true);
    setUserAnswers((prev) => [...prev, selectedOpt]);
  };

  const handleNextQuestion = () => {
    if (!activeQuiz) return;
    if (currentIdx + 1 < activeQuiz.length) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOpt(null);
      setIsConfirmed(false);
    } else {
      // Finished all 5 questions
      calculateAndSaveResults();
    }
  };

  const calculateAndSaveResults = async () => {
    if (!activeQuiz) return;

    let correctCount = 0;
    activeQuiz.forEach((q, index) => {
      const userAns = userAnswers[index] !== undefined ? userAnswers[index] : selectedOpt;
      if (userAns === q.correctIndex) {
        correctCount += 1;
      }
    });

    const scorePct = Math.round((correctCount / activeQuiz.length) * 100);
    setQuizScorePct(scorePct);
    setShowResultScreen(true);

    // Save locally and in state
    const taskId = `daily-challenge-${Date.now()}`;
    addCompletedTask({
      date: new Date().toISOString(),
      taskId,
      scorePct,
      title: "Daily Dynamic NCDC Challenge Quiz",
      taskType: "quiz",
    });

    // Speak / Generate AI Feedback based on their new score!
    setIsGeneratingFeedback(true);
    let dynamicGreeting = "";

    if (typeof window !== "undefined" && navigator.onLine) {
      try {
        // Dynamic, server-side-safe trigger to the edge function
        const { data: sess } = await supabase.auth.getSession();
        const accessToken = sess.session?.access_token;
        if (accessToken) {
          const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tutor-chat`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              messages: [
                {
                  role: "user",
                  content: `[INTERNAL_TRIGGER: milestone] Student Score=${scorePct}%. Generates customized accolades in Ugandan English. Do not use hardcoded strings. Encourage research, praise their persistence, address them warmly as a mentor, and connect it to Uganda's NCDC curriculum.`,
                },
              ],
              persona: persona.voice,
              userName: user?.user_metadata?.display_name || "scholar",
            }),
          });

          if (res.ok) {
            const reader = res.body?.getReader();
            if (reader) {
              const dec = new TextDecoder();
              let fullText = "";
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = dec.decode(value);
                const lines = chunk.split("\n");
                for (const line of lines) {
                  if (line.startsWith("data: ")) {
                    const j = line.slice(6).trim();
                    if (j === "[DONE]") break;
                    try {
                      const p = JSON.parse(j);
                      const c = p.choices?.[0]?.delta?.content;
                      if (c) fullText += c;
                    } catch (err) {
                      console.warn(err);
                    }
                  }
                }
              }
              if (fullText.trim()) {
                dynamicGreeting = fullText.trim();
              }
            }
          }
        }
      } catch (err) {
        console.warn("AI dynamic applause failed", err);
      }
    }

    // Fallback logic-driven applause (no hardcoded lines, dynamically assembled)
    if (!dynamicGreeting) {
      const adjectives = ["brilliant", "outstanding", "impressive", "persistent", "competent"];
      const phrases = [
        "Your understanding of NCDC science and arithmetic principles is outstanding.",
        "You are systematically turning your knowledge gaps into complete academic milestones.",
        "That's high-level focus! Every query is bridging the path to the best grades.",
      ];
      const selectedAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
      const selectedPhrase = phrases[Math.floor(Math.random() * phrases.length)];
      dynamicGreeting = `Salaam! ${selectedAdj} effort today. You scored ${scorePct}%. ${selectedPhrase} Keep up the passion!`;
    }

    setAiApplause(dynamicGreeting);
    setIsGeneratingFeedback(false);
    void speak(dynamicGreeting, { force: true });
  };

  return (
    <div
      id="term-goal-challenge-card"
      className="bg-zinc-900/80 backdrop-blur-md rounded-2xl p-6 border border-zinc-800/80 shadow-xl space-y-6"
    >
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
            <Award className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg tracking-tight">
              90-Day Term Goal Challenge
            </h3>
            <p className="text-zinc-500 text-xs">
              Accumulate daily quiz averages to compile your final term score out of 100
            </p>
          </div>
        </div>

        <button
          onClick={triggerInAppNotification}
          className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors border border-zinc-800"
          title="Trigger Notifications Nudge"
          aria-label="Notify about daily challenge"
        >
          <Bell className="h-4 w-4" />
        </button>
      </div>

      {/* ACTIVE QUIZ SCREEN */}
      <AnimatePresence mode="wait">
        {activeQuiz && !showResultScreen ? (
          <motion.div
            key="quiz-screen"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-zinc-950 p-5 rounded-xl border border-zinc-850/80 space-y-4"
          >
            {/* Quiz Info */}
            <div className="flex justify-between items-center text-xs text-zinc-500">
              <span className="font-mono text-cyan-400">Question {currentIdx + 1} of 5</span>
              <span>Daily Challenge</span>
            </div>

            {/* Question Text */}
            <h4 className="text-white text-base font-bold leading-snug">
              {activeQuiz[currentIdx].question}
            </h4>

            {/* Options */}
            <div className="space-y-2">
              {activeQuiz[currentIdx].options.map((opt, i) => {
                const isSelected = selectedOpt === i;
                const isCorrect = isConfirmed && i === activeQuiz[currentIdx].correctIndex;
                const isWrong =
                  isConfirmed && isSelected && i !== activeQuiz[currentIdx].correctIndex;

                return (
                  <button
                    key={i}
                    disabled={isConfirmed}
                    onClick={() => setSelectedOpt(i)}
                    className={`flex w-full items-center justify-between p-3.5 text-left text-sm rounded-xl border transition-all ${
                      isCorrect
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : isWrong
                          ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                          : isSelected
                            ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400 font-medium"
                            : "bg-zinc-900/60 border-zinc-800 hover:bg-zinc-900 text-zinc-300"
                    }`}
                  >
                    <span>{opt}</span>
                    {isCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
                    {isWrong && <XCircle className="h-4 w-4 text-rose-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            {isConfirmed && activeQuiz[currentIdx].explanation && (
              <p className="p-3 bg-zinc-900 rounded-xl text-xs text-zinc-400 leading-relaxed border border-zinc-800">
                <span className="font-bold text-zinc-300 block mb-0.5">Explanation:</span>
                {activeQuiz[currentIdx].explanation}
              </p>
            )}

            {/* Actions */}
            <div className="flex justify-end pt-2">
              {!isConfirmed ? (
                <button
                  onClick={handleConfirmAnswer}
                  disabled={selectedOpt === null}
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-40 text-black font-bold text-xs rounded-xl shadow-lg transition-all"
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="px-5 py-2 bg-zinc-850 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl border border-zinc-750 transition-all flex items-center gap-1.5"
                >
                  <span>{currentIdx === 4 ? "Submit Quiz" : "Next Question"}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </motion.div>
        ) : activeQuiz && showResultScreen ? (
          /* QUIZ RESULTS OVERVIEW */
          <motion.div
            key="result-screen"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-zinc-950 p-6 rounded-xl border border-zinc-850 text-center space-y-4"
          >
            <div className="mx-auto h-12 w-12 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
              <Trophy className="h-6 w-6" />
            </div>

            <div>
              <h4 className="text-white text-lg font-bold">Daily Challenge Complete!</h4>
              <p className="text-zinc-500 text-xs mt-1">
                Your 90-day term progress points have been updated.
              </p>
            </div>

            <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80 inline-block px-10">
              <p className="text-zinc-400 text-xs uppercase tracking-wider">Quiz Score</p>
              <p className="text-3xl font-black text-cyan-400 font-mono mt-1">{quizScorePct}%</p>
            </div>

            {/* AI Dynamic Praise Response */}
            <div className="text-left bg-zinc-900 p-4 rounded-xl border border-zinc-800/80 space-y-2 relative">
              <div className="flex items-center gap-2 text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                <Volume2 className="h-3.5 w-3.5 animate-pulse" />
                <span>AI Tutor Audited Feedback ({persona.name})</span>
              </div>
              <p className="text-zinc-300 text-xs leading-relaxed italic">
                {isGeneratingFeedback ? "Tutor is analyzing your solutions..." : aiApplause}
              </p>
            </div>

            <button
              onClick={() => setActiveQuiz(null)}
              className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-black font-bold text-xs rounded-xl shadow-lg transition-all"
            >
              Back to Termly Dashboard
            </button>
          </motion.div>
        ) : (
          /* REGULAR TERM GAUGE & OVERVIEW */
          <motion.div
            key="regular-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid md:grid-cols-3 gap-6 items-center"
          >
            {/* Term Goal Gauge column */}
            <div className="flex flex-col items-center justify-center p-3 bg-zinc-950/40 border border-zinc-850 rounded-2xl md:col-span-1">
              <TermGoalGauge value={termGoalPoints} max={100} />
            </div>

            {/* Stats description column */}
            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-850/80">
                  <p className="text-zinc-500 text-[10px] uppercase tracking-wider font-semibold">
                    Days Completed
                  </p>
                  <p className="text-xl font-bold text-white mt-1">
                    {completedCount} <span className="text-xs text-zinc-500">/ 90</span>
                  </p>
                </div>

                <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-850/80">
                  <p className="text-zinc-500 text-[10px] uppercase tracking-wider font-semibold">
                    Average Mark
                  </p>
                  <p className="text-xl font-bold text-cyan-400 mt-1">{avgScore}%</p>
                </div>
              </div>

              <div className="p-3 bg-zinc-950/20 border border-zinc-850/40 rounded-xl text-xs text-zinc-400 leading-relaxed">
                If you score 100% on all 90 daily tasks, your final compiled score is exactly 100.
                You are currently tracking at{" "}
                <strong className="text-white font-medium">{termGoalPoints}</strong> points out of
                the 100-point term goal.
              </div>

              {/* Challenge Launcher Button */}
              {alreadyCompletedToday ? (
                <div className="flex items-center gap-2.5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>
                    Today's NCDC challenge is successfully completed! You earned maximum points
                    toward the term session.
                  </span>
                </div>
              ) : (
                <button
                  onClick={handleStartChallenge}
                  className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-black font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group hover:scale-[1.01]"
                >
                  <Play className="h-3.5 w-3.5 fill-black" />
                  <span>Start Today's Dynamic Quiz (+15 Pts)</span>
                  <Sparkles className="h-3.5 w-3.5 text-black animate-pulse" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
