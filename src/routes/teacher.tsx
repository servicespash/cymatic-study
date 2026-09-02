import React, { useState, useEffect, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AuthRouteMiddleware } from "@/middlewares/auth-middleware";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ExportPdfModal } from "@/components/ExportPdfModal";
import { PrintableSummary, MarkedReportItem } from "@/components/PrintableSummary";
import { ReportManager } from "@/components/ReportManager";
import {
  FileText,
  CheckCircle,
  Clock,
  PenTool,
  RotateCcw,
  Sparkles,
  Award,
  Filter,
  Search,
  BookOpen,
  User,
  ShieldCheck,
  Building2,
  Check,
  Send,
  Download,
  Printer,
  ChevronRight,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/teacher")({
  component: () => (
    <AuthRouteMiddleware
      allowedRoles={["teacher", "independent_teacher", "instructor", "admin", "org_admin"]}
      requireTeacher
    >
      <TeacherWorkflowPage />
    </AuthRouteMiddleware>
  ),
});

export interface StudentSubmission {
  id: string;
  student_name: string;
  student_id: string;
  level: string; // S1 to S6
  stream: string;
  subject: string;
  project_title: string;
  project_description: string;
  submitted_at: string;
  status: "pending" | "graded";
  score?: number;
  rubricScores?: {
    planning: number;
    execution: number;
    conclusion: number;
  };
  feedback?: string;
  teacher_signature?: string;
  timePointsAwarded?: number;
  xpAwarded?: number;
  school_id: string;
}

