import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MarkedReportItem } from "@/components/PrintableSummary";
import { ReportPrintView } from "@/components/ReportPrintView";
import { ExportPdfModal } from "@/components/ExportPdfModal";
import { toast } from "sonner";
import {
  FileText,
  Printer,
  Download,
  Award,
  Clock,
  Send,
  Layers,
  Sparkles,
  BookOpen,
  User,
  CheckCircle2,
  ShieldCheck,
  Plus,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export interface StudentProfile {
  id: string;
  name: string;
  className: string;
  unebIndex: string;
  schoolName: string;
}

export function ReportManager() {
  const [students, setStudents] = useState<StudentProfile[]>([]);

  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);

  useEffect(() => {
    if (students.length > 0 && !selectedStudent) {
      setSelectedStudent(students[0]);
    }
  }, [students, selectedStudent]);
  const [template, setTemplate] = useState<
    "NCDC Competency" | "STEM Research" | "Term Summary" | "Project Portfolio"
  >("NCDC Competency");

  // Report Curation State
  const [reportTitle, setReportTitle] = useState("Continuous Competency Assessment Report");
  const [subject, setSubject] = useState("Physics");
  const [projectTitle, setProjectTitle] = useState("Solar Thermal Water Purifier Prototype");

  // Grading & Award Schemes
  const [planningScore, setPlanningScore] = useState(27);
  const [executionScore, setExecutionScore] = useState(36);
  const [conclusionScore, setConclusionScore] = useState(25);
  const [timePoints, setTimePoints] = useState(8.5);
  const [awardXP, setAwardXP] = useState(120);
  const [feedback, setFeedback] = useState(
    "Excellent research logbook and clear experimental trial data.",
  );
  const [teacherName, setTeacherName] = useState("Mr. Okello David");

  const { data: curatedReports } = useRealtimeData<Report>("reports", ReportSchema, "*");

  const [isExportPdfOpen, setIsExportPdfOpen] = useState(false);

  const calculateTotalScore = () => Math.min(100, planningScore + executionScore + conclusionScore);

  const handleAddReportItem = () => {
    if (!projectTitle.trim()) {
      toast.error("Please provide a project title.");
      return;
    }

    const newItem: MarkedReportItem = {
      id: `CUR-${Date.now()}`,
      projectTitle: projectTitle.trim(),
      subject,
      score: calculateTotalScore(),
      rubricScores: {
        planning: planningScore,
        execution: executionScore,
        conclusion: conclusionScore,
      },
      feedback: feedback.trim(),
      teacherName: teacherName.trim(),
      teacherTitle: "Subject Educator",
      teacherSignature: `Signed by ${teacherName.trim()} (Digital Seal)`,
      markedAt: new Date().toISOString(),
      timePointsEarned: timePoints,
      awardPointsEarned: awardXP,
    };

    setCuratedReports((prev) => [newItem, ...prev]);
    toast.success("Added new report item to student portfolio!");
  };

  const handleRemoveReportItem = (id: string) => {
    setCuratedReports((prev) => prev.filter((r) => r.id !== id));
    toast.info("Report item removed.");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* HEADER CARD */}
      <div className="rounded-3xl bg-gradient-to-r from-card via-indigo-950/20 to-card p-6 md:p-8 border border-border shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400 text-xs font-semibold">
            <Layers className="w-3.5 h-3.5" />
            Report Curation &amp; Award Scheme Station
          </div>
          <h1 className="text-2xl font-black text-foreground">Thematic Report Manager</h1>
          <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
            Curate student performance records, define custom grading schemes (Planning, Execution,
            Conclusion), allocate study time points and award XP, and generate print-ready or
            PDF-exportable reports.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            onClick={handlePrint}
            variant="outline"
            className="border-border bg-card hover:bg-muted text-foreground text-xs font-bold rounded-xl px-4 py-2.5 flex items-center gap-2"
          >
            <Printer className="w-4 h-4 text-cyan-500" />
            Print Report
          </Button>

          <Button
            onClick={() => setIsExportPdfOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <Download className="w-4 h-4" />
            Export Branded PDF
          </Button>
        </div>
      </div>

      {/* CURATION LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: STUDENT & TEMPLATE SELECTOR */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-card border-border rounded-3xl shadow-sm">
            <CardHeader className="p-5 border-b border-border bg-muted/20">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-500" />
                Select Target Student
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {students.map((st) => (
                <div
                  key={st.id}
                  onClick={() => setSelectedStudent(st)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedStudent?.id === st.id
                      ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-600 dark:text-indigo-400 font-semibold"
                      : "bg-card border-border text-muted-foreground hover:border-border/80 hover:bg-muted/40"
                  }`}
                >
                  <div>
                    <p className="font-bold text-xs text-foreground">{st.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {st.className} · {st.unebIndex}
                    </p>
                  </div>
                  {selectedStudent?.id === st.id && (
                    <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card border-border rounded-3xl shadow-sm">
            <CardHeader className="p-5 border-b border-border bg-muted/20">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-500" />
                Select Thematic Template
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {(
                ["NCDC Competency", "STEM Research", "Term Summary", "Project Portfolio"] as const
              ).map((tpl) => (
                <button
                  key={tpl}
                  onClick={() => setTemplate(tpl)}
                  className={`w-full text-left p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                    template === tpl
                      ? "bg-teal-500/10 border-teal-500/50 text-teal-600 dark:text-teal-400"
                      : "bg-card border-border text-muted-foreground hover:border-border/80 hover:bg-muted/40"
                  }`}
                >
                  {tpl} Template
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: GRADING & AWARD SCHEME FORM */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="bg-card border-border rounded-3xl p-6 space-y-6 shadow-sm">
            <div className="border-b border-border pb-4">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Define Evaluation &amp; Award Scheme
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                Configure rubric breakdown, credit study hours (time points), and grant award XP for{" "}
                {selectedStudent?.name || "..."}.
              </CardDescription>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Report Header Title</Label>
                <Input
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="bg-background border-border text-xs text-foreground h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Subject Field</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="bg-background border-border text-xs text-foreground h-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Project / Activity Title</Label>
              <Input
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="bg-background border-border text-xs text-foreground h-10"
              />
            </div>

            {/* RUBRIC SLIDERS */}
            <div className="bg-muted/20 p-4 rounded-2xl border border-border space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  NCDC Competency Rubric (100% Total)
                </span>
                <span className="text-base font-black text-emerald-500 dark:text-emerald-400">
                  Total: {calculateTotalScore()}%
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <Label className="text-muted-foreground text-[11px] block mb-1">
                    Planning (30)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={30}
                    value={planningScore}
                    onChange={(e) => setPlanningScore(Number(e.target.value))}
                    className="bg-background border-border font-bold text-foreground h-9"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground text-[11px] block mb-1">
                    Execution (40)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={40}
                    value={executionScore}
                    onChange={(e) => setExecutionScore(Number(e.target.value))}
                    className="bg-background border-border font-bold text-foreground h-9"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground text-[11px] block mb-1">
                    Conclusion (30)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={30}
                    value={conclusionScore}
                    onChange={(e) => setConclusionScore(Number(e.target.value))}
                    className="bg-background border-border font-bold text-foreground h-9"
                  />
                </div>
              </div>
            </div>

            {/* AWARD SCHEMES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-500" />
                  Study Time Points (Hours Credited)
                </Label>
                <Input
                  type="number"
                  step="0.5"
                  value={timePoints}
                  onChange={(e) => setTimePoints(Number(e.target.value))}
                  className="bg-background border-border text-xs font-bold text-foreground h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-indigo-500" />
                  Award XP Points
                </Label>
                <Input
                  type="number"
                  value={awardXP}
                  onChange={(e) => setAwardXP(Number(e.target.value))}
                  className="bg-background border-border text-xs font-bold text-foreground h-10"
                />
              </div>
            </div>

            {/* FEEDBACK & EVALUATOR */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Educator Feedback</Label>
                <Textarea
                  rows={2}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="bg-background border-border text-xs text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Evaluator Name / Title</Label>
                <Input
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="bg-background border-border text-xs text-foreground h-10"
                />
              </div>
            </div>

            <Button
              onClick={handleAddReportItem}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Project Record to Student Portfolio
            </Button>
          </Card>

          {/* CURATED LIST PREVIEW */}
          <Card className="bg-card border-border rounded-3xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" />
              Curated Portfolio Items ({curatedReports.length})
            </h3>

            {curatedReports.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-6">
                No items added yet. Define and submit project records above.
              </p>
            ) : (
              curatedReports.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-muted/20 border border-border flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <p className="font-bold text-xs text-foreground">{item.projectTitle}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Score: <strong className="text-emerald-500">{item.score}%</strong> | Time
                      Points: +{item.timePointsEarned}h | Award: +{item.awardPointsEarned} XP
                    </p>
                    <p className="text-[10px] text-muted-foreground italic">"{item.feedback}"</p>
                  </div>
                  <Button
                    onClick={() => handleRemoveReportItem(item.id)}
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>

      {/* HIDDEN PRINT VIEW FOR BROWSER PRINT DIALOG */}
      {selectedStudent && (
        <ReportPrintView
          studentName={selectedStudent.name}
          schoolName={selectedStudent.schoolName}
          className={selectedStudent.className}
          unebIndex={selectedStudent.unebIndex}
          reportTitle={reportTitle}
          themeTemplate={template}
          markedReports={curatedReports}
          timePoints={timePoints}
          awardPoints={awardXP}
        />
      )}

      {/* EXPORT BRANDED PDF MODAL */}
      {selectedStudent && (
        <ExportPdfModal
          isOpen={isExportPdfOpen}
          onClose={() => setIsExportPdfOpen(false)}
          title={reportTitle}
          subject={subject}
          docType="study_chart"
          content={[
            {
              sectionTitle: "1. Student Metadata",
              body: [
                `Student Holder: ${selectedStudent.name}`,
                `School / Institution: ${selectedStudent.schoolName}`,
                `Class Level: ${selectedStudent.className}`,
                `UNEB Reference: ${selectedStudent.unebIndex}`,
                `Selected Template: ${template}`,
              ],
            },
            {
              sectionTitle: "2. Evaluation & Award Scheme Summary",
              body: curatedReports.map((r) => ({
                key: `${r.projectTitle} (${r.subject})`,
                value: `Score: ${r.score}% | Time Points: +${r.timePointsEarned}h | XP: +${r.awardPointsEarned} | Feedback: ${r.feedback}`,
              })),
            },
            {
              sectionTitle: "3. Institutional Endorsement",
              body: [
                `Educator Signature: ${teacherName}`,
                `Digital Seal: Verified by Cymatic Assessment Engine`,
              ],
            },
          ]}
        />
      )}
    </div>
  );
}
