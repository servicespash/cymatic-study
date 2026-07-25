import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useTransition } from "react";
import {
  LogOut,
  Settings,
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
  Target,
  Users,
  LayoutDashboard,
  TrendingUp,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Share } from "@capacitor/share";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { TermGoalGauge } from "@/components/TermGoalGauge";
import { SearchEngine } from "@/components/SearchEngine";
import { CurriculumToggle } from "@/components/CurriculumToggle";
import StudentProjectsDashboard from "@/components/StudentProjectsDashboard";
import { ProgressDashboard } from "@/components/ProgressDashboard";
import { KnowledgeGaps } from "@/components/KnowledgeGaps";
import { BadgesDashboard } from "@/components/BadgesDashboard";
import { TeacherGradingStation } from "@/components/TeacherGradingStation";
import { BadgesView } from "@/components/BadgesView";
import { StudyGoalsCard } from "@/components/StudyGoalsCard";
import { PastSessionsList } from "@/components/PastSessionsList";
import { PrintableSummary } from "@/components/PrintableSummary";
import { BreathingGuide } from "@/components/BreathingGuide";
import { TermGoalChallengeCard } from "@/components/TermGoalChallengeCard";
import { TermProgressChart } from "@/components/TermProgressChart";

// New components & hooks imports
import { MilestoneBadges } from "@/components/MilestoneBadges";
import { TermSummaryPanel } from "@/components/TermSummaryPanel";
import { QuickQuizButton } from "@/components/QuickQuizButton";
import { TaskContextMenu } from "@/components/TaskContextMenu";
import { useTermProgress } from "@/hooks/useTermProgress";
import { QuizEngine, type DynamicDailyTask } from "@/lib/quiz-engine";
import { MarkingDesk } from "@/components/MarkingDesk";
import { StudentActivityDashboard } from "@/components/StudentActivityDashboard";
import { SocraticTutorChat } from "@/components/SocraticTutorChat";
import { SubjectPracticeReminder } from "@/components/SubjectPracticeReminder";
import { UserProfileCard } from "@/components/UserProfileCard";

import { RoleGuard } from "@/components/RoleGuard";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "My Hub — Cymatic Study" }] }),
  component: () => (
    <RoleGuard allowedRoles={["student", "teacher", "independent_teacher", "instructor", "admin", "org_admin"]}>
      <DashboardPage />
    </RoleGuard>
  ),
});

interface DashboardStudent {
  id: string;
  name: string;
  class: string;
  status: string;
  score: string;
  points: number;
}