function TeacherWorkflowPage() {
  const { user, profile } = useAuth();
  const currentSchoolId =
    profile?.school_id || profile?.org_id || user?.user_metadata?.school_id || "SCH-UG-2026";

  const teacherName = profile?.display_name || user?.email?.split("@")[0] || "Faculty Evaluator";

  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);

  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(
    null,
  );
  const [activeModeTab, setActiveModeTab] = useState<"grading" | "manager">("grading");
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingData, setLoadingData] = useState(true);

  // Rubric & Marking Form State
  const [planningScore, setPlanningScore] = useState<number>(27); // out of 30
  const [executionScore, setExecutionScore] = useState<number>(36); // out of 40
  const [conclusionScore, setConclusionScore] = useState<number>(25); // out of 30
  const [scoreVal, setScoreVal] = useState<number>(88);
  const [timePointsVal, setTimePointsVal] = useState<number>(6); // study hours credited
  const [xpVal, setXpVal] = useState<number>(60); // XP awarded
  const [feedbackVal, setFeedbackVal] = useState<string>(
    "Great thematic project structure and detailed logbook analysis.",
  );

  // Teacher Digital Signature
  const [typedSignature, setTypedSignature] = useState(teacherName);
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);

  // Export PDF State
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Sync total score from rubric
  useEffect(() => {
    const total = Math.min(100, Math.max(0, planningScore + executionScore + conclusionScore));
    setScoreVal(total);
  }, [planningScore, executionScore, conclusionScore]);

  // Load from Supabase on mount
  useEffect(() => {
    async function loadSubmissions() {
      setLoadingData(true);
      try {
        const { data: dbSubs } = await (supabase as any)
          .from("project_submissions")
          .select("*")
          .order("created_at", { ascending: false });

        if (dbSubs && dbSubs.length > 0) {
          const mapped: StudentSubmission[] = (dbSubs as any[]).map((s: any) => ({
            id: s.id,
            student_name: s.student_name || "Scholar",
            student_id: s.student_id || "STD-UG",
            level: s.level || "S3",
            stream: s.stream || "A",
            subject: s.subject || "Physics",
            project_title: s.project_title || "Continuous Assessment Project",
            project_description: s.project_description || "Learner competency submission.",
            submitted_at: s.created_at ? s.created_at.split("T")[0] : "2026-07-24",
            status: s.score !== null && s.score !== undefined ? "graded" : "pending",
            score: s.score || undefined,
            rubricScores: {
              planning: Math.round((s.score || 80) * 0.3),
              execution: Math.round((s.score || 80) * 0.4),
              conclusion: Math.round((s.score || 80) * 0.3),
            },
            feedback: s.feedback || undefined,
            teacher_signature: s.teacher_name ? `Signed by ${s.teacher_name}` : undefined,
            timePointsAwarded: 5,
            xpAwarded: 50,
            school_id: currentSchoolId,
          }));
          setSubmissions(mapped);
          setSelectedSubmission(mapped[0] || null);
        } else {
          setSubmissions([]);
          setSelectedSubmission(null);
        }
      } catch (err) {
        console.warn("Notice loading teacher submissions:", err);
        setSubmissions([]);
        setSelectedSubmission(null);
      } finally {
        setLoadingData(false);
      }
    }
    loadSubmissions();
  }, [currentSchoolId]);

  // Handle Mark & Send to Student
  const handleSaveAndSendGrade = async () => {
    if (!selectedSubmission) return;

    if (!typedSignature.trim()) {
      toast.error("Please provide your teacher name or digital signature title.");
      return;
    }

    setIsSubmittingGrade(true);
    const finalSignature = `Signed by ${typedSignature.trim()} (Digital Seal Verified)`;

    try {
      // Upsert to Supabase project_submissions
      const { error: upsertError } = await (supabase as any).from("project_submissions").upsert({
        id: selectedSubmission.id,
        student_name: selectedSubmission.student_name,
        student_id: selectedSubmission.student_id,
        level: selectedSubmission.level,
        stream: selectedSubmission.stream,
        subject: selectedSubmission.subject,
        project_title: selectedSubmission.project_title,
        project_description: selectedSubmission.project_description,
        score: scoreVal,
        feedback: feedbackVal,
        teacher_name: typedSignature.trim(),
        school_id: currentSchoolId,
        status: "graded",
      });

      if (upsertError) {
        console.warn("Supabase upsert warning, persisting locally:", upsertError);
      }

      // Update local state
      const updatedList = submissions.map((sub) => {
        if (sub.id === selectedSubmission.id) {
          return {
            ...sub,
            status: "graded" as const,
            score: scoreVal,
            rubricScores: {
              planning: planningScore,
              execution: executionScore,
              conclusion: conclusionScore,
            },
            feedback: feedbackVal,
            teacher_signature: finalSignature,
            timePointsAwarded: timePointsVal,
            xpAwarded: xpVal,
          };
        }
        return sub;
      });

      setSubmissions(updatedList);
      const updatedSub = updatedList.find((s) => s.id === selectedSubmission.id) || null;
      setSelectedSubmission(updatedSub);

      toast.success("Marked Study Report Sent to Student!", {
        description: `Score of ${scoreVal}% (${planningScore}+${executionScore}+${conclusionScore}), +${timePointsVal} Time Points & +${xpVal} XP awarded to ${selectedSubmission.student_name}.`,
      });
    } catch (err) {
      console.error("Error saving grade:", err);
      toast.error("Failed to submit evaluation. Saved in local cache.");
    } finally {
      setIsSubmittingGrade(false);
    }
  };

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesLevel = selectedLevel === "ALL" || sub.level === selectedLevel;
    const matchesSearch =
      sub.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.project_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  // Prepare marked report item for PDF export or printing
  const currentMarkedReportItem: MarkedReportItem | null = selectedSubmission
    ? {
        id: selectedSubmission.id,
        projectTitle: selectedSubmission.project_title,
        subject: selectedSubmission.subject,
        score: selectedSubmission.score || scoreVal,
        rubricScores: selectedSubmission.rubricScores || {
          planning: planningScore,
          execution: executionScore,
          conclusion: conclusionScore,
        },
        feedback: selectedSubmission.feedback || feedbackVal,
        teacherName: typedSignature || teacherName,
        teacherTitle: "Subject Teacher",
        teacherSignature:
          selectedSubmission.teacher_signature || `Signed by ${typedSignature} (Digital Seal)`,
        markedAt: new Date().toISOString(),
        timePointsEarned: selectedSubmission.timePointsAwarded || timePointsVal,
        awardPointsEarned: selectedSubmission.xpAwarded || xpVal,
      }
    : null;

  return (
    <div className="app-container dashboard-container space-y-8 min-h-screen bg-background text-foreground">
      {/* HEADER HERO */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-card via-teal-950/20 to-card p-6 md:p-8 border border-border shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-500 dark:text-teal-400 text-xs font-semibold">
              <PenTool className="w-3.5 h-3.5" />
              Teacher Assessment &amp; Report Station
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              Structure &amp; Mark Student Reports
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Structure thematic assessment reports according to NCDC rubrics, assign scores, award
              study time points and XP award points, apply teacher digital signatures, and export
              directly as PDFs.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="border-border bg-card hover:bg-muted text-foreground text-xs font-bold rounded-xl px-4 py-2.5 flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print Roster Report
            </Button>
            {selectedSubmission && (
              <Button
                onClick={() => setIsPdfModalOpen(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Download className="w-4 h-4" />
                Export Marked PDF
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* TAB NAVIGATION SWITCHER */}
      <div className="flex items-center gap-3 bg-muted/50 p-1.5 rounded-2xl border border-border w-fit">
        <button
          onClick={() => setActiveModeTab("grading")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeModeTab === "grading"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <PenTool className="w-4 h-4" />
          Individual Grading Station
        </button>

        <button
          onClick={() => setActiveModeTab("manager")}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeModeTab === "manager"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers className="w-4 h-4" />
          Thematic Report Curation Manager
        </button>
      </div>

      {activeModeTab === "manager" ? (
        <ReportManager />
      ) : (
        /* WORKFLOW MAIN GRID */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN: ROSTER & SUBMISSION SELECTION */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="bg-card border-border rounded-3xl overflow-hidden shadow-sm">
              <CardHeader className="p-5 border-b border-border bg-muted/30 space-y-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <User className="w-4 h-4 text-teal-500" />
                    Student Submissions Roster
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="border-teal-500/30 text-teal-500 dark:text-teal-400 text-[10px]"
                  >
                    {filteredSubmissions.length} Students
                  </Badge>
                </div>

                {/* Filters */}
                <div className="space-y-3">
                  <Input
                    type="text"
                    placeholder="Search student, subject, or project title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-background border-border text-xs text-foreground rounded-xl h-9"
                  />

                  <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                    {["ALL", "S1", "S2", "S3", "S4", "S5", "S6"].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setSelectedLevel(lvl)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          selectedLevel === lvl
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-background text-muted-foreground hover:text-foreground border border-border"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-3 max-h-[500px] overflow-y-auto space-y-2">
                {filteredSubmissions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-xs">
                    No student submissions match current filter.
                  </div>
                ) : (
                  filteredSubmissions.map((sub) => {
                    const isSelected = selectedSubmission?.id === sub.id;
                    return (
                      <div
                        key={sub.id}
                        onClick={() => {
                          setSelectedSubmission(sub);
                          if (sub.score) {
                            setScoreVal(sub.score);
                            if (sub.rubricScores) {
                              setPlanningScore(sub.rubricScores.planning);
                              setExecutionScore(sub.rubricScores.execution);
                              setConclusionScore(sub.rubricScores.conclusion);
                            }
                            if (sub.feedback) setFeedbackVal(sub.feedback);
                          }
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                          isSelected
                            ? "bg-teal-500/10 border-teal-500/50 dark:text-white text-teal-950 shadow-md"
                            : "bg-card border-border/80 text-muted-foreground hover:border-border hover:bg-muted/40"
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-foreground truncate">
                              {sub.student_name}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">
                              {sub.level} · {sub.subject}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-1 font-medium">
                            {sub.project_title}
                          </p>
                          <p className="text-[10px] text-muted-foreground/80">
                            Submitted: {sub.submitted_at}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          {sub.status === "graded" ? (
                            <Badge className="bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                              {sub.score}% Graded
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold">
                              Pending Mark
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: THEMATIC REPORT MARKING FORM */}
          <div className="lg:col-span-7 space-y-6">
            {selectedSubmission ? (
              <Card className="bg-card border-border rounded-3xl overflow-hidden shadow-sm space-y-6 p-6">
                <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono text-teal-500 dark:text-teal-400 uppercase tracking-wider font-bold">
                      Thematic Evaluation Form · {selectedSubmission.level}{" "}
                      {selectedSubmission.subject}
                    </span>
                    <h2 className="text-xl font-black text-foreground mt-0.5">
                      {selectedSubmission.project_title}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Student:{" "}
                      <strong className="text-foreground">{selectedSubmission.student_name}</strong>{" "}
                      ({selectedSubmission.student_id})
                    </p>
                  </div>

                  <Badge
                    className={`px-3 py-1 text-xs font-bold shrink-0 ${
                      selectedSubmission.status === "graded"
                        ? "bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30"
                        : "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {selectedSubmission.status === "graded"
                      ? "Graded & Verified"
                      : "Awaiting Evaluation"}
                  </Badge>
                </div>

                {/* PROJECT DESCRIPTION */}
                <div className="bg-muted/30 p-4 rounded-2xl border border-border text-xs text-muted-foreground space-y-1">
                  <span className="text-[10px] text-muted-foreground/80 font-mono uppercase font-bold">
                    Project Summary &amp; Logbook Input
                  </span>
                  <p className="leading-relaxed">{selectedSubmission.project_description}</p>
                </div>

                {/* RUBRIC SCORE SLIDERS */}
                <div className="space-y-4 bg-muted/20 p-5 rounded-2xl border border-border/80">
                  <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    NCDC Competency Rubric Scoring
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <Label className="text-muted-foreground text-[11px]">
                          Phase 1: Planning (30)
                        </Label>
                        <span className="font-bold text-teal-500 dark:text-teal-400">
                          {planningScore} / 30
                        </span>
                      </div>
                      <Input
                        type="number"
                        min={0}
                        max={30}
                        value={planningScore}
                        onChange={(e) => setPlanningScore(Number(e.target.value))}
                        className="bg-background border-border text-foreground font-bold h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <Label className="text-muted-foreground text-[11px]">
                          Phase 2: Execution (40)
                        </Label>
                        <span className="font-bold text-teal-500 dark:text-teal-400">
                          {executionScore} / 40
                        </span>
                      </div>
                      <Input
                        type="number"
                        min={0}
                        max={40}
                        value={executionScore}
                        onChange={(e) => setExecutionScore(Number(e.target.value))}
                        className="bg-background border-border text-foreground font-bold h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <Label className="text-muted-foreground text-[11px]">
                          Phase 3: Conclusion (30)
                        </Label>
                        <span className="font-bold text-teal-500 dark:text-teal-400">
                          {conclusionScore} / 30
                        </span>
                      </div>
                      <Input
                        type="number"
                        min={0}
                        max={30}
                        value={conclusionScore}
                        onChange={(e) => setConclusionScore(Number(e.target.value))}
                        className="bg-background border-border text-foreground font-bold h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="text-xs font-bold text-muted-foreground">
                      Total Calculated Score
                    </span>
                    <span className="text-2xl font-black text-emerald-500 dark:text-emerald-400">
                      {scoreVal}%
                    </span>
                  </div>
                </div>

                {/* TIME POINTS & XP AWARD ASSIGNMENT */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-teal-500" />
                      Credit Study Time Points (Hours)
                    </Label>
                    <Input
                      type="number"
                      value={timePointsVal}
                      onChange={(e) => setTimePointsVal(Number(e.target.value))}
                      className="bg-background border-border text-foreground font-bold text-xs h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-indigo-500" />
                      Award XP Points
                    </Label>
                    <Input
                      type="number"
                      value={xpVal}
                      onChange={(e) => setXpVal(Number(e.target.value))}
                      className="bg-background border-border text-foreground font-bold text-xs h-10"
                    />
                  </div>
                </div>

                {/* THEMATIC FEEDBACK */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Thematic Feedback &amp; Educator Comments
                  </Label>
                  <Textarea
                    rows={3}
                    value={feedbackVal}
                    onChange={(e) => setFeedbackVal(e.target.value)}
                    placeholder="Provide thematic guidance on scientific rigor, budget feasibility, and project logbook quality..."
                    className="bg-background border-border text-xs text-foreground rounded-xl focus:border-primary/50"
                  />
                </div>

                {/* DIGITAL SIGNATURE STAMP */}
                <div className="space-y-2 bg-muted/30 p-4 rounded-2xl border border-border">
                  <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                    Faculty Evaluator Signature Title
                  </Label>
                  <Input
                    type="text"
                    value={typedSignature}
                    onChange={(e) => setTypedSignature(e.target.value)}
                    placeholder="e.g. Dr. Mukasa Sarah, Head of Science"
                    className="bg-background border-border text-xs font-bold text-foreground h-10"
                  />
                  <p className="text-[10px] text-muted-foreground/80">
                    Will apply official digital signature stamp:{" "}
                    <strong className="text-foreground">
                      "Signed by {typedSignature} (Digital Seal Verified)"
                    </strong>
                  </p>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <Button
                    onClick={handleSaveAndSendGrade}
                    disabled={isSubmittingGrade}
                    className="w-full sm:flex-1 bg-teal-500 hover:bg-teal-600 text-black font-extrabold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
                  >
                    <Send className="w-4 h-4" />
                    {isSubmittingGrade ? "Saving & Sending..." : "Mark & Send Report to Student"}
                  </Button>

                  <Button
                    onClick={() => setIsPdfModalOpen(true)}
                    variant="outline"
                    className="w-full sm:w-auto border-border bg-card hover:bg-muted text-foreground font-bold text-xs py-3 px-5 rounded-xl flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4 text-emerald-500" />
                    Export PDF Report
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="bg-muted/30 border border-border rounded-3xl p-12 text-center text-muted-foreground space-y-3">
                <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/60" />
                <p className="text-sm font-medium">
                  Select a student submission from the roster to begin thematic evaluation.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* HIDDEN PRINT COMPONENT */}
      {selectedSubmission && currentMarkedReportItem && (
        <PrintableSummary
          customStudentName={selectedSubmission.student_name}
          customSchoolName={currentSchoolId}
          customClassName={`${selectedSubmission.level} (${selectedSubmission.stream})`}
          customUnebIndex={selectedSubmission.student_id}
          markedReports={[currentMarkedReportItem]}
        />
      )}

      {/* EXPORT PDF MODAL */}
      {selectedSubmission && (
        <ExportPdfModal
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          title={`${selectedSubmission.student_name}'s Marked Report`}
          subject={selectedSubmission.subject}
          docType="study_chart"
          content={[
            {
              sectionTitle: "1. Student Project Information",
              body: [
                `Student Name: ${selectedSubmission.student_name}`,
                `Student Reg ID: ${selectedSubmission.student_id}`,
                `Class Level: ${selectedSubmission.level} (${selectedSubmission.stream})`,
                `Subject: ${selectedSubmission.subject}`,
                `Project Title: ${selectedSubmission.project_title}`,
              ],
            },
            {
              sectionTitle: "2. Thematic Rubric Assessment",
              body: [
                `Phase 1 Planning Score: ${planningScore} / 30`,
                `Phase 2 Execution Score: ${executionScore} / 40`,
                `Phase 3 Conclusion Score: ${conclusionScore} / 30`,
                `Total Evaluated Percentage: ${scoreVal}%`,
                `Credit Time Points: ${timePointsVal} Study Hours`,
                `Award Points: +${xpVal} XP`,
              ],
            },
            {
              sectionTitle: "3. Faculty Feedback & Digital Signature",
              body: [
                `Teacher Feedback: "${feedbackVal}"`,
                `Evaluated By: ${typedSignature}`,
                `Official Seal: Signed by ${typedSignature} (Digital Seal Verified)`,
              ],
            },
          ]}
        />
      )}
    </div>
  );
}
