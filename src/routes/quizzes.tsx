import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, RotateCcw, Trophy, XCircle, Search, Sparkles } from "lucide-react";
import { topics } from "@/data/topics";
import { QuizRepository } from "@/repositories/quiz.repository";
import { type QuizQuestion, quizQuestions } from "@/data/quizzes";
import { subjectLabels, classLevels } from "@/lib/constants";
import { recordQuizAttempt, PASS_THRESHOLD } from "@/lib/offline-db";
import { calculateTermPoints, getTutorFeedback } from "@/lib/points-engine";
import { useAuth } from "@/lib/auth-context";
import { useTutor } from "@/lib/TutorService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/quizzes")({
  head: () => ({ meta: [{ title: "Quizzes — Lattys Cymatic Hub" }] }),
  component: () => <QuizzesPage />,
});

type Phase = "setup" | "quiz" | "results";

export function QuizzesPage({ initialSubject }: { initialSubject?: string } = {}) {
  const { user } = useAuth();
  const { persona, speak } = useTutor();
  const [phase, setPhase] = useState<Phase>("setup");
  const [subject, setSubject] = useState(initialSubject ?? "math");
  const [level, setLevel] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [topicId, setTopicId] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const recordedRef = useRef<string | null>(null);
  const [dailyTask, setDailyTask] = useState<any>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (topicId) {
        const data = await QuizRepository.getQuestionsByTopic(topicId);
        setQuestions(data);
      }
    };
    fetchQuestions();
  }, [topicId]);

  useEffect(() => {
    const fetchTask = async () => {
      if (user) {
        const { data, error } = await (supabase as any).rpc("get_or_create_daily_task" as any);
        if (!error && data) setDailyTask(data);
      }
    };
    fetchTask();
  }, [user]);

  // LOGIC
  const availableTopics = useMemo(() => {
    return topics.filter((t) => {
      const matchesSubject = t.subject === subject;
      const matchesLevel = t.level === level;
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSubject && matchesLevel && matchesSearch;
    });
  }, [subject, level, searchQuery]);

  const q = questions[idx];

  const start = async (id: string) => {
    const data = await QuizRepository.getQuestionsByTopic(id);
    if (data.length === 0) return;
    setTopicId(id);
    setIdx(0);
    setPicked(null);
    setConfirmed(false);
    setAnswers([]);
    setPhase("quiz");
    recordedRef.current = null;
  };

  const reset = () => {
    setPhase("setup");
    setTopicId(null);
    setIdx(0);
    setPicked(null);
    setConfirmed(false);
    setAnswers([]);
    recordedRef.current = null;
  };

  const submit = () => {
    if (picked === null) return;
    setConfirmed(true);
    setAnswers((a) => [...a, picked]);
  };

  const next = () => {
    if (idx + 1 >= questions.length) setPhase("results");
    else {
      setIdx((i) => i + 1);
      setPicked(null);
      setConfirmed(false);
    }
  };

  const score =
    phase === "results"
      ? answers.reduce((s, a, i) => s + (a === questions[i].correctIndex ? 1 : 0), 0)
      : 0;
  const pct =
    phase === "results" && questions.length ? Math.round((score / questions.length) * 100) : 0;
  const passed = pct >= PASS_THRESHOLD;

  useEffect(() => {
    if (phase !== "results" || !topicId || !user) return;
    const key = `${topicId}:${answers.join(",")}`;
    if (recordedRef.current === key) return;
    recordedRef.current = key;

    const submissionAnswers = answers.map((pickedIndex, i) => ({
      questionId: questions[i].id,
      selectedIndex: pickedIndex,
    }));

    void recordQuizAttempt({
      userId: user.id,
      topicId,
      answers: submissionAnswers,
      scorePct: pct,
    });

    // Award 1.11 scale points
    const earned = calculateTermPoints(pct);
    const feedback = getTutorFeedback(earned, user.user_metadata?.display_name || "learner");

    void speak(feedback, { force: true });
  }, [phase, topicId, user, answers, pct, passed, persona.name, speak, questions]);

  // PHASE: RESULTS
  if (phase === "results") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <Trophy
          className={`mx-auto mb-4 h-14 w-14 ${passed ? "text-secondary" : "text-muted-foreground"}`}
        />
        <h1 className="mb-2 text-3xl font-extrabold">{passed ? "Quiz passed!" : "Keep going"}</h1>
        <p className="mb-2 text-muted-foreground">
          You scored {score}/{questions.length} ({pct}%).
        </p>
        <div className="mb-6 text-xs text-muted-foreground">
          {passed
            ? `+${10 + Math.max(0, Math.floor((pct - PASS_THRESHOLD) / 5))} points awarded · synced when online`
            : `Pass mark is ${PASS_THRESHOLD}% — saved offline either way.`}
        </div>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-glow"
        >
          <RotateCcw className="h-4 w-4" /> Take another quiz
        </button>
      </div>
    );
  }

  // PHASE: QUIZ
  if (phase === "quiz" && q) {
    const correct = q.correctIndex;
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Question {idx + 1} of {questions.length}
          </span>
          <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground">
            Exit
          </button>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="mb-5 text-lg font-bold">{q.question}</h2>
          <div className="space-y-2">
            {q.options.map((opt, i) => {
              const isPicked = picked === i;
              const isCorrect = confirmed && i === correct;
              const isWrong = confirmed && isPicked && i !== correct;
              return (
                <button
                  key={i}
                  disabled={confirmed}
                  onClick={() => setPicked(i)}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-smooth ${
                    isCorrect
                      ? "border-success bg-success/10 text-success"
                      : isWrong
                        ? "border-destructive bg-destructive/10 text-destructive"
                        : isPicked
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-muted/50"
                  }`}
                >
                  <span>{opt}</span>
                  {isCorrect && <CheckCircle2 className="h-5 w-5" />}
                  {isWrong && <XCircle className="h-5 w-5" />}
                </button>
              );
            })}
          </div>
          {confirmed && q.explanation && (
            <p className="mt-4 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
              {q.explanation}
            </p>
          )}
          <div className="mt-5 flex justify-end">
            {!confirmed ? (
              <button
                onClick={submit}
                disabled={picked === null}
                className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-40"
              >
                Submit
              </button>
            ) : (
              <button
                onClick={next}
                className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-glow"
              >
                {idx + 1 >= questions.length ? "See results" : "Next"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // PHASE: SETUP (Selection Screen)
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-extrabold">Take Quizzes</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Pick a subject, class and topic to start.
      </p>

      {/* DAILY MISSION SECTION */}
      {dailyTask && !dailyTask.is_completed && (
        <div className="mb-8 rounded-2xl border border-primary/30 bg-primary/5 p-6 animate-in fade-in slide-in-from-top-4 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sparkles className="h-12 w-12" />
          </div>
          <div className="flex items-start gap-5 relative z-10">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/20 text-primary shadow-glow-sm">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-1">
                Your Daily Specific Task
              </p>
              <h2 className="text-xl font-black mb-2 tracking-tight">
                Today's Personalized Challenge
              </h2>
              <p className="text-sm font-medium leading-relaxed text-muted-foreground mb-5 max-w-xl">
                {dailyTask.description}
              </p>
              <button
                onClick={() => {
                  if (dailyTask.task_type === "retry_quiz") {
                    setSearchQuery(dailyTask.metadata?.topic_name || "");
                    toast.info(`Searching for: ${dailyTask.metadata?.topic_name}`);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-glow hover:scale-105 active:scale-95 transition-all"
              >
                Accept Challenge & Earn +15 Pts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEARCH BAR */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Find a quiz topic..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-border bg-card/50 py-2.5 pl-10 pr-4 text-sm outline-none transition-smooth focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {Object.entries(subjectLabels).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setSubject(k)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-smooth ${subject === k ? "bg-primary text-primary-foreground shadow-glow" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            {l}
          </button>
        ))}
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {classLevels.map((c) => (
          <button
            key={c.level}
            onClick={() => setLevel(c.level)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-smooth ${level === c.level ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {availableTopics.map((t) => {
          const count = quizQuestions.filter((q) => q.topicId === t.id).length;
          return (
            <button
              key={t.id}
              disabled={count === 0}
              onClick={() => start(t.id)}
              className="group rounded-xl border border-border bg-card p-4 text-left transition-smooth hover:-translate-y-0.5 hover:shadow-glow disabled:opacity-40 disabled:hover:translate-y-0"
            >
              <h3 className="font-bold text-foreground">{t.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {count} question{count === 1 ? "" : "s"}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
