import React, { useState } from "react";
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
  const [students] = useState<StudentProfile[]>([
    {
      id: "STD-UG001",
      name: "Kato Paul",
      className: "Senior 3 (S3 West)",
      unebIndex: "U2026/089/STD",
      schoolName: "Kampala Secondary Academy",
    },
    {
      id: "STD-UG002",
      name: "Namubiru Sarah",
      className: "Senior 4 (S4 East)",
      unebIndex: "U2026/092/STD",
      schoolName: "Mbarara High School",
    },
    {
      id: "STD-UG003",
      name: "Okello Emmanuel",
      className: "Senior 2 (S2 North)",
      unebIndex: "U2026/104/STD",
      schoolName: "Gulu Science Institute",
    },
  ]);

  const [selectedStudent, setSelectedStudent] = useState<StudentProfile>(students[0]);
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

  const [curatedReports, setCuratedReports] = useState<MarkedReportItem[]>([
    {
      id: "CUR-101",
      projectTitle: "Solar Thermal Water Purifier Prototype",
      subject: "Physics",
      score: 88,
      rubricScores: { planning: 27, execution: 36, conclusion: 25 },
      feedback: "Excellent research logbook and clear experimental trial data.",
      teacherName: "Mr. Okello David",
      teacherTitle: "Physics Head",
      teacherSignature: "Signed by Mr. Okello David (Verified)",
      markedAt: new Date().toISOString(),
      timePointsEarned: 8.5,
      awardPointsEarned: 120,
    },
  ]);

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
      <div className="rounded-3xl bg-gradient-to-r from-zinc-900 via-indigo-950 to-zinc-900 p-6 md:p-8 border border-zinc-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Layers className="w-3.5 h-3.5" />
            Report Curation &amp; Award Scheme Station
          </div>
          <h1 className="text-2xl font-black text-white">Thematic Report Manager</h1>
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            Curate student performance records, define custom grading schemes (Planning, Execution,
            Conclusion), allocate study time points and award XP, and generate print-ready or
            PDF-exportable reports.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            onClick={handlePrint}
            variant="outline"
            className="border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl px-4 py-2.5 flex items-center gap-2"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
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
          <Card className="bg-zinc-900/80 border-zinc-800 rounded-3xl">
            <CardHeader className="p-5 border-b border-zinc-800">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-400" />
                Select Target Student
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {students.map((st) => (
                <div
                  key={st.id}
                  onClick={() => setSelectedStudent(st)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedStudent.id === st.id
                      ? "bg-indigo-500/10 border-indigo-500/50 text-white"
                      : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <div>
                    <p className="font-bold text-xs text-white">{st.name}</p>
                    <p className="text-[10px] text-zinc-400">
                      {st.className} · {st.unebIndex}
                    </p>
                  </div>
                  {selectedStudent.id === st.id && (
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/80 border-zinc-800 rounded-3xl">
            <CardHeader className="p-5 border-b border-zinc-800">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-400" />
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
                  className={`w-full text-left p-3 rounded-2xl border text-xs font-bold transition-all ${
                    template === tpl
                      ? "bg-teal-500/10 border-teal-500/50 text-teal-400"
                      : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
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
          <Card className="bg-zinc-900/80 border-zinc-800 rounded-3xl p-6 space-y-6">
            <div className="border-b border-zinc-800 pb-4">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Define Evaluation &amp; Award Scheme
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400 mt-1">
                Configure rubric breakdown, credit study hours (time points), and grant award XP for{" "}
                {selectedStudent.name}.
              </CardDescription>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300">Report Header Title</Label>
                <Input
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-xs text-white h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300">Subject Field</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-xs text-white h-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-300">Project / Activity Title</Label>
              <Input
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="bg-zinc-950 border-zinc-800 text-xs text-white h-10"
              />
            </div>

            {/* RUBRIC SLIDERS */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  NCDC Competency Rubric (100% Total)
                </span>
                <span className="text-base font-black text-emerald-400">
                  Total: {calculateTotalScore()}%
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <Label className="text-zinc-400 text-[11px] block mb-1">Planning (30)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={30}
                    value={planningScore}
                    onChange={(e) => setPlanningScore(Number(e.target.value))}
                    className="bg-zinc-900 border-zinc-800 font-bold text-white h-9"
                  />
                </div>
                <div>
                  <Label className="text-zinc-400 text-[11px] block mb-1">Execution (40)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={40}
                    value={executionScore}
                    onChange={(e) => setExecutionScore(Number(e.target.value))}
                    className="bg-zinc-900 border-zinc-800 font-bold text-white h-9"
                  />
                </div>
                <div>
                  <Label className="text-zinc-400 text-[11px] block mb-1">Conclusion (30)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={30}
                    value={conclusionScore}
                    onChange={(e) => setConclusionScore(Number(e.target.value))}
                    className="bg-zinc-900 border-zinc-800 font-bold text-white h-9"
                  />
                </div>
              </div>
            </div>

            {/* AWARD SCHEMES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-400" />
                  Study Time Points (Hours Credited)
                </Label>
                <Input
                  type="number"
                  step="0.5"
                  value={timePoints}
                  onChange={(e) => setTimePoints(Number(e.target.value))}
                  className="bg-zinc-950 border-zinc-800 text-xs font-bold text-white h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-indigo-400" />
                  Award XP Points
                </Label>
                <Input
                  type="number"
                  value={awardXP}
                  onChange={(e) => setAwardXP(Number(e.target.value))}
                  className="bg-zinc-950 border-zinc-800 text-xs font-bold text-white h-10"
                />
              </div>
            </div>

            {/* FEEDBACK & EVALUATOR */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300">Educator Feedback</Label>
                <Textarea
                  rows={2}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-xs text-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300">Evaluator Name / Title</Label>
                <Input
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-xs text-white h-10"
                />
              </div>
            </div>

            <Button
              onClick={handleAddReportItem}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              <Plus className="w-4 h-4" />
              Add Project Record to Student Portfolio
            </Button>
          </Card>

          {/* CURATED LIST PREVIEW */}
          <Card className="bg-zinc-900/80 border-zinc-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              Curated Portfolio Items ({curatedReports.length})
            </h3>

            {curatedReports.length === 0 ? (
              <p className="text-xs text-zinc-500 italic text-center py-6">
                No items added yet. Define and submit project records above.
              </p>
            ) : (
              curatedReports.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <p className="font-bold text-xs text-white">{item.projectTitle}</p>
                    <p className="text-[11px] text-zinc-400">
                      Score: <strong className="text-emerald-400">{item.score}%</strong> | Time
                      Points: +{item.timePointsEarned}h | Award: +{item.awardPointsEarned} XP
                    </p>
                    <p className="text-[10px] text-zinc-500 italic">"{item.feedback}"</p>
                  </div>
                  <Button
                    onClick={() => handleRemoveReportItem(item.id)}
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl"
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

      {/* EXPORT BRANDED PDF MODAL */}
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
    </div>
  );
}
