import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useTransition } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

// New components & hooks imports
import { QuizEngine, type DynamicDailyTask } from "@/lib/quiz-engine";
import { RoleGate } from "@/components/RoleGate";
import { createRouteHead } from "@/lib/seo";
import { RoleGuard } from "@/components/RoleGuard";
import { useTermProgress } from "@/hooks/useTermProgress";

// Role-specific dashboard views
import { TeacherDashboard } from "@/components/dashboard/TeacherDashboard";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { StudentDashboard } from "@/components/dashboard/StudentDashboard";
import { DashboardSwitcher } from "@/components/dashboard/DashboardSwitcher";

import { AuthRouteMiddleware } from "@/middlewares/auth-middleware";
import { UserProfileCard } from "@/components/UserProfileCard";
import { QuickQuizButton } from "@/components/QuickQuizButton";
import { ExportPdfModal } from "@/components/ExportPdfModal";

export const Route = createFileRoute("/dashboard")({
  head: () =>
    createRouteHead({
      title: "My Study Hub & Dashboard",
      description:
        "Track study milestones, NCDC curriculum subject mastery, live term goals, and Socratic tutoring progress.",
      path: "/dashboard",
      keywords: [
        "Student Dashboard",
        "Cymatic Study Hub",
        "Uganda Education Progress",
        "Uganda Secondary Curriculum",
      ],
    }),
  component: () => (
    <AuthRouteMiddleware
      allowedRoles={[
        "student",
        "teacher",
        "independent_teacher",
        "instructor",
        "admin",
        "org_admin",
      ]}
    >
      <DashboardPage />
    </AuthRouteMiddleware>
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
  const { user, loading, profile, isTeacher, isAdmin, isGuestMode, organizationId } = useAuth();

  const navigate = useNavigate();
  const { completeTaskAndSync } = useTermProgress();
  const [, startTransition] = useTransition();

  // Dynamic daily tasks state
  const [tasks, setTasks] = useState<DynamicDailyTask[]>([]);
  const [showSnoozed, setShowSnoozed] = useState(false);
  const [selectedExplTask, setSelectedExplTask] = useState<DynamicDailyTask | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Filter tasks based on snoozed state
  const visibleTasks = tasks.filter((t) => (showSnoozed ? t.snoozed : !t.snoozed));

  // Real institutional students data states
  const [realStudents, setRealStudents] = useState<DashboardStudent[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [totalOrgProfiles, setTotalOrgProfiles] = useState<number>(0);

  // Teacher manual task builder state
  const [manualTitle, setManualTitle] = useState("");
  const [manualSubject, setManualSubject] = useState<"Math" | "Physics" | "Chemistry" | "Biology">(
    "Math",
  );
  const [manualType, setManualType] = useState<"quiz" | "project" | "interactive_question">("quiz");
  const [manualPoints, setManualPoints] = useState(15);
  const [manualDesc, setManualDesc] = useState("");
  const [manualExplanation, setManualExplanation] = useState("");

  const loadTasks = async () => {
    try {
      let query = (supabase.from as any)("dashboard_tasks").select("*");

      if (organizationId) {
        query = query.or(`organization_id.is.null,organization_id.eq.${organizationId}`);
      } else {
        query = query.is("organization_id", null);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (data) {
        const mappedTasks: any[] = (data as any[]).map((t: any) => ({
          ...t,
          taskType: t.task_type || "quiz",
          isCompleted: false, // In a real app, this would be fetched from task_completions
          priority: false,
          snoozed: false,
          snoozeCount: 0,
          tutorExplanation: t.tutor_explanation || "",
        }));
        setTasks(mappedTasks as DynamicDailyTask[]);
      }
    } catch (err) {
      console.error("Failed to load dashboard tasks:", err);
      setTasks([]);
    }
  };

  useEffect(() => {
    loadTasks();
    // Refresh when local storage updates
    window.addEventListener("storage", loadTasks);
    return () => window.removeEventListener("storage", loadTasks);
  }, [organizationId]);

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
        const targetId = (profile as any)?.organization_id || profile?.org_id;
        
        // Strict organization filtering to satisfy requirement
        if (targetId) {
          query = query.eq("org_id", targetId);
        } else if (profile?.school_name) {
          query = query.eq("school_name", profile.school_name);
        } else {
          // If no organization linkage, return empty to prevent cross-org data leakage
          setRealStudents([]);
          setLoadingStudents(false);
          return;
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
            const { data: pointsData } = await (supabase.from as any)("user_points")
              .select("user_id, points")
              .in("user_id", studentIds);

            if (pointsData) {
              pointsData.forEach((p: any) => {
                pointsMap[p.user_id] = (pointsMap[p.user_id] || 0) + (p.points || 0);
              });
            }
          }

          const mapped = (studentProfiles as any[]).map((p: any) => {
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
  }, [
    user?.id,
    isTeacher,
    isAdmin,
    profile?.school_id,
    (profile as any)?.org_id,
    profile?.school_name,
    isGuestMode,
  ]);

  const handleTeacherCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle || !manualDesc) {
      toast.error("Please fill in the title and description.");
      return;
    }

    try {
      const { error } = await (supabase.from as any)("dashboard_tasks").insert({
        title: manualTitle,
        subject: manualSubject,
        description: manualDesc,
        task_type: manualType,
        points: manualPoints,
        tutor_explanation: manualExplanation,
        created_by: "teacher",
        organization_id: organizationId,
      });

      if (error) throw error;

      toast.success("📝 Assignment Published!", {
        description: `"${manualTitle}" has been set for all students successfully.`,
      });

      // Reset Form
      setManualTitle("");
      setManualDesc("");
      setManualExplanation("");
      loadTasks();
    } catch (err) {
      console.error("Failed to publish assignment:", err);
      toast.error("Failed to publish assignment to institutional database.");
    }
  };

  const [dailyPoints, setDailyPoints] = useState(0);
  const [activeTab, setActiveTab] = useState<"missions" | "quizzes" | "tutor" | "projects">(
    "missions",
  );

  // Fetch daily points on mount or when user changes
  useEffect(() => {
    const fetchDailyPoints = async () => {
      if (user?.id) {
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
  }, [user?.id]); // Fixed dependency

  // Points rising animation logic
  const [points, setPoints] = useState(0);
  useEffect(() => {
    if (points < dailyPoints) {
      const diff = dailyPoints - points;
      const step = Math.max(1, Math.floor(diff / 10));
      const timer = setTimeout(() => setPoints((prev) => Math.min(prev + step, dailyPoints)), 30);
      return () => clearTimeout(timer);
    }
  }, [points, dailyPoints]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-muted-foreground animate-pulse">
        Gathering your study materials...
      </div>
    );
  }

  return (
    <div className="app-container dashboard-container space-y-8 min-h-screen bg-background text-foreground">
      {/* USER PROFILE & SCHOOL ID BANNER */}
      <UserProfileCard />

      {/* ADMIN QUICK NAV BANNER */}
      <DashboardSwitcher />

      <RoleGate.Admin>
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
                Manage teachers, oversee student cohorts across Senior 1 to Senior 6, monitor
                performance analytics, and issue official School IDs.
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
      </RoleGate.Admin>

      {/* RENDER ACTIVE DASHBOARD ACCORDING TO ROLE VIA CENTRALIZED RoleGuard */}
      <RoleGuard
        admin={<AdminDashboard profile={profile} />}
        teacher={
          <TeacherDashboard
            profile={profile}
            realStudents={realStudents}
            loadingStudents={loadingStudents}
            manualTitle={manualTitle}
            setManualTitle={setManualTitle}
            manualSubject={manualSubject}
            setManualSubject={setManualSubject}
            manualType={manualType}
            setManualType={setManualType}
            manualDesc={manualDesc}
            setManualDesc={setManualDesc}
            manualExplanation={manualExplanation}
            setManualExplanation={setManualExplanation}
            handleTeacherCreateTask={handleTeacherCreateTask}
          />
        }
        student={
          <StudentDashboard
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            setIsPdfModalOpen={setIsPdfModalOpen}
            showSnoozed={showSnoozed}
            setShowSnoozed={setShowSnoozed}
            visibleTasks={visibleTasks}
            loadTasks={loadTasks}
            setSelectedExplTask={setSelectedExplTask}
            completeTaskAndSync={completeTaskAndSync}
          />
        }
      />

      <AnimatePresence>
        {selectedExplTask && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-glow shadow-black/80 space-y-4"
              onClick={(e) => e.stopPropagation()}
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

      <ExportPdfModal isOpen={isPdfModalOpen} onClose={() => setIsPdfModalOpen(false)} />
    </div>
  );
}
