import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/RoleGuard";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useGamificationStore } from "@/store/useGamificationStore";
import { PrintableSummary, MarkedReportItem } from "@/components/PrintableSummary";
import { ExportPdfModal } from "@/components/ExportPdfModal";
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
    <RoleGuard allowedRoles={["student", "admin", "org_admin"]}>
      <StudentDashboardPage />
    </RoleGuard>
  ),
});

function StudentDashboardPage() {
  const { user, profile } = useAuth();
  const { xp, level, badges, completedGaps, completedTasks } = useGamificationStore();

  const studentName = profile?.display_name || user?.email?.split("@")[0] || "Scholar Learner";
  const schoolName =
    user?.user_metadata?.school_name || profile?.school_id || "Cymatic Secondary Academy";
  const className = "Senior 3 (S3 - West Stream)";
  const unebIndex = "U2026/089/STD";

  const [markedReports, setMarkedReports] = useState<MarkedReportItem[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [isExportPdfOpen, setIsExportPdfOpen] = useState(false);
  const [selectedReportForExport, setSelectedReportForExport] = useState<MarkedReportItem | null>(
    null,
  );

  // Load marked project submissions for this student from Supabase or local storage fallback
  useEffect(() => {
    async function loadStudentReports() {
      setLoadingReports(true);
      try {
        const { data: dbSubs } = await supabase
          .from("project_submissions")
          .select("*")
          .order("created_at", { ascending: false });

        if (dbSubs && dbSubs.length > 0) {
          const mapped: MarkedReportItem[] = dbSubs.map((s) => ({
            id: s.id,
            projectTitle: s.project_title || "Continuous Assessment Project",
            subject: s.subject || "General Science",
            score: s.score ?? 85,
            rubricScores: {
              planning: Math.round((s.score || 85) * 0.3),
              execution: Math.round((s.score || 85) * 0.4),
              conclusion: Math.round((s.score || 85) * 0.3),
            },
            feedback: s.feedback || "Good research methodology and practical execution.",
            teacherName: s.teacher_name || "Faculty Evaluator",
            teacherTitle: "Subject Specialist",
            teacherSignature: s.teacher_name ? `Digital Seal ${s.teacher_name}` : "Verified Stamp",
            markedAt: s.created_at || "2026-07-24",
            timePointsEarned: 5,
            awardPointsEarned: 50,
          }));
          setMarkedReports(mapped);
        } else {
          // Default sample marked reports for initial view
          setMarkedReports([
            {
              id: "RPT-101",
              projectTitle: "Solar Thermal Water Purifier Prototype",
              subject: "Physics",
              score: 88,
              rubricScores: { planning: 27, execution: 36, conclusion: 25 },
              feedback:
                "Exemplary thermal insulation design. Excellent understanding of solar radiation principles.",
              teacherName: "Mr. Okello David",
              teacherTitle: "Head of Physics Department",
              teacherSignature: "Signed by Mr. Okello (Seal 0x88F)",
              markedAt: "2026-07-24",
              timePointsEarned: 6,
              awardPointsEarned: 60,
            },
            {
              id: "RPT-102",
              projectTitle: "Soil pH Remediation with Coffee Husk Biochar",
              subject: "Chemistry",
              score: 92,
              rubricScores: { planning: 28, execution: 38, conclusion: 26 },
              feedback: "Highly practical agriculture chemistry application. Solid data analysis.",
              teacherName: "Dr. Mukasa Sarah",
              teacherTitle: "Senior Lecturer",
              teacherSignature: "Signed by Dr. Mukasa (Seal 0x94A)",
              markedAt: "2026-07-22",
              timePointsEarned: 8,
              awardPointsEarned: 80,
            },
          ]);
        }
      } catch (err) {
        console.warn("Could not load student reports:", err);
      } finally {
        setLoadingReports(false);
      }
    }

    loadStudentReports();
  }, []);

  // Calculate study time points
  const totalHours = ((completedTasks.length * 20 + markedReports.length * 45 + 120) / 60).toFixed(
    1,
  );

  const handlePrintPortfolio = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* HEADER HERO */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-zinc-900 via-indigo-950 to-zinc-900 p-6 md:p-8 border border-zinc-800 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <GraduationCap className="w-3.5 h-3.5" />
              Student Academic Portfolio Hub
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {studentName}'s Study Workflow
            </h1>
            <p className="text-xs md:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Track your study time points, award points (XP), marked project reports, and official
              NCDC study progress. Print or export verified portfolio reports directly to PDF.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              onClick={handlePrintPortfolio}
              className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold text-xs rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              <Printer className="w-4 h-4" />
              Print Portfolio Report
            </Button>
            <Button
              onClick={() => {
                setSelectedReportForExport(null);
                setIsExportPdfOpen(true);
              }}
              variant="outline"
              className="border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl px-4 py-2.5 flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              Export Branded PDF
            </Button>
          </div>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-900/80 border-zinc-800 rounded-2xl">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                Study Time Points
              </p>
              <p className="text-2xl font-black text-white mt-0.5">{totalHours} Hours</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                Logged in Socratic chat &amp; tasks
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/80 border-zinc-800 rounded-2xl">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                Award Points (XP)
              </p>
              <p className="text-2xl font-black text-white mt-0.5">{xp} XP</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">Tier {level} Academic Scholar</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/80 border-zinc-800 rounded-2xl">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                Marked Reports
              </p>
              <p className="text-2xl font-black text-white mt-0.5">
                {markedReports.length} Projects
              </p>
              <p className="text-[10px] text-zinc-500 mt-0.5">Evaluated with rubric scores</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/80 border-zinc-800 rounded-2xl">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                Remediated Gaps
              </p>
              <p className="text-2xl font-black text-white mt-0.5">
                {completedGaps.length} Mastered
              </p>
              <p className="text-[10px] text-zinc-500 mt-0.5">Diagnostic checkpoints clear</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MARKED STUDY REPORTS SECTION */}
      <Card className="bg-zinc-900/80 border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        <CardHeader className="border-b border-zinc-800/80 bg-zinc-900/50 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Marked Study Reports &amp; Faculty Evaluations
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400 mt-1">
                Your graded project submissions, rubric breakdown, time points earned, and teacher
                signatures.
              </CardDescription>
            </div>
            <Button
              onClick={handlePrintPortfolio}
              size="sm"
              variant="outline"
              className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-xl gap-2"
            >
              <Printer className="w-3.5 h-3.5" />
              Print All Reports
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {markedReports.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-sm">
              No marked reports available yet. Submit project workflows in the Project Sandbox to
              receive teacher evaluations.
            </div>
          ) : (
            markedReports.map((report) => (
              <div
                key={report.id}
                className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 bg-indigo-950/60 px-2.5 py-0.5 rounded-md border border-indigo-500/20">
                      {report.subject} Assessment
                    </span>
                    <h3 className="text-base font-bold text-white mt-1">{report.projectTitle}</h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs text-zinc-400 block">Overall Score</span>
                      <span className="text-xl font-black text-emerald-400">{report.score}%</span>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedReportForExport(report);
                        setIsExportPdfOpen(true);
                      }}
                      size="sm"
                      className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-xl px-3"
                    >
                      <Download className="w-3.5 h-3.5 mr-1" />
                      PDF
                    </Button>
                  </div>
                </div>

                {/* Rubric Breakdown */}
                {report.rubricScores && (
                  <div className="grid grid-cols-3 gap-2 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/50 text-xs">
                    <div>
                      <span className="text-zinc-500 text-[10px] uppercase block">
                        Planning &amp; Design
                      </span>
                      <span className="font-bold text-zinc-200">
                        {report.rubricScores.planning} / 30
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] uppercase block">
                        Practical Execution
                      </span>
                      <span className="font-bold text-zinc-200">
                        {report.rubricScores.execution} / 40
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] uppercase block">
                        Conclusion &amp; Output
                      </span>
                      <span className="font-bold text-zinc-200">
                        {report.rubricScores.conclusion} / 30
                      </span>
                    </div>
                  </div>
                )}

                {/* Feedback & Teacher Signature */}
                {report.feedback && (
                  <p className="text-xs text-zinc-300 italic bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/40">
                    "{report.feedback}"
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400 pt-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    <span>
                      Evaluated by: <strong className="text-white">{report.teacherName}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-amber-400 font-semibold">
                      +{report.awardPointsEarned || 50} Award XP
                    </span>
                    <span className="text-teal-400 font-semibold">
                      +{report.timePointsEarned || 5} Study Hours Credited
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* PRINTABLE COMPONENT */}
      <PrintableSummary
        customStudentName={studentName}
        customSchoolName={schoolName}
        customClassName={className}
        customUnebIndex={unebIndex}
        markedReports={markedReports}
      />

      {/* EXPORT PDF MODAL */}
      <ExportPdfModal
        isOpen={isExportPdfOpen}
        onClose={() => setIsExportPdfOpen(false)}
        title={
          selectedReportForExport
            ? selectedReportForExport.projectTitle
            : "Student Academic Portfolio"
        }
        subject={selectedReportForExport ? selectedReportForExport.subject : "Comprehensive"}
        docType="study_chart"
        content={[
          {
            sectionTitle: "1. Portfolio Overview",
            body: [
              `Student Holder: ${studentName}`,
              `School Institution: ${schoolName}`,
              `Class Academic Level: ${className}`,
              `UNEB Centre Reference: ${unebIndex}`,
              `Total Study Time Points: ${totalHours} Hours`,
              `Total Award Points: ${xp} XP Points (Tier ${level})`,
            ],
          },
          {
            sectionTitle: "2. Marked Study Reports & Rubric Assessments",
            body: (selectedReportForExport ? [selectedReportForExport] : markedReports).map(
              (r) => ({
                key: `${r.projectTitle} (${r.subject})`,
                value: `Score: ${r.score}% | Evaluator: ${r.teacherName} | Feedback: ${r.feedback}`,
              }),
            ),
          },
          {
            sectionTitle: "3. Remediated Knowledge Gaps",
            body:
              completedGaps.length > 0
                ? completedGaps.map((g) => `Mastered Concept: ${g}`)
                : ["All foundational diagnostic checks complete."],
          },
        ]}
      />
    </div>
  );
}
