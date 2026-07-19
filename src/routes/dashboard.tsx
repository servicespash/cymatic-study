import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useTransition } from "react";
import {
  LogOut,
  Settings,
  ShieldCheck,
  User,
  Trophy,
  BookOpen,
  MessageSquare,
  MessageSquareHeart,
  RotateCcw,
  HelpCircle,
  Share2,
  Gift,
  Building2,
  FileText,
  Star,
  Plus,
  Compass,
  Zap,
  Flame,
  CheckCircle,
  Clock,
  EyeOff,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Share } from "@capacitor/share";
import { toast } from "sonner";
import { TermGoalGauge } from "@/components/TermGoalGauge";
import { SearchEngine } from "@/components/SearchEngine";
import { CurriculumToggle } from "@/components/CurriculumToggle";
import StudentProjectsDashboard from "@/components/StudentProjectsDashboard";
import { ProgressDashboard } from "@/components/ProgressDashboard";
import { KnowledgeGaps } from "@/components/KnowledgeGaps";
import { BadgesDashboard } from "@/components/BadgesDashboard";
import { BadgesView } from "@/components/BadgesView";
import { StudyGoalsCard } from "@/components/StudyGoalsCard";
import { PastSessionsList } from "@/components/PastSessionsList";
import { PrintableSummary } from "@/components/PrintableSummary";
import { BreathingGuide } from "@/components/BreathingGuide";
import { TermGoalChallengeCard } from "@/components/TermGoalChallengeCard";
import { TermProgressChart } from "@/components/TermProgressChart";

