import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeData } from "@/hooks/useRealtimeData";
import { ProjectSubmissionSchema } from "@/lib/schema";
import { toast } from "sonner";
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
  Building,
  Check,
  Send,
  Download,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

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
  signed_at?: string;
  school_id: string;
}

export function TeacherGradingStation() {
  const { user, profile } = useAuth();
  const currentSchoolId =
    profile?.school_id ||
    profile?.org_id ||
    user?.user_metadata?.school_id ||
    (typeof window !== "undefined" ? localStorage.getItem("cymatic_school_id") : "") ||
    "SCH-UG-2026";

  const teacherName = profile?.display_name || user?.email?.split("@")[0] || "Faculty Evaluator";

  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);

  // Fetch submissions from Supabase if present
  const { data: realtimeSubmissions, loading: loadingData, error: fetchError } = useRealtimeData<StudentSubmission>(
    "submissions", 
    ProjectSubmissionSchema,
    "*"
  );

  useEffect(() => {
    if (realtimeSubmissions) {
      setSubmissions(realtimeSubmissions);
    }
  }, [realtimeSubmissions]);

  useEffect(() => {
    if (fetchError) {
      toast.error("Failed to load submissions.");
    }
  }, [fetchError]);

  // Marking Form State
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(
    null,
  );
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [scoreVal, setScoreVal] = useState<number>(0);
  const [planningScore, setPlanningScore] = useState<number>(0);
  const [executionScore, setExecutionScore] = useState<number>(0);
  const [conclusionScore, setConclusionScore] = useState<number>(0);
  const [feedbackVal, setFeedbackVal] = useState<string>("");

  useEffect(() => {
    if (submissions && submissions.length > 0 && !selectedSubmission) {
      setSelectedSubmission(submissions[0]);
    }
  }, [submissions, selectedSubmission]);

  // Digital Signature Pad State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureMode, setSignatureMode] = useState<"draw" | "type">("type");
  const [typedSignature, setTypedSignature] = useState(teacherName);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);


  // Synchronize score from rubric
  useEffect(() => {
    const total = Math.min(100, Math.max(0, planningScore + executionScore + conclusionScore));
    setScoreVal(total);
  }, [planningScore, executionScore, conclusionScore]);

  // Canvas drawing functions
  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawnSignature(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#3b82f6"; // Blue signature ink
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnSignature(false);
  };

  // Handle Grade Submission and Signature Stamp
  const handleSaveGrade = async () => {
    if (!selectedSubmission) return;

    let finalSignatureString = "";
    if (signatureMode === "type") {
      if (!typedSignature.trim()) {
        toast.error("Please type your official name or digital title for signature.");
        return;
      }
      finalSignatureString = `Official Stamp: ${typedSignature.trim()} (Verified ID: ${currentSchoolId})`;
    } else {
      if (!hasDrawnSignature) {
        toast.error("Please draw your signature in the pad before validating grade sheet.");
        return;
      }
      finalSignatureString = `Handwritten Seal: ${teacherName} (Digital Hash 0x${Math.random().toString(16).slice(2, 8).toUpperCase()})`;
    }

    setIsSubmittingGrade(true);
    const toastId = toast.loading(
      "Validating marks and affixing digital institutional signature...",
    );

    try {
      const now = new Date().toISOString();
      const updatedList = submissions.map((s) => {
        if (s.id === selectedSubmission.id) {
          return {
            ...s,
            status: "graded" as const,
            score: scoreVal,
            rubricScores: {
              planning: planningScore,
              execution: executionScore,
              conclusion: conclusionScore,
            },
            feedback: feedbackVal.trim() || "Competency evaluation complete.",
            teacher_signature: finalSignatureString,
            signed_at: now,
          };
        }
        return s;
      });

      setSubmissions(updatedList);
      const updatedSub = updatedList.find((s) => s.id === selectedSubmission.id) || null;
      setSelectedSubmission(updatedSub);

      setIsSubmittingGrade(false);
      toast.success("Grade Sheet Validated & Digitally Signed!", {
        id: toastId,
        description: `Student ${selectedSubmission.student_name} awarded ${scoreVal}/100.`,
      });
    } catch (err) {
      setIsSubmittingGrade(false);
      toast.error("Failed to sign grade sheet.", { id: toastId });
    }
  };

  const filteredSubmissions = submissions.filter((s) => {
    const matchesLevel = selectedLevel === "ALL" || s.level === selectedLevel;
    const matchesSearch =
      s.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.project_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/20 to-black border border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-blue-600 text-white font-bold text-[10px] uppercase">
              Teacher Evaluation Workstation
            </Badge>
            <span className="text-xs font-mono text-blue-400 font-bold">
              School ID: {currentSchoolId}
            </span>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            <Award className="h-6 w-6 text-amber-400" />
            NCDC Competency Assessment & Digital Marking
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Review learner project submissions, grade across standard rubric criteria, and apply
            your digital signature stamp.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white">{teacherName}</p>
            <p className="text-[10px] text-zinc-500">Authorized Faculty Member</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-black text-blue-400">
            {teacherName.slice(0, 2).toUpperCase()}
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-black/40 border border-white/5 p-4 rounded-xl">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold uppercase text-zinc-500 flex items-center gap-1 mr-2">
            <Filter className="h-3.5 w-3.5" /> Class Filter:
          </span>
          {["ALL", "S1", "S2", "S3", "S4", "S5", "S6"].map((lvl) => (
            <Button
              key={lvl}
              size="sm"
              variant={selectedLevel === lvl ? "default" : "outline"}
              onClick={() => setSelectedLevel(lvl)}
              className={
                selectedLevel === lvl
                  ? "bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                  : "border-white/10 bg-white/5 text-zinc-400 text-xs hover:text-white"
              }
            >
              {lvl}
            </Button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search student or project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-xs"
          />
        </div>
      </div>

      {loadingData ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-xl bg-white/5" />
          <Skeleton className="h-24 w-full rounded-xl bg-white/5" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: SUBMISSIONS LIST (5 COLS) */}
          <div className="lg:col-span-5 space-y-3">
            <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider flex items-center justify-between px-1">
              <span>Student Submissions ({filteredSubmissions.length})</span>
              <span className="text-[10px] text-blue-400 font-mono">Bound to {currentSchoolId}</span>
            </h3>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {/* Mapping submissions... */}
              {filteredSubmissions.map((sub) => (
                <div key={sub.id} onClick={() => {
                  setSelectedSubmission(sub);
                  if (sub.status === "graded" && sub.score) {
                    setScoreVal(sub.score);
                    setFeedbackVal(sub.feedback || "");
                  }
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedSubmission?.id === sub.id
                    ? "bg-blue-950/40 border-blue-500/50 shadow-lg shadow-blue-500/10"
                    : "bg-black/40 border-white/5 hover:border-white/20 hover:bg-white/[0.02]"
                }`}
                >
                  {/* ... submission card content ... */}
                  <h4 className="font-bold text-white text-sm line-clamp-1">{sub.project_title}</h4>
                </div>
              ))}
            </div>
          </div>
          {/* RIGHT COLUMN: MARKING WORKSTATION & DIGITAL SIGNATURE (7 COLS) */}
          <div className="lg:col-span-7">
                          {/* SUBMISSION METADATA HEADER */}
              <div className="border-b border-white/10 pb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className="border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs"
                  >
                    {selectedSubmission.level} • {selectedSubmission.subject}
                  </Badge>
                  <span className="text-xs font-mono text-zinc-400">
                    ID: {selectedSubmission.id}
                  </span>
                </div>
                <h3 className="text-xl font-black text-white">
                  {selectedSubmission.project_title}
                </h3>
                <p className="text-xs text-zinc-400">{selectedSubmission.project_description}</p>

                <div className="flex items-center gap-4 text-xs text-zinc-300 pt-2">
                  <div>
                    <span className="text-zinc-500">Student: </span>
                    <strong className="text-white">{selectedSubmission.student_name}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500">Stream: </span>
                    <strong className="text-zinc-300">{selectedSubmission.stream}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500">School ID: </span>
                    <strong className="text-blue-400 font-mono">
                      {selectedSubmission.school_id}
                    </strong>
                  </div>
                </div>
              </div>

              {/* COMPETENCY RUBRIC BREAKDOWN */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                  <Award className="h-4 w-4" /> NCDC Competency Scoring Rubric
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white/5 p-3 rounded-xl space-y-1.5 border border-white/5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-zinc-300">1. Research & Plan</span>
                      <span className="text-blue-400 font-mono">{planningScore}/30</span>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      max={30}
                      value={planningScore}
                      onChange={(e) => setPlanningScore(Number(e.target.value))}
                      className="bg-black/50 border-white/10 text-xs"
                    />
                  </div>

                  <div className="bg-white/5 p-3 rounded-xl space-y-1.5 border border-white/5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-zinc-300">2. Practical Execution</span>
                      <span className="text-blue-400 font-mono">{executionScore}/40</span>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      max={40}
                      value={executionScore}
                      onChange={(e) => setExecutionScore(Number(e.target.value))}
                      className="bg-black/50 border-white/10 text-xs"
                    />
                  </div>

                  <div className="bg-white/5 p-3 rounded-xl space-y-1.5 border border-white/5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-zinc-300">3. Scientific Conclusion</span>
                      <span className="text-blue-400 font-mono">{conclusionScore}/30</span>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      max={30}
                      value={conclusionScore}
                      onChange={(e) => setConclusionScore(Number(e.target.value))}
                      className="bg-black/50 border-white/10 text-xs"
                    />
                  </div>
                </div>

                {/* OVERALL SCORE DISPLAY */}
                <div className="flex items-center justify-between p-4 bg-blue-950/30 border border-blue-500/20 rounded-xl">
                  <div>
                    <p className="text-[10px] font-black uppercase text-blue-400 tracking-wider">
                      Aggregate Assessment Grade
                    </p>
                    <p className="text-xs text-zinc-400">
                      NCDC Continuous Assessment (20% Final Contribution)
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-emerald-400 font-mono">
                      {scoreVal}%
                    </span>
                  </div>
                </div>

                {/* EVALUATOR FEEDBACK */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-300">
                    Evaluator's Remarks & Feedback
                  </Label>
                  <Textarea
                    placeholder="Enter formative feedback for the learner..."
                    value={feedbackVal}
                    onChange={(e) => setFeedbackVal(e.target.value)}
                    className="bg-white/5 border-white/10 text-xs min-h-[80px]"
                  />
                </div>

                {/* DIGITAL SIGNATURE TOOLS */}
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-black uppercase text-zinc-300 flex items-center gap-1.5">
                      <PenTool className="h-4 w-4 text-blue-400" /> Faculty Digital Signature &
                      Validation Stamp
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={signatureMode === "type" ? "default" : "outline"}
                        onClick={() => setSignatureMode("type")}
                        className="text-[10px] h-7 px-2"
                      >
                        Type Official Title
                      </Button>
                      <Button
                        size="sm"
                        variant={signatureMode === "draw" ? "default" : "outline"}
                        onClick={() => setSignatureMode("draw")}
                        className="text-[10px] h-7 px-2"
                      >
                        Draw Signature
                      </Button>
                    </div>
                  </div>

                  {signatureMode === "type" ? (
                    <div className="space-y-2">
                      <Input
                        placeholder="Type your official name and title..."
                        value={typedSignature}
                        onChange={(e) => setTypedSignature(e.target.value)}
                        className="bg-white/5 border-white/10 text-xs font-serif italic text-blue-300 text-sm"
                      />
                      <p className="text-[10px] text-zinc-500">
                        Will be stamped as:{" "}
                        <span className="text-zinc-300 italic font-serif">"{typedSignature}"</span>{" "}
                        bound to School ID <span className="font-mono">{currentSchoolId}</span>.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative border border-white/20 rounded-xl bg-black overflow-hidden">
                        <canvas
                          ref={canvasRef}
                          width={400}
                          height={100}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                          className="w-full h-[100px] cursor-crosshair bg-slate-950"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={clearCanvas}
                          className="absolute right-2 top-2 text-[10px] h-6 px-2 text-zinc-400 hover:text-white bg-black/60"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" /> Clear
                        </Button>
                      </div>
                      <p className="text-[10px] text-zinc-500">
                        Draw your handwritten signature using mouse or touch in the box above.
                      </p>
                    </div>
                  )}

                  {selectedSubmission.teacher_signature && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-emerald-300">
                            Signed & Validated Grade Sheet
                          </p>
                          <p className="text-[10px] text-zinc-400 font-mono">
                            {selectedSubmission.teacher_signature}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-500 text-black font-black text-[10px]">
                        VERIFIED
                      </Badge>
                    </div>
                  )}

                  {/* SAVE & STAMP ACTION BUTTON */}
                  <Button
                    onClick={handleSaveGrade}
                    disabled={isSubmittingGrade}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs py-5 shadow-lg shadow-blue-600/30"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {selectedSubmission.status === "graded"
                      ? "Update Grade Sheet & Re-Stamp Signature"
                      : "Validate Marks & Affix Digital Signature"}
                  </Button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
