import { createFileRoute } from "@tanstack/react-router";
import { AuthRouteMiddleware } from "@/middlewares/auth-middleware";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Award, Clock, ShieldCheck, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MarkedReportItem } from "@/components/PrintableSummary";
import { useGamificationStore } from "@/store/useGamificationStore";

export const Route = createFileRoute("/student/progress")({
  component: () => (
    <AuthRouteMiddleware allowedRoles={["student", "admin", "org_admin"]}>
      <StudentProgressPage />
    </AuthRouteMiddleware>
  ),
});

function StudentProgressPage() {
  const { user } = useAuth();
  const { completedTasks, xp, level, completedGaps } = useGamificationStore();
  const [markedReports, setMarkedReports] = useState<MarkedReportItem[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  useEffect(() => {
    async function loadStudentReports() {
      if (!user?.id) return;
      try {
        const { data: dbSubs, error } = await supabase
          .from("project_submissions")
          .select("*")
          .eq("student_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const mapped: MarkedReportItem[] = (dbSubs || []).map((s: any) => ({
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
      } catch (err) {
        console.warn("Could not load student reports:", err);
      } finally {
        setLoadingReports(false);
      }
    }
    loadStudentReports();
  }, [user?.id]);

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-black">Academic Progress</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award /> XP & Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{xp} XP</p>
            <p>Level {level}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock /> Gaps Mastered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{completedGaps.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Marked Study Reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {markedReports.map((report) => (
            <div key={report.id} className="p-4 border rounded-xl bg-muted/20">
              <h3 className="font-bold">{report.projectTitle}</h3>
              <p>Score: {report.score}%</p>
              <p className="text-sm italic text-muted-foreground">{report.feedback}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