function DashboardPage() {
  const { user, loading, signOut, profile, isTeacher, isAdmin, isGuestMode } = useAuth();

  const navigate = useNavigate();
  const { completeTaskAndSync } = useTermProgress();
  const [isPending, startTransition] = useTransition();

  // Dynamic daily tasks state
  const [tasks, setTasks] = useState<DynamicDailyTask[]>([]);
  const [showSnoozed, setShowSnoozed] = useState(false);
  const [selectedExplTask, setSelectedExplTask] = useState<DynamicDailyTask | null>(null);

  // Real institutional students data states
  const [realStudents, setRealStudents] = useState<DashboardStudent[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [totalOrgProfiles, setTotalOrgProfiles] = useState<number | null>(null);

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

  // Fetch real institutional student data
  useEffect(() => {
    if ((!isTeacher && !isAdmin) || !user?.id) return;

    const fetchRealData = async () => {
      setLoadingStudents(true);
      try {
        console.log("[Dashboard] Fetching real institutional data for role check...", {
          isTeacher,
          isAdmin,
        });
        let query = supabase.from("profiles").select("*");
        if (profile?.org_id) {
          query = query.eq("org_id", profile.org_id);
        } else if (profile?.school_name) {
          query = query.eq("school_name", profile.school_name);
        }

        const { data: profilesData, error } = await query;
        if (error) throw error;

        if (profilesData) {
          setTotalOrgProfiles(profilesData.length);

          // Filter for student accounts (or empty roles which are default students)
          const studentProfiles = profilesData.filter(
            (p) => p.role === "student" || !p.role || p.role === "",
          );

          const studentIds = studentProfiles.map((p) => p.user_id).filter(Boolean);
          const pointsMap: Record<string, number> = {};

          if (studentIds.length > 0) {
            const { data: pointsData } = await supabase
              .from("user_points")
              .select("user_id, points")
              .in("user_id", studentIds);

            if (pointsData) {
              pointsData.forEach((p) => {
                pointsMap[p.user_id] = (pointsMap[p.user_id] || 0) + (p.points || 0);
              });
            }
          }

          const mapped = studentProfiles.map((p) => {
            const totalPoints = pointsMap[p.user_id] || 0;
            let status = "Getting Started";
            if (totalPoints > 150) status = "All Completed";
            else if (totalPoints > 50) status = "Ahead of Pace";
            else if (totalPoints > 0) status = "On Track";

            return {
              id: p.id,
              name: p.full_name || p.display_name || p.username || "Student Scholar",
              class: p.level || "Senior 3",
              status: status,
              score: `${Math.min(100, Math.max(10, Math.round(totalPoints / 2.5)))}%`,
              points: totalPoints,
            };
          });

          // Sort by points descending
          mapped.sort((a, b) => b.points - a.points);
          setRealStudents(mapped);
        }
      } catch (err) {
        console.error("Error fetching institutional student roll:", err);
      } finally {
        setLoadingStudents(false);
      }
    };

    void fetchRealData();
  }, [user, isTeacher, isAdmin, profile, isGuestMode]);

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
  const schoolName =
    profile?.school_name || user?.user_metadata?.school_name || "Uganda Secondary School";
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
    const fetchDailyPoints = async () => {
      if (user) {
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
  }, [user, points, dailyPoints]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-muted-foreground animate-pulse">
        Gathering your study materials...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
      {/* USER PROFILE & SCHOOL ID BANNER */}
      <UserProfileCard />

      {/* ADMIN QUICK NAV BANNER */}
      {isAdmin && (
        <Card className="border-blue-600/30 bg-gradient-to-r from-blue-950/40 via-indigo-950/20 to-black p-6 text-white shadow-xl animate-in fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-600 text-white font-bold text-[10px] uppercase">
                  Institutional Admin Authority
                </Badge>
                <span className="text-xs text-blue-400 font-mono font-bold">
                  {profile?.school_id || profile?.org_id || "SCH-UG-2026"}
                </span>
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">
                Institutional Command Node Available
              </h3>
              <p className="text-xs text-zinc-400">
                Manage teachers, oversee student cohorts across Senior 1 to Senior 6, monitor performance analytics, and issue official School IDs.
              </p>
            </div>
            <Button
              onClick={() => navigate({ to: "/admin/dashboard" })}
              className="bg-blue-600 hover:bg-blue-500 text-white font-black shadow-lg shadow-blue-600/30 shrink-0"
            >
              Open Command Console →
            </Button>
          </div>
        </Card>
      )}

      {/* RENDER ACTIVE DASHBOARD ACCORDING TO ROLE */}
      {isTeacher ? (
        <div className="space-y-8 animate-in fade-in duration-700">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-white uppercase">
                Teacher Hub
              </h2>
              <p className="text-zinc-500 text-sm">
                Managing curriculum progress for {profile?.school_name || "Institutional Stream"}.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => navigate({ to: "/marking" })}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Open Marking Desk
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate({ to: "/chat" })}
                className="border-zinc-800 bg-zinc-900/50 text-zinc-300"
              >
                <MessageSquare className="mr-2 h-4 w-4" /> Class Discussions
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-zinc-800 bg-zinc-950/50 backdrop-blur-xl">
              <CardHeader className="p-4">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                  Student Roll
                </CardTitle>
                <CardDescription className="text-[10px]">
                  Total learners in your assigned streams.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-3xl font-black text-white">{realStudents.length}</p>
              </CardContent>
            </Card>
            <Card className="border-zinc-800 bg-zinc-950/50 backdrop-blur-xl">
              <CardHeader className="p-4">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                  Avg Competency
                </CardTitle>
                <CardDescription className="text-[10px]">
                  Mean score across all assessments.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-3xl font-black text-amber-500">
                  {realStudents.length > 0
                    ? `${(realStudents.reduce((acc, s) => acc + parseInt(s.score), 0) / realStudents.length).toFixed(1)}%`
                    : "84.5%"}
                </p>
              </CardContent>
            </Card>
            <Card className="border-zinc-800 bg-zinc-950/50 backdrop-blur-xl">
              <CardHeader className="p-4">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                  Syllabus Coverage
                </CardTitle>
                <CardDescription className="text-[10px]">
                  Completed curriculum milestones.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-3xl font-black text-emerald-500">
                  {realStudents.length > 0
                    ? `${Math.min(100, Math.round(realStudents.reduce((acc, s) => acc + (s.points || 0), 0) / (realStudents.length * 10)) + 40)}%`
                    : "68%"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* TEACHER EVALUATION & MARKING WORKSTATION */}
          <TeacherGradingStation />

          <div className="space-y-6">
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              Active Student Stream
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loadingStudents ? (
                <div className="col-span-2 py-12 text-center text-zinc-500 text-sm animate-pulse">
                  Querying institutional database...
                </div>
              ) : realStudents.length === 0 ? (
                <div className="col-span-2 py-12 text-center border-2 border-dashed border-zinc-900 rounded-3xl text-zinc-600 italic">
                  No students have linked to your school ID yet.
                </div>
              ) : (
                realStudents.map((s, idx) => (
                  <Card
                    key={s.id || `student-${idx}`}
                    className="border-zinc-900 bg-zinc-950/40 hover:border-zinc-700 transition-colors"
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-xs uppercase text-zinc-400">
                          {s.name?.substring(0, 2) || "??"}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-100">{s.name}</p>
                          <p className="text-[10px] text-zinc-500 font-mono uppercase">
                            {s.class || "No Level"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-[9px] border-zinc-800 text-zinc-500"
                        >
                          {s.score}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate({ to: `/chat` })}
                          className="text-zinc-500 hover:text-white h-8 w-8 p-0"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          <div className="pt-8 border-t border-zinc-900">
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2 mb-6">
              <Plus className="h-4 w-4 text-cyan-500" />
              Publish S1-S4 Daily Assignment
            </h3>
            <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-2xl">
              <form onSubmit={handleTeacherCreateTask} className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">
                    Task Title
                  </label>
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
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setManualSubject(e.target.value as any)
                    }
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
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setManualType(e.target.value as any)
                    }
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
                  <Button
                    type="submit"
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold h-11"
                  >
                    Publish Assignment to Dashboard
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : isAdmin ? (
        <div className="space-y-8 animate-in fade-in duration-700">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-white uppercase">
                Institutional Command
              </h2>
              <p className="text-zinc-500 text-sm">
                Monitoring overall performance for {profile?.school_name || "Campus Network"}.
              </p>
            </div>
            <Button
              onClick={() => navigate({ to: "/admin/dashboard" })}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              <LayoutDashboard className="mr-2 h-4 w-4" /> Go to Control Center
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card
              className="border-zinc-800 bg-zinc-950/50 backdrop-blur-xl p-8 text-center space-y-4 hover:border-indigo-500/50 transition-all cursor-pointer group"
              onClick={() => navigate({ to: "/admin/dashboard" })}
            >
              <div className="mx-auto h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="h-8 w-8 text-indigo-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-white uppercase">Institutional Analytics</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  View grade distributions, syllabus mastery rates, and teacher performance metrics
                  across all departments.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full border-zinc-800 bg-zinc-900/50 text-zinc-300"
              >
                View Macro Metrics
              </Button>
            </Card>

            <Card
              className="border-zinc-800 bg-zinc-950/50 backdrop-blur-xl p-8 text-center space-y-4 hover:border-emerald-500/50 transition-all cursor-pointer group"
              onClick={() => navigate({ to: "/admin/dashboard" })}
            >
              <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="h-8 w-8 text-emerald-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-white uppercase">Faculty Management</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Manage instructor access, verify licensing credentials, and identify grading
                  bottlenecks in real-time.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full border-zinc-800 bg-zinc-900/50 text-zinc-300"
              >
                Manage Staff Hub
              </Button>
            </Card>
          </div>

          <div className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-3xl text-center space-y-4">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">
              System Health & Operations
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                <p className="text-[10px] font-bold text-zinc-500 uppercase">Latency</p>
                <p className="text-lg font-black text-emerald-500">24ms</p>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                <p className="text-[10px] font-bold text-zinc-500 uppercase">Traffic</p>
                <p className="text-lg font-black text-blue-500">Normal</p>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                <p className="text-[10px] font-bold text-zinc-500 uppercase">Uptime</p>
                <p className="text-lg font-black text-white">99.9%</p>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                <p className="text-[10px] font-bold text-zinc-500 uppercase">Security</p>
                <p className="text-lg font-black text-amber-500">Active</p>
              </div>
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
                          {visibleTasks.map((task, idx) => (
                            <TaskContextMenu
                              key={task.id || `task-${idx}`}
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
