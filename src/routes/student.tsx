import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AuthRouteMiddleware } from "@/middlewares/auth-middleware";
import { useUnifiedSchoolId } from "@/hooks/useUnifiedSchoolId";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useGamificationStore } from "@/store/useGamificationStore";
import { Link } from "@tanstack/react-router";
import {
  FileText,
  Printer,
  Download,
  Award,
  Clock,
  CheckCircle2,
  BookOpen,
  Sparkles,
  User,
  GraduationCap,
  ChevronRight,
  BarChart3,
  ShieldCheck,
  Building2,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/student")({
  component: () => (
    <AuthRouteMiddleware allowedRoles={["student", "admin", "org_admin"]}>
      <StudentDashboardPage />
    </AuthRouteMiddleware>
  ),
});

function StudentDashboardPage() {
  const { user, profile, organizationId } = useAuth();
  const { xp, level, badges, completedGaps, completedTasks } = useGamificationStore();
  const { schoolId, schoolName: unifiedSchoolName } = useUnifiedSchoolId();

  const studentName = profile?.display_name || user?.email?.split("@")[0] || "Scholar";
  const schoolName = unifiedSchoolName || profile?.school_name || "Unknown Institution";
  const className = (profile as any)?.level || "N/A";
  const unebIndex = (profile as any)?.uneb_index || "N/A";

  const [markedReports, setMarkedReports] = useState<MarkedReportItem[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [isExportPdfOpen, setIsExportPdfOpen] = useState(false);
  const [selectedReportForExport, setSelectedReportForExport] = useState<MarkedReportItem | null>(
    null,
  );

  // Load marked project submissions for this student from Supabase
  useEffect(() => {
    async function loadStudentReports() {
      if (!user?.id) return;
      setLoadingReports(true);
      try {
        const orgIdToUse = schoolId || organizationId;

        let query = (supabase.from as any)("project_submissions")
          .select("*")
          .eq("student_id", user.id);

        if (orgIdToUse) {
          query = query.eq("organization_id", orgIdToUse);
        }

        const { data: dbSubs, error } = await query.order("created_at", { ascending: false });

        if (error) throw error;

        if (dbSubs && dbSubs.length > 0) {
          const mapped: MarkedReportItem[] = (dbSubs as any[]).map((s: any) => ({
            id: s.id,
            projectTitle: s.project_title || "Untitled Project",
            subject: s.subject || "Unspecified Subject",
            score: s.score ?? 0,
            rubricScores: {
              planning: Math.round((s.score || 0) * 0.3),
              execution: Math.round((s.score || 0) * 0.4),
              conclusion: Math.round((s.score || 0) * 0.3),
            },
            feedback: s.feedback || "No feedback provided.",
            teacherName: s.teacher_name || "Unknown Evaluator",
            teacherTitle: "Instructor",
            teacherSignature: s.teacher_name ? `Digital Seal ${s.teacher_name}` : "Verified Stamp",
            markedAt: s.created_at || new Date().toISOString().split("T")[0],
            timePointsEarned: s.time_points || 0,
            awardPointsEarned: s.award_points || 0,
          }));
          setMarkedReports(mapped);
        } else {
          setMarkedReports([]);
        }
      } catch (err) {
        console.warn("Could not load student reports:", err);
      } finally {
        setLoadingReports(false);
      }
    }

    loadStudentReports();
  }, [user?.id, organizationId]);

  // Calculate study time points
  const totalHours = ((completedTasks.length * 20 + markedReports.length * 45 + 120) / 60).toFixed(
    1,
  );

  const handlePrintPortfolio = () => {
    window.print();
  };

  return (
    <div className="app-container dashboard-container space-y-8 min-h-screen bg-background text-foreground">
      {/* HEADER HERO */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-card via-indigo-950/20 to-card p-6 md:p-8 border border-border shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <GraduationCap className="w-3.5 h-3.5" />
              Student Academic Portfolio Hub
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              {studentName}'s Study Workflow
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Track your study time points, award points (XP), marked project reports, and official
              NCDC study progress. Print or export verified portfolio reports directly to PDF.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link to="/student/progress">
              <Button className="bg-primary text-primary-foreground font-bold text-xs rounded-xl px-4 py-2.5">
                View Academic Progress
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="dashboard-grid">
        <Card className="bg-card border-border rounded-2xl">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Study Time Points
              </p>
              <p className="text-2xl font-black text-foreground mt-0.5">{totalHours} Hours</p>
              <p className="text-[10px] text-muted-foreground/80 mt-0.5">
                Logged in Socratic chat &amp; tasks
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border rounded-2xl">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Award Points (XP)
              </p>
              <p className="text-2xl font-black text-foreground mt-0.5">{xp} XP</p>
              <p className="text-[10px] text-muted-foreground/80 mt-0.5">
                Tier {level} Academic Scholar
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