// New components & hooks imports
import { RoleTogglePanel } from "@/components/RoleTogglePanel";
import { MilestoneBadges } from "@/components/MilestoneBadges";
import { TermSummaryPanel } from "@/components/TermSummaryPanel";
import { QuickQuizButton } from "@/components/QuickQuizButton";
import { TaskContextMenu } from "@/components/TaskContextMenu";
import { useGuestSession } from "@/hooks/useGuestSession";
import { useTermProgress } from "@/hooks/useTermProgress";
import { QuizEngine, type DynamicDailyTask } from "@/lib/quiz-engine";
import { motion, AnimatePresence } from "framer-motion";
import { StudentActivityDashboard } from "@/components/StudentActivityDashboard";
import { SocraticTutorChat } from "@/components/SocraticTutorChat";
import { SubjectPracticeReminder } from "@/components/SubjectPracticeReminder";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "My Hub — Cymatic Study" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, loading, signOut, profile, isGuestMode, guestRole } = useAuth();

  const navigate = useNavigate();
  const { timeLeft, showLoginModal } = useGuestSession();
  const { completeTaskAndSync } = useTermProgress();
  const [isPending, startTransition] = useTransition();

  // Dynamic daily tasks state
  const [tasks, setTasks] = useState<DynamicDailyTask[]>([]);
  const [showSnoozed, setShowSnoozed] = useState(false);
  const [selectedExplTask, setSelectedExplTask] = useState<DynamicDailyTask | null>(null);

  // Teacher manual task builder state
  const [manualTitle, setManualTitle] = useState("");
  const [manualSubject, setManualSubject] = useState<"Math" | "Physics" | "Chemistry" | "Biology">(
    "Math",
  );
  const [manualType, setManualType] = useState<"quiz" | "project" | "interactive_question">("quiz");
  const [manualPoints, setManualPoints] = useState(15);
  const [manualDesc, setManualDesc] = useState("");
  const [manualExplanation, setManualExplanation] = useState("");

  const loadTasks = () => {
    setTasks(QuizEngine.getTasks());
  };

  useEffect(() => {
    loadTasks();
    // Refresh when local storage updates
    window.addEventListener("storage", loadTasks);
    return () => window.removeEventListener("storage", loadTasks);
  }, []);

  const handleTeacherCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle || !manualDesc) {
      toast.error("Please fill in the title and description.");
      return;
    }

    QuizEngine.createManualTask({
      title: manualTitle,
      subject: manualSubject,
      description: manualDesc,
      taskType: manualType,
      points: manualPoints,
      tutorExplanation: manualExplanation,
      created_by: "teacher",
    });

    toast.success("📝 Assignment Published!", {
      description: `"${manualTitle}" has been set for all students successfully.`,
    });

    // Reset Form
    setManualTitle("");
    setManualDesc("");
    setManualExplanation("");
    loadTasks();
  };

  // Filter tasks based on snoozed state
  const visibleTasks = tasks.filter((t) => (showSnoozed ? t.snoozed : !t.snoozed));

  // Latty's Logic: Track points and school name
  const [points, setPoints] = useState(0);
  const [dailyPoints, setDailyPoints] = useState(0);
  const schoolName = profile?.school_name || user?.user_metadata?.school_name;
  const [activeTab, setActiveTab] = useState<"missions" | "quizzes" | "tutor" | "projects">(
    "missions",
  );

  const handleShare = async () => {
    try {
      await Share.share({
        title: "Join Lattys Cymatic Study",
        text: `Salaam! Join me on Cymatic Study to master the New Lower Secondary Curriculum. My Referral Code: ${user?.id?.slice(0, 8).toUpperCase()}`,
        url: "https://com.latifisabirye.cymatichub",
        dialogTitle: "Share with fellow Scholars",
      });
      toast.success("Thanks for sharing! Points will be added once your friend joins.");
    } catch (e) {
      console.error("Sharing failed", e);
    }
  };

  const handleClaimRewards = () => {
    if (points < 100) {
      toast.info(`You need ${100 - points} more points to claim your first reward!`);
    } else {
      toast.success("Reward unlocked! Contact support to activate your premium access.");
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      startTransition(() => {
        navigate({ to: "/login" });
      });
    }

    const fetchDailyPoints = async () => {
      if (user && !isGuestMode) {
        const today = new Date().toISOString().split("T")[0];
        const { data, error } = await supabase
          .from("user_points")
          .select("points")
          .eq("user_id", user.id)
          .gte("created_at", today);

        if (!error && data) {
          const total = data.reduce((acc, curr) => acc + (curr.points || 0), 0);
          setDailyPoints(total);
        }
      } else if (isGuestMode) {
        // Mock points display
        setDailyPoints(45);
      }
    };
    fetchDailyPoints();

    // Logic to "animate" points rising from 0 to current count
    if (points < dailyPoints) {
      const diff = dailyPoints - points;
      const step = Math.max(1, Math.floor(diff / 10));
      const timer = setTimeout(() => setPoints((prev) => Math.min(prev + step, dailyPoints)), 30);
      return () => clearTimeout(timer);
    }
  }, [user, loading, navigate, points, isGuestMode, dailyPoints]);

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-muted-foreground">
        Gathering your study materials...
      </div>
    );
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
      {/* 5-MINUTE PREVIEW HEADS-UP TIMER */}
      {isGuestMode && timeLeft !== null && (
        <div className="flex items-center justify-between px-5 py-3 bg-zinc-950 border border-yellow-500/20 rounded-xl text-xs">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />
            <span className="text-zinc-300 font-medium">Guest Session Duration:</span>
          </div>
          <span className="font-mono text-yellow-400 font-bold bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
            {formatTime(timeLeft)}
          </span>
        </div>
      )}

      {/* INTERACTIVE ROLE SIMULATOR BOARD */}
      <RoleTogglePanel />

      {/* RENDER ACTIVE DASHBOARD ACCORDING TO ROLE */}
      {isGuestMode && guestRole === "teacher" ? (
        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-r from-zinc-900 to-zinc-950 rounded-2xl border border-zinc-800 shadow-xl">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Teacher Administration Panel
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Uganda Secondary School Teacher Companion (NCDC Aligned)
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
              <span className="text-zinc-500 text-xs font-medium">Monitored Students</span>
              <p className="text-2xl font-bold text-white mt-1">14 Active</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
              <span className="text-zinc-500 text-xs font-medium">Average Competency</span>
              <p className="text-2xl font-bold text-cyan-400 mt-1">84.5%</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
              <span className="text-zinc-500 text-xs font-medium">Syllabus Coverage</span>
              <p className="text-2xl font-bold text-indigo-400 mt-1">68% Complete</p>
            </div>
          </div>

          {/* TEACHER ASSIGNMENT PUBLISHER FORM */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4">
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-cyan-400" />
              <h3 className="text-white font-bold text-base">Publish S1-S4 Daily Assignment</h3>
            </div>
            <p className="text-xs text-zinc-400">
              Instantly create a curriculum challenge that populates in the Student dashboard daily
              mission lists.
            </p>

            <form onSubmit={handleTeacherCreateTask} className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <label className="text-[10px] uppercase font-bold text-zinc-400">Task Title</label>
                <input
                  type="text"
                  placeholder="e.g., Balancing Alkane Combustion Equations"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs outline-none text-white focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-400">
                  Curriculum Subject
                </label>
                <select
                  value={manualSubject}
                  onChange={(e: any) => setManualSubject(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs outline-none text-white focus:border-cyan-500"
                >
                  <option value="Math">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-400">
                  Evaluation Type
                </label>
                <select
                  value={manualType}
                  onChange={(e: any) => setManualType(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs outline-none text-white focus:border-cyan-500"
                >
                  <option value="quiz">Interactive Quiz</option>
                  <option value="project">Project Work (PBL)</option>
                  <option value="interactive_question">Student Demonstration Question</option>
                </select>
              </div>

              <div className="space-y-1.5 col-span-2">
                <label className="text-[10px] uppercase font-bold text-zinc-400">
                  Task Instructions & Description
                </label>
                <textarea
                  placeholder="Detail the materials, clear steps, and goals of this assignment..."
                  rows={3}
                  value={manualDesc}
                  onChange={(e) => setManualDesc(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs outline-none text-white focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5 col-span-2">
                <label className="text-[10px] uppercase font-bold text-zinc-400">
                  AI Tutor Explanation (Pre-packaged solution)
                </label>
                <textarea
                  placeholder="Explain the correct scientific concepts behind this task to assist tutoring..."
                  rows={2}
                  value={manualExplanation}
                  onChange={(e) => setManualExplanation(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs outline-none text-white focus:border-cyan-500"
                />
              </div>

              <div className="col-span-2 pt-2">
                <button
                  type="submit"
                  className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all"
                >
                  Publish Assignment to Dashboard
                </button>
              </div>
            </form>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
            <h3 className="text-white font-bold mb-4">Student Progress Roll</h3>
            <div className="divide-y divide-zinc-800">
              {[
                {
                  name: "Ssewankambo Isaac",
                  class: "Senior 3",
                  status: "All Completed",
                  score: "92%",
                },
                { name: "Nsubuga Derrick", class: "Senior 4", status: "3 Completed", score: "81%" },
                {
                  name: "Ainomugisha Grace",
                  class: "Senior 3",
                  status: "Behind Pace",
                  score: "64%",
                },
                {
                  name: "Babirye Sandra",
                  class: "Senior 4",
                  status: "All Completed",
                  score: "95%",
                },
              ].map((student, idx) => (
                <div key={idx} className="flex justify-between items-center py-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{student.name}</p>
                    <p className="text-xs text-zinc-500">{student.class}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${student.status === "All Completed" ? "bg-emerald-500/15 text-emerald-400" : student.status === "3 Completed" ? "bg-amber-500/15 text-amber-400" : "bg-red-500/15 text-red-400"}`}
                    >
                      {student.status}
                    </span>
                    <p className="text-xs text-zinc-400 mt-1">Avg Score: {student.score}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : isGuestMode && guestRole === "admin" ? (
        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-r from-zinc-900 to-zinc-950 rounded-2xl border border-zinc-800 shadow-xl">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Super Admin Command Center
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              System Health, Stream Toggles & Security Audit Logs
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
              <span className="text-zinc-500 text-xs font-medium">Active Live Streams</span>
              <p className="text-lg font-bold text-white mt-1">2 Live Now</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
              <span className="text-zinc-500 text-xs font-medium">Database Node</span>
              <p className="text-lg font-bold text-green-400 mt-1">Healthy</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
              <span className="text-zinc-500 text-xs font-medium">Daily Active Users</span>
              <p className="text-lg font-bold text-cyan-400 mt-1">1,242 Users</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
              <span className="text-zinc-500 text-xs font-medium">System Load</span>
              <p className="text-lg font-bold text-white mt-1">12.4%</p>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
            <h3 className="text-white font-bold mb-4">Command Toggles & Seeding</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <button
                onClick={() => toast.success("Successfully seeded 90 daily tasks!")}
                className="p-4 bg-zinc-950 hover:bg-zinc-800 text-left rounded-xl border border-zinc-800 transition-all"
              >
                <h4 className="text-sm font-semibold text-white">Seed 90-Day Task Database</h4>
                <p className="text-xs text-zinc-500 mt-1">
                  Pre-populate all curriculum subject challenges
                </p>
              </button>
              <button
                onClick={() => toast.success("Cleared audit log queue")}
                className="p-4 bg-zinc-950 hover:bg-zinc-800 text-left rounded-xl border border-zinc-800 transition-all"
              >
                <h4 className="text-sm font-semibold text-white">Reset Safety Audit Queue</h4>
                <p className="text-xs text-zinc-500 mt-1">
                  Clean and refresh the automated audit stream
                </p>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* ROW 1: PERSISTENT METRICS & TIMING GOALS (The main, consistent widgets) */}
          <div className="space-y-6">
            <SubjectPracticeReminder />
            <StudentActivityDashboard />

            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2">
                <TermGoalChallengeCard />
              </div>
              <div className="md:col-span-1 flex flex-col justify-between p-6 bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl border border-zinc-800/80 shadow-lg gap-4">
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">
                    Academic Progress Portfolio
                  </h2>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    Compile and export your comprehensive learning history as a verified
                    NCDC-compliant report with security verification keys.
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-cyan-500 hover:bg-cyan-600 text-black font-bold text-xs rounded-xl transition-all duration-200 shadow-md hover:shadow-cyan-500/20 active:scale-95 shrink-0 mt-2"
                  aria-label="Download Progress Summary PDF"
                >
                  <FileText className="h-4 w-4" />
                  Print Portfolio Report
                </button>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-1">
              <div className="space-y-4">
                <TermProgressChart />
                <TermSummaryPanel />
              </div>
            </div>
          </div>

          {/* ROW 2: TABS SECTION (Visually soft, compact, professional navigation) */}
          <div className="mt-8 space-y-6">
            <div className="border-b border-zinc-800 pb-px flex space-x-1 overflow-x-auto scrollbar-none">
              {[
                { id: "missions", label: "Lessons & Missions", icon: BookOpen },
                { id: "quizzes", label: "Quizzes & Badges", icon: Trophy },
                { id: "tutor", label: "Socratic Coach", icon: MessageSquare },
                { id: "projects", label: "Project Sandbox", icon: Building2 },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider rounded-t-xl transition-all relative shrink-0 ${
                      isActive
                        ? "text-cyan-400 bg-zinc-900/60 border-t border-x border-zinc-800/80"
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    {isActive && (
                      <motion.div
                        layoutId="activeDashboardTab"
                        className="absolute bottom-0 inset-x-0 h-0.5 bg-cyan-400"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT TRANSITIONS */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {activeTab === "missions" && (
                  <div className="space-y-6">
                    {/* SEARCH ENGINE */}
                    <SearchEngine />

                    {/* PERSONALIZED DAILY CURRICULUM MISSIONS */}
                    <div className="bg-zinc-900/80 backdrop-blur-md rounded-2xl p-6 border border-zinc-800/80 shadow-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-white font-bold text-lg tracking-tight">
                            Today's Curriculum Missions
                          </h3>
                          <p className="text-zinc-500 text-xs">
                            Right-click or Long-press on any card for Priority, Snooze, or AI
                            explanation options
                          </p>
                        </div>
                        <button
                          onClick={() => setShowSnoozed(!showSnoozed)}
                          className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 transition-all"
                        >
                          {showSnoozed ? "Hide Snoozed" : "Show Snoozed"}
                        </button>
                      </div>

                      {visibleTasks.length === 0 ? (
                        <div className="p-8 text-center bg-zinc-950/40 rounded-xl border border-dashed border-zinc-800">
                          <p className="text-sm font-semibold text-zinc-400">No missions found</p>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {showSnoozed
                              ? "You have no snoozed challenges currently."
                              : "All daily tasks completed! Exceptional job."}
                          </p>
                        </div>
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {visibleTasks.map((task) => (
                            <TaskContextMenu
                              key={task.id}
                              task={task}
                              onUpdate={loadTasks}
                              onRequestExplanation={setSelectedExplTask}
                            >
                              <motion.div
                                whileHover={{ y: -2 }}
                                className={`p-4 rounded-xl border flex flex-col justify-between h-44 relative transition-all duration-300 ${
                                  task.isCompleted
                                    ? "bg-zinc-950/40 border-zinc-900 text-zinc-500 opacity-60"
                                    : task.priority
                                      ? "bg-gradient-to-br from-cyan-950/20 to-zinc-950 border-cyan-500/40 text-zinc-200 ring-1 ring-cyan-500/20"
                                      : "bg-zinc-950/60 border-zinc-850 text-zinc-300"
                                }`}
                              >
                                <div>
                                  <div className="flex items-start justify-between gap-2">
                                    <span
                                      className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                                        task.subject === "Math"
                                          ? "bg-cyan-500/10 text-cyan-400"
                                          : task.subject === "Physics"
                                            ? "bg-violet-500/10 text-violet-400"
                                            : task.subject === "Chemistry"
                                              ? "bg-orange-500/10 text-orange-400"
                                              : "bg-emerald-500/10 text-emerald-400"
                                      }`}
                                    >
                                      {task.subject}
                                    </span>
                                    {task.priority && (
                                      <Star className="h-4 w-4 text-cyan-400 fill-cyan-400 animate-pulse" />
                                    )}
                                  </div>

                                  <h4 className="font-bold text-sm text-zinc-100 tracking-tight mt-2 line-clamp-1">
                                    {task.title}
                                  </h4>
                                  <p className="text-[11px] text-zinc-400 mt-1 line-clamp-3 leading-relaxed">
                                    {task.description}
                                  </p>
                                </div>

                                <div className="pt-3 border-t border-zinc-900 flex items-center justify-between text-[10px]">
                                  <span className="font-semibold text-zinc-500 uppercase">
                                    {task.taskType.replace("_", " ")}
                                  </span>
                                  {task.isCompleted ? (
                                    <span className="flex items-center gap-1 text-emerald-400 font-bold">
                                      <CheckCircle className="h-3.5 w-3.5" /> Completed
                                    </span>
                                  ) : (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        completeTaskAndSync(task);
                                        loadTasks();
                                      }}
                                      className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold px-3 py-1 rounded-lg transition-all"
                                    >
                                      Earn +{task.points} Pts
                                    </button>
                                  )}
                                </div>
                              </motion.div>
                            </TaskContextMenu>
                          ))}
                        </div>
                      )}
                    </div>

                    <StudyGoalsCard />
                  </div>
                )}

                {activeTab === "quizzes" && (
                  <div className="space-y-6">
                    {/* EXQUISITE QUICK QUIZ LAUNCHERS GRID */}
                    <div className="bg-zinc-900/80 backdrop-blur-md rounded-2xl p-6 border border-zinc-800/80 shadow-xl space-y-4">
                      <div>
                        <h3 className="text-white font-bold text-lg tracking-tight">
                          Standard Subject Quizzes
                        </h3>
                        <p className="text-zinc-500 text-xs">
                          Test your academic competence under real Ugandan secondary assessment
                          standards.
                        </p>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                        {[
                          {
                            subject: "Math",
                            label: "Mathematics",
                            color:
                              "from-cyan-500/10 to-cyan-500/5 hover:border-cyan-500/40 border-cyan-500/25 text-cyan-400",
                          },
                          {
                            subject: "Physics",
                            label: "Physics Science",
                            color:
                              "from-violet-500/10 to-violet-500/5 hover:border-violet-500/40 border-violet-500/25 text-violet-400",
                          },
                          {
                            subject: "Chemistry",
                            label: "Chemistry Science",
                            color:
                              "from-orange-500/10 to-orange-500/5 hover:border-orange-500/40 border-orange-500/25 text-orange-400",
                          },
                          {
                            subject: "Biology",
                            label: "Biology Science",
                            color:
                              "from-emerald-500/10 to-emerald-500/5 hover:border-emerald-500/40 border-emerald-500/25 text-emerald-400",
                          },
                        ].map((q) => (
                          <button
                            key={q.subject}
                            onClick={() => navigate({ to: "/quizzes" })}
                            className={`p-4 rounded-xl border bg-gradient-to-br ${q.color} text-left transition-all duration-300 hover:-translate-y-0.5 active:scale-95 flex flex-col justify-between h-28`}
                          >
                            <span className="text-[10px] font-bold uppercase tracking-widest bg-zinc-950/50 px-2 py-0.5 rounded self-start">
                              S1-S4
                            </span>
                            <div>
                              <h4 className="font-bold text-sm text-white">{q.label}</h4>
                              <p className="text-[10px] text-zinc-400 mt-1">
                                Start interactive quiz assessment
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <MilestoneBadges />
                    <ProgressDashboard />
                    <KnowledgeGaps />
                    <div className="grid gap-6 md:grid-cols-2">
                      <BadgesDashboard />
                      <BadgesView />
                    </div>
                  </div>
                )}

                {activeTab === "tutor" && (
                  <div className="space-y-6">
                    <SocraticTutorChat />
                    <BreathingGuide />
                  </div>
                )}

                {activeTab === "projects" && (
                  <div className="space-y-6">
                    <StudentProjectsDashboard />
                    <PastSessionsList />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* PRINT-ONLY COMPONENT */}
          <PrintableSummary />
        </>
      )}

      {/* FLOATING ACTION ACTION BUTTON */}
      <QuickQuizButton />

      {/* 5-MINUTE PREVIEW EXPIRATION MODAL */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-8 text-center shadow-glow shadow-cyan-500/10 space-y-6"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Trophy className="h-8 w-8 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white">Guest Preview Expired!</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Your 5-minute guest session has completed. To save your points, badges, and
                  learning history, please create a registered account or sign in.
                </p>
              </div>
              <div className="space-y-3 pt-2">
                <button
                  onClick={() => {
                    localStorage.removeItem("guest_session_active");
                    localStorage.removeItem("guest_session_role");
                    localStorage.removeItem("guest_session_start");
                    window.location.href = "/login";
                  }}
                  className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-600 py-3.5 text-xs font-bold uppercase tracking-wider text-black shadow-glow shadow-cyan-500/10 transition-all"
                >
                  Register / Sign In
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI TUTOR EXPLANATION DIALOG MODAL */}
      <AnimatePresence>
        {selectedExplTask && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-glow shadow-black/80 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/40 px-2.5 py-1 rounded-md border border-cyan-500/20">
                    Tutor Explanation Engine
                  </span>
                  <h3 className="text-base font-black text-white mt-2 leading-tight">
                    {selectedExplTask.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedExplTask(null)}
                  className="p-1 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 leading-relaxed text-xs">
                <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-900 text-zinc-300">
                  <span className="text-[10px] font-bold uppercase text-zinc-500 block mb-1">
                    Assignment Problem Statement
                  </span>
                  <p className="font-semibold">{selectedExplTask.description}</p>
                </div>

                <div className="bg-cyan-950/20 p-4 rounded-xl border border-cyan-900/30 text-cyan-200">
                  <span className="text-[10px] font-bold uppercase text-cyan-400 block mb-1">
                    Lattys AI Tutor Guidance
                  </span>
                  <p>{selectedExplTask.tutorExplanation}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedExplTask(null)}
                className="w-full rounded-xl bg-zinc-900 hover:bg-zinc-800 py-2.5 text-xs font-bold text-zinc-300 transition-all"
              >
                Close Guidance Panel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Inline simple X component to prevent missing imports
function X(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
