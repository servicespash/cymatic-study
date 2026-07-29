import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Lock,
  Plus,
  Recycle,
  ShoppingBag,
  Sparkles,
  Trash2,
  Trophy,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { CurriculumToggle } from "@/components/CurriculumToggle";
import { useCurriculum } from "@/lib/curriculum-context";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { useProjects, type Project } from "@/lib/projects-store";
import { SubmissionModal } from "@/components/SubmissionModal";
import { ProjectActions } from "@/components/ProjectActions";
import { NCDCScorecard } from "@/components/NCDCScorecard";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "NCDC PBL Tracker — Cymatic Study" },
      {
        name: "description",
        content:
          "4-phase NCDC project wizard with live competency grading and UNEB-ready PDF export.",
      },
    ],
  }),
  component: ProjectsPage,
});

const STORAGE_KEY = "cymatic.pbl.v1";

type BudgetItem = {
  id: string;
  name: string;
  source: "Local/Recycled" | "Purchased New";
  cost: number;
};
type WeekLog = { id: string; week: string; activity: string; challenges: string; skills: string[] };
export type ProjectState = {
  // Phase 1
  title: string;
  justification: string;
  subject: string;
  budget: BudgetItem[];
  grade1: string;
  // Phase 2
  logs: WeekLog[];
  grade2: string;
  // Phase 3
  uniqueness: string;
  input: string;
  output: string;
  grade3: string;
  // Phase 4
  summary: string;
  grade4: string;
  // Meta
  studentName: string;
  className: string;
  unebIndex: string;
  xp: number;
  rewardsClaimed: Record<string, boolean>;
};

const EMPTY: ProjectState = {
  title: "",
  justification: "",
  subject: "",
  budget: [],
  grade1: "",
  logs: [],
  grade2: "",
  uniqueness: "",
  input: "",
  output: "",
  grade3: "",
  summary: "",
  grade4: "",
  studentName: "",
  className: "",
  unebIndex: "",
  xp: 0,
  rewardsClaimed: {},
};

const SKILLS = ["Critical Thinking", "Collaboration", "ICT Proficiency", "Communication"];

export interface TeacherEval {
  remarks: string;
  score: number;
}

function gradeLetter(total: number) {
  if (total >= 8.5) return { letter: "A", label: "Exceptional", tone: "text-emerald-500" };
  if (total >= 7.0) return { letter: "B", label: "Outstanding", tone: "text-cyan-500" };
  if (total >= 5.0) return { letter: "C", label: "Satisfactory", tone: "text-amber-500" };
  if (total >= 3.0) return { letter: "D", label: "Basic", tone: "text-orange-500" };
  return { letter: "E", label: "Elementary", tone: "text-rose-500" };
}

function clampGrade(raw: string, max: number): number {
  const n = Number(raw);
  if (!isFinite(n)) return 0;
  return Math.max(0, Math.min(max, n));
}

function ProjectsPage() {
  const { user, profile, isTeacher } = useAuth();
  const { list, create, update } = useProjects();

  // Existing state for original code
  const [state, setState] = useState<ProjectState>(EMPTY);
  const [reward, setReward] = useState<string | null>(null);
  const [activePhase, setActivePhase] = useState(1);
  const [selfAwards, setSelfAwards] = useState<Record<1 | 2 | 3 | 4, number>>({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
  });
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [status, setStatus] = useState<"draft" | "pending" | "verified">("draft");
  const [isSyncing, setIsSyncing] = useState(false);
  const [teacherEval, setTeacherEval] = useState<TeacherEval | null>(null);

  // New multi-project management UI
  const projectsUI = (
    <div className="mb-8 p-4 border rounded-2xl bg-card">
      <h2 className="text-lg font-bold mb-4">Manage Projects</h2>
      <div className="flex gap-2">
        {list.map((p) => (
          <div key={p.id} className="p-4 border rounded-xl bg-muted/50 flex flex-col gap-2">
            <span className="font-bold text-sm">{p.title || "Untitled"}</span>
            <span className="text-xs">Status: {p.status}</span>
            {p.status === "draft" && (
              <SubmissionModal project={p} onSend={() => update(p.id, { status: "pending" })} />
            )}
          </div>
        ))}
        <Button onClick={() => create({ title: "New Project" })}>Add Project</Button>
      </div>
    </div>
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...EMPTY, ...JSON.parse(raw) });
    } catch (err) {
      console.warn("localStorage read failed", err);
    }

    // Load from DB if user is logged in
    if (user) {
      loadSubmission();
    }
  }, [user]);

  const loadSubmission = async () => {
    try {
      const { loadMyDraftSubmission } = await import("@/lib/project-submissions.functions");
      const data = await loadMyDraftSubmission();
      if (data) {
        setSubmissionId(data.id);
        setStatus(data.status as "draft" | "pending" | "verified");
        setTeacherEval(data);
        if (data.project_data) {
          setState(data.project_data as unknown as ProjectState);
        }
      }
    } catch (err) {
      console.error("loadSubmission failed", err);
    }
  };

  useEffect(() => {
    if (!submissionId) return;

    const channel = supabase
      .channel(`submission_${submissionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "project_submissions",
          filter: `id=eq.${submissionId}`,
        },
        (payload) => {
          const updated = payload.new as any;
          setStatus(updated.status);
          setTeacherEval(updated);
          if (updated.status === "verified") {
            toast.success("Project Verified!", {
              description: "Your teacher has graded your project.",
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [submissionId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn("localStorage read failed", err);
    }
  }, [state]);

  const set = <K extends keyof ProjectState>(k: K, v: ProjectState[K]) =>
    setState((s) => ({ ...s, [k]: v }));

  const grantReward = (key: string, label: string, pts: number) => {
    setState((s) => {
      if (s.rewardsClaimed[key]) return s;
      setReward(label);
      toast.success(`+${pts} Competency XP`, { description: label });
      return { ...s, xp: s.xp + pts, rewardsClaimed: { ...s.rewardsClaimed, [key]: true } };
    });
  };

  // Phase locks
  const locked = {
    p1: state.grade1 !== "" || status !== "draft",
    p2: state.grade2 !== "" || status !== "draft",
    p3: state.grade3 !== "" || status !== "draft",
    p4: state.grade4 !== "" || status !== "draft",
  };

  // Grades
  const g1 = clampGrade(state.grade1, 2);
  const g2 = clampGrade(state.grade2, 3);
  const g3 = clampGrade(state.grade3, 3);
  const g4 = clampGrade(state.grade4, 2);
  const total = +(g1 + g2 + g3 + g4).toFixed(1);
  const letter = gradeLetter(total);
  const titleWords = state.title.trim().split(/\s+/).filter(Boolean).length;

  const budgetTotal = state.budget.reduce((a, b) => a + (b.cost || 0), 0);
  const recycledShare = state.budget.length
    ? Math.round(
        (state.budget.filter((b) => b.source === "Local/Recycled").reduce((a, b) => a + b.cost, 0) /
          Math.max(1, budgetTotal)) *
          100,
      )
    : 0;

  const efficiency = useMemo(() => {
    const i = Number(state.input);
    const o = Number(state.output);
    if (!i || !o) return null;
    return Math.round((o / i) * 100);
  }, [state.input, state.output]);

  const xpMax = 200; // 8 rewards * 25
  const xpPct = Math.min(100, Math.round((state.xp / xpMax) * 100));

  const handlePrint = async () => {
    if (!state.title || !state.summary) {
      toast.error("Complete Phase 1 title and Phase 4 summary before exporting.");
      return;
    }
    try {
      const { exportProjectReport } = await import("@/lib/project-pdf");
      await exportProjectReport(state);
      toast.success("PDF Exported Successfully!");
    } catch (err) {
      console.error(err);
      toast.error("PDF Export failed. Try again.");
    }
  };

  const handleSync = async () => {
    if (!user) {
      toast.error("Login to sync your project to the cloud.");
      return;
    }

    setIsSyncing(true);
    try {
      const { syncMyDraftSubmission } = await import("@/lib/project-submissions.functions");
      const data = await syncMyDraftSubmission({ data: { projectData: state } });
      setSubmissionId(data.id);
      setStatus(data.status as "draft" | "pending" | "verified");
      toast.success("Project Synced & Locked for Teacher Evaluation");
    } catch (err: any) {
      toast.error("Sync failed: " + (err?.message ?? String(err)));
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8 py-8 print:max-w-none print:py-0">
      {/* Persistent Top Bar with Curriculum Toggle */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b mb-6 pb-4 pt-2 -mx-4 md:-mx-8 px-4 md:px-8 print:hidden">
        <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black tracking-tight hidden sm:block">
              NCDC PBL Workspace
            </h1>
            <CurriculumToggle />
          </div>
          <Badge variant="outline" className="gap-1 px-3 py-1 border-primary/20 bg-primary/5">
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
            <span className="font-bold">{state.xp} XP</span>
          </Badge>
        </div>
      </div>

      {projectsUI}
      {/* Hero Header */}
      <header className="mb-6 print:hidden space-y-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Project Wizard</h1>
          <p className="text-sm text-muted-foreground">4-phase NCDC competency tracker</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2 text-xs font-semibold">
            <span>Competency XP Bar</span>
            <span className="text-muted-foreground">
              {state.xp} / {xpMax}
            </span>
          </div>
          <Progress value={xpPct} className="h-2" />
        </div>
      </header>

      {/* UNEB warning banner */}
      {useCurriculum().mode === "lower-secondary" && (
        <div className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 flex gap-3 print:hidden">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs font-medium">
            <strong>⚠️ UNEB Continuous Assessment Rule:</strong> Learners must complete and score
            this project to qualify for final end-of-cycle national UNEB registration.
          </p>
        </div>
      )}

      {/* Status Overlay for Sync/Verification */}
      {status !== "draft" && (
        <div
          className={`mb-6 rounded-2xl border p-4 flex items-center justify-between animate-pulse-subtle ${
            status === "pending"
              ? "bg-amber-500/10 border-amber-500/40 text-amber-900"
              : "bg-emerald-500/10 border-emerald-500/40 text-emerald-900"
          }`}
        >
          <div className="flex items-center gap-3">
            {status === "pending" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            )}
            <div>
              <p className="font-bold text-sm">
                {status === "pending"
                  ? "[Awaiting Teacher Verification...]"
                  : "Project Verified & Certified"}
              </p>
              <p className="text-xs opacity-80">
                {status === "pending"
                  ? "Your project is locked while the teacher reviews your competencies."
                  : "Final marks and feedback are now unlocked below."}
              </p>
            </div>
          </div>
          {status === "verified" && <Badge className="bg-emerald-600">UNLOCKED</Badge>}
        </div>
      )}

      {/* NCDC Scorecard Integration */}
      <div className="mb-8 print:hidden">
        <NCDCScorecard
          scores={{
            phase1: g1,
            phase2: g2,
            phase3: g3,
            phase4: g4,
          }}
        />
      </div>

      {/* Vertical Accordion Phases */}
      <Accordion type="multiple" defaultValue={["phase-1"]} className="space-y-4 mb-12">
        <AccordionItem value="phase-1" className="border rounded-2xl bg-card overflow-hidden px-1">
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <div className="flex items-center gap-4 text-left">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black">
                1
              </div>
              <div>
                <h3 className="font-bold">Phase 1: Planning & Design</h3>
                <p className="text-xs text-muted-foreground font-normal">
                  Title, Justification & BUBU Budget
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-6 pt-2 space-y-4">
            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-xl mb-2">
              <div className="flex-1 space-y-1">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">
                  Self-Award (0-10)
                </Label>
                <Slider
                  value={[selfAwards[1]]}
                  onValueChange={([v]) => setSelfAwards((prev) => ({ ...prev, 1: v }))}
                  max={10}
                  step={1}
                  disabled={locked.p1 || !isTeacher}
                />
              </div>
              <div className="text-right border-l pl-4">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">
                  Teacher Score
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black">{g1.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">/ 2.0</span>
                  {locked.p1 && <Lock className="h-3 w-3 text-muted-foreground" />}
                </div>
              </div>
            </div>

            <Field
              label="Project Title"
              hint={
                titleWords > 12
                  ? "⚠️ Keep title under 12 words for UNEB clarity"
                  : titleWords >= 12
                    ? "✅ Title length valid (12+ words)"
                    : undefined
              }
            >
              <Input
                disabled={locked.p1}
                value={state.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Solar-powered water filter for rural schools"
                className={titleWords >= 12 ? "border-emerald-500/50" : ""}
              />
            </Field>
            <Field label="Justification">
              <Textarea
                disabled={locked.p1}
                value={state.justification}
                onChange={(e) => set("justification", e.target.value)}
                placeholder="Why does this project matter?"
                rows={3}
                onBlur={() =>
                  state.justification.length > 60 &&
                  grantReward("p1_just", "Justification complete", 25)
                }
              />
            </Field>
            <Field label="Subject">
              <Input
                disabled={locked.p1}
                value={state.subject}
                onChange={(e) => set("subject", e.target.value)}
                placeholder="Physics / Biology / ICT…"
              />
            </Field>

            <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/30 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-bold flex items-center gap-2">
                    <Recycle className="h-4 w-4 text-emerald-500" /> BUBU Budget Tool
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Buy Uganda, Build Uganda — favour local/recycled.
                  </p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-bold">UGX {budgetTotal.toLocaleString()}</p>
                  <p className="text-emerald-500 font-bold">{recycledShare}% recycled</p>
                </div>
              </div>
              <BudgetEditor
                items={state.budget}
                disabled={locked.p1}
                onChange={(items) => {
                  set("budget", items);
                  if (items.length >= 3) grantReward("p1_budget", "BUBU budget complete", 25);
                }}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="phase-2" className="border rounded-2xl bg-card overflow-hidden px-1">
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <div className="flex items-center gap-4 text-left">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black">
                2
              </div>
              <div>
                <h3 className="font-bold">Phase 2: Implementation & Logbook</h3>
                <p className="text-xs text-muted-foreground font-normal">
                  Weekly activities, challenges & generic skills
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-6 pt-2 space-y-4">
            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-xl mb-2">
              <div className="flex-1 space-y-1">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">
                  Self-Award (0-10)
                </Label>
                <Slider
                  value={[selfAwards[2]]}
                  onValueChange={([v]) => setSelfAwards((prev) => ({ ...prev, 2: v }))}
                  max={10}
                  step={1}
                  disabled={locked.p2 || !isTeacher}
                />
              </div>
              <div className="text-right border-l pl-4">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">
                  Teacher Score
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black">{g2.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">/ 3.0</span>
                  {locked.p2 && <Lock className="h-3 w-3 text-muted-foreground" />}
                </div>
              </div>
            </div>

            <LogbookEditor
              logs={state.logs}
              disabled={locked.p2}
              onChange={(logs) => {
                set("logs", logs);
                if (logs.length >= 1) grantReward("p2_log1", "First weekly log added", 25);
                if (logs.length >= 4) grantReward("p2_log4", "Four-week logbook complete", 25);
              }}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="phase-3" className="border rounded-2xl bg-card overflow-hidden px-1">
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <div className="flex items-center gap-4 text-left">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black">
                3
              </div>
              <div>
                <h3 className="font-bold">Phase 3: Output & Testing</h3>
                <p className="text-xs text-muted-foreground font-normal">
                  Uniqueness, input/output & efficiency calc
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-6 pt-2 space-y-4">
            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-xl mb-2">
              <div className="flex-1 space-y-1">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">
                  Self-Award (0-10)
                </Label>
                <Slider
                  value={[selfAwards[3]]}
                  onValueChange={([v]) => setSelfAwards((prev) => ({ ...prev, 3: v }))}
                  max={10}
                  step={1}
                  disabled={locked.p3 || !isTeacher}
                />
              </div>
              <div className="text-right border-l pl-4">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">
                  Teacher Score
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black">{g3.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">/ 3.0</span>
                  {locked.p3 && <Lock className="h-3 w-3 text-muted-foreground" />}
                </div>
              </div>
            </div>

            <Field label="What makes your product unique?">
              <Textarea
                disabled={locked.p3}
                value={state.uniqueness}
                onChange={(e) => set("uniqueness", e.target.value)}
                rows={3}
                onBlur={() =>
                  state.uniqueness.length > 40 &&
                  grantReward("p3_unique", "Uniqueness described", 25)
                }
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Input units (resources used)">
                <Input
                  type="number"
                  disabled={locked.p3}
                  value={state.input}
                  onChange={(e) => set("input", e.target.value)}
                />
              </Field>
              <Field label="Output units (results)">
                <Input
                  type="number"
                  disabled={locked.p3}
                  value={state.output}
                  onChange={(e) => set("output", e.target.value)}
                />
              </Field>
            </div>
            {efficiency !== null && (
              <div className="mt-3 rounded-xl bg-primary/10 border border-primary/30 p-3 text-sm font-bold flex justify-between items-center">
                <span>Production Efficiency</span>
                <span className="text-xl">{efficiency}%</span>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="phase-4" className="border rounded-2xl bg-card overflow-hidden px-1">
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <div className="flex items-center gap-4 text-left">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black">
                4
              </div>
              <div>
                <h3 className="font-bold">Phase 4: Final Report</h3>
                <p className="text-xs text-muted-foreground font-normal">
                  Final summary, metadata & PDF export
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-6 pt-2 space-y-4">
            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-xl mb-2">
              <div className="flex-1 space-y-1">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">
                  Self-Award (0-10)
                </Label>
                <Slider
                  value={[selfAwards[4]]}
                  onValueChange={([v]) => setSelfAwards((prev) => ({ ...prev, 4: v }))}
                  max={10}
                  step={1}
                  disabled={locked.p4 || !isTeacher}
                />
              </div>
              <div className="text-right border-l pl-4">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">
                  Teacher Score
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black">{g4.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">/ 2.0</span>
                  {locked.p4 && <Lock className="h-3 w-3 text-muted-foreground" />}
                </div>
              </div>
            </div>

            <Field label="Final summary">
              <Textarea
                disabled={locked.p4}
                value={state.summary}
                onChange={(e) => set("summary", e.target.value)}
                rows={5}
                placeholder="Findings, lessons learned, and impact…"
                onBlur={() =>
                  state.summary.length > 100 &&
                  grantReward("p4_summary", "Final summary written", 25)
                }
              />
            </Field>
            <div className="grid sm:grid-cols-3 gap-3 mt-3">
              <Field label="Student name">
                <Input
                  value={state.studentName}
                  onChange={(e) => set("studentName", e.target.value)}
                />
              </Field>
              <Field label="Class">
                <Input value={state.className} onChange={(e) => set("className", e.target.value)} />
              </Field>
              <Field label="UNEB index / centre">
                <Input value={state.unebIndex} onChange={(e) => set("unebIndex", e.target.value)} />
              </Field>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <ProjectActions
                state={state}
                user={user}
                profile={profile}
                status={status}
                onSync={handleSync}
                isSyncing={isSyncing}
              />
              <Button
                onClick={handlePrint}
                variant="outline"
                className="h-14 gap-2 border-primary/20 hover:bg-primary/5"
                size="lg"
              >
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Teacher Evaluation Canvas - Institutional Verification Footer */}
      <TeacherEvaluationCanvas
        submissionId={submissionId}
        studentState={state}
        evalData={teacherEval}
        onVerified={() => loadSubmission()}
      />

      {/* Reward modal */}
      {reward && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 print:hidden"
          onClick={() => setReward(null)}
        >
          <div className="rounded-3xl bg-card border border-border p-8 text-center max-w-sm shadow-2xl animate-in zoom-in-95">
            <Sparkles className="h-12 w-12 text-amber-500 mx-auto mb-3" />
            <h3 className="text-2xl font-black mb-1">Congratulations! 🎉</h3>
            <p className="text-sm text-muted-foreground mb-2">{reward}</p>
            <p className="text-lg font-bold text-primary">+25 Competency Points</p>
            <Button onClick={() => setReward(null)} className="mt-4 w-full">
              Keep going
            </Button>
          </div>
        </div>
      )}

      {/* Print-only formal report */}
      <PrintReport
        state={state}
        g1={g1}
        g2={g2}
        g3={g3}
        g4={g4}
        total={total}
        letter={letter}
        budgetTotal={budgetTotal}
        efficiency={efficiency}
        teacherEval={teacherEval}
      />

      <style>{`
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(0.99); }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 3s ease-in-out infinite;
        }
        .print-report { display: none; }
      `}</style>
    </div>
  );
}

function TeacherEvaluationCanvas({ submissionId, studentState, evalData, onVerified }: any) {
  const { user } = useAuth();
  const [isTeacher, setIsTeacher] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    teacherName: "",
    license: "",
    schoolKey: "",
    comments: "",
    phase1: "0",
    phase2: "0",
    phase3: "0",
    phase4: "0",
  });

  useEffect(() => {
    const checkRole = async () => {
      if (!user) return;
      const { data } = await supabase.rpc("has_role", { uid: user.id, requested_role: "teacher" });
      setIsTeacher(!!data);
    };
    checkRole();
  }, [user]);

  useEffect(() => {
    if (evalData) {
      setFormData({
        teacherName: evalData.teacher_name || "",
        license: evalData.teacher_license || "",
        schoolKey: evalData.school_key || "",
        comments: evalData.teacher_comments || "",
        phase1: String(evalData.phase1_score || 0),
        phase2: String(evalData.phase2_score || 0),
        phase3: String(evalData.phase3_score || 0),
        phase4: String(evalData.phase4_score || 0),
      });
    }
  }, [evalData]);

  const handleVerify = async () => {
    if (!formData.teacherName || !formData.license || !formData.schoolKey) {
      toast.error("Institutional credentials are required for NCDC compliance.");
      return;
    }

    setLoading(true);
    try {
      const { submitTeacherEvaluation } = await import("@/lib/project-submissions.functions");
      await submitTeacherEvaluation({
        data: {
          submissionId,
          teacherName: formData.teacherName,
          license: formData.license,
          schoolKey: formData.schoolKey,
          comments: formData.comments,
          phase1: Number(formData.phase1) || 0,
          phase2: Number(formData.phase2) || 0,
          phase3: Number(formData.phase3) || 0,
          phase4: Number(formData.phase4) || 0,
        },
      });
      toast.success("Institutional Verification Complete", {
        description: "Project has been marked as UNEB-ready.",
      });
      onVerified();
    } catch (e: any) {
      toast.error("Verification failed: " + (e?.message || "Unauthorized"));
    } finally {
      setLoading(false);
    }
  };

  if (!submissionId) return null;
  if (!isTeacher && evalData?.status !== "verified") return null;

  return (
    <div className="mt-12 rounded-3xl border-2 border-primary/20 bg-muted/30 p-8 shadow-inner print:mt-8">
      <div className="flex items-center gap-3 mb-6">
        <UserCheck className="h-8 w-8 text-primary" />
        <h2 className="text-2xl font-black uppercase tracking-tight">Teacher Evaluation Canvas</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Verification Form */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Teacher Name">
              <Input
                disabled={!isTeacher || evalData?.status === "verified"}
                value={formData.teacherName}
                onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
                placeholder="Full Name"
              />
            </Field>
            <Field label="License No. (Certified)">
              <Input
                disabled={!isTeacher || evalData?.status === "verified"}
                value={formData.license}
                onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                placeholder="REG/XXXX/XX"
              />
            </Field>
          </div>
          <Field label="Institutional School Key (Private)">
            <Input
              type="password"
              disabled={!isTeacher || evalData?.status === "verified"}
              value={formData.schoolKey}
              onChange={(e) => setFormData({ ...formData, schoolKey: e.target.value })}
              placeholder="••••••••"
            />
          </Field>
          <Field label="Teacher Remarks & UNEB Comments">
            <Textarea
              disabled={!isTeacher || evalData?.status === "verified"}
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              placeholder="Describe the student's mastery..."
              rows={4}
            />
          </Field>
        </div>

        {/* Scoring Matrix */}
        <div className="rounded-2xl border bg-background p-6 space-y-4 shadow-sm">
          <p className="text-xs font-black uppercase text-muted-foreground mb-2">
            NCDC Assessment points
          </p>
          <div className="space-y-3">
            {[
              { id: "phase1", label: "Phase 1: Planning", max: 2 },
              { id: "phase2", label: "Phase 2: Logbook", max: 3 },
              { id: "phase3", label: "Phase 3: Testing", max: 3 },
              { id: "phase4", label: "Phase 4: Summary", max: 2 },
            ].map((m) => (
              <div key={m.id} className="flex items-center justify-between">
                <Label className="text-sm font-bold">{m.label}</Label>
                <div className="flex items-center gap-2">
                  <select
                    disabled={!isTeacher || evalData?.status === "verified"}
                    className="h-9 w-20 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm"
                    value={(formData as any)[m.id]}
                    onChange={(e) => setFormData({ ...formData, [m.id]: e.target.value })}
                  >
                    {Array.from({ length: m.max * 10 + 1 }, (_, i) => (i / 10).toFixed(1)).map(
                      (v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ),
                    )}
                  </select>
                  <span className="text-xs text-muted-foreground">/ {m.max}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t mt-4 flex items-center justify-between">
            <span className="text-lg font-black">TOTAL SCORE</span>
            <span className="text-3xl font-black text-primary">
              {(
                Number(formData.phase1) +
                Number(formData.phase2) +
                Number(formData.phase3) +
                Number(formData.phase4)
              ).toFixed(1)}
              <span className="text-sm text-muted-foreground"> / 10.0</span>
            </span>
          </div>

          {isTeacher && evalData?.status !== "verified" && (
            <Button
              onClick={handleVerify}
              disabled={loading}
              className="w-full mt-4 h-12 bg-primary hover:bg-primary/90 font-bold uppercase tracking-widest shadow-lg"
            >
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <ShieldCheck className="mr-2 h-5 w-5" />
              )}
              Verify & Commit Submission
            </Button>
          )}

          {evalData?.status === "verified" && (
            <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-bold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Institutional Seal Applied on {new Date(evalData.verified_at).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PhaseCard({
  n,
  title,
  maxMarks,
  locked,
  gradeValue,
  onGrade,
  children,
}: {
  n: number;
  title: string;
  maxMarks: number;
  locked: boolean;
  gradeValue: string;
  onGrade: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-5 rounded-3xl border border-border bg-card overflow-hidden print:hidden">
      <header className="flex items-center justify-between bg-muted/40 px-5 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
            {n}
          </div>
          <h2 className="font-bold">{title}</h2>
          {locked && <Lock className="h-4 w-4 text-muted-foreground" />}
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Teacher grade /{maxMarks}</Label>
          <Input
            type="number"
            min={0}
            max={maxMarks}
            step={0.1}
            value={gradeValue}
            onChange={(e) => onGrade(e.target.value)}
            className="w-20 h-8 text-sm"
            placeholder="—"
          />
          {locked && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
        </div>
      </header>
      <div className="p-5 space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-xs font-semibold mb-1.5 block">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-amber-500 mt-1 font-semibold">{hint}</p>}
    </div>
  );
}

function BudgetEditor({
  items,
  disabled,
  onChange,
}: {
  items: BudgetItem[];
  disabled: boolean;
  onChange: (i: BudgetItem[]) => void;
}) {
  const [name, setName] = useState("");
  const [source, setSource] = useState<BudgetItem["source"]>("Local/Recycled");
  const [cost, setCost] = useState("");

  const add = () => {
    if (!name || !cost) return;
    onChange([...items, { id: crypto.randomUUID(), name, source, cost: Number(cost) }]);
    setName("");
    setCost("");
  };

  return (
    <div className="space-y-2">
      {items.map((b) => (
        <div
          key={b.id}
          className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs transition-all ${b.source === "Local/Recycled" ? "border-emerald-500/40 bg-emerald-500/5 ring-1 ring-emerald-500/10 shadow-sm" : "border-border bg-background"}`}
        >
          <div
            className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${b.source === "Local/Recycled" ? "bg-emerald-500/20" : "bg-muted"}`}
          >
            {b.source === "Local/Recycled" ? (
              <Recycle className="h-4 w-4 text-emerald-600" />
            ) : (
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold truncate">{b.name}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{b.source}</p>
          </div>
          <div className="text-right mr-2">
            <p className="font-black text-sm">UGX {b.cost.toLocaleString()}</p>
          </div>
          {!disabled && (
            <button
              onClick={() => onChange(items.filter((x) => x.id !== b.id))}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
      {!disabled && (
        <div className="flex flex-wrap gap-2 mt-4 p-3 rounded-xl bg-muted/30 border border-dashed">
          <Input
            placeholder="Item name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 min-w-[120px] h-9"
          />
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as BudgetItem["source"])}
            className="rounded-md border border-input bg-background px-2 text-xs h-9 outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option>Local/Recycled</option>
            <option>Purchased New</option>
          </select>
          <Input
            placeholder="Cost"
            type="number"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className="w-24 h-9"
          />
          <Button onClick={add} size="sm" variant="secondary" className="gap-1 h-9">
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
      )}
    </div>
  );
}

function LogbookEditor({
  logs,
  disabled,
  onChange,
}: {
  logs: WeekLog[];
  disabled: boolean;
  onChange: (l: WeekLog[]) => void;
}) {
  const addLog = () => {
    onChange([
      ...logs,
      {
        id: crypto.randomUUID(),
        week: `Week ${logs.length + 1}`,
        activity: "",
        challenges: "",
        skills: [],
      },
    ]);
  };
  const update = (id: string, patch: Partial<WeekLog>) => {
    onChange(logs.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };
  const toggleSkill = (id: string, skill: string) => {
    const l = logs.find((x) => x.id === id);
    if (!l) return;
    const has = l.skills.includes(skill);
    update(id, { skills: has ? l.skills.filter((s) => s !== skill) : [...l.skills, skill] });
  };
  return (
    <div className="space-y-4">
      {logs.map((l) => (
        <div
          key={l.id}
          className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3 relative group"
        >
          {!disabled && (
            <button
              onClick={() => onChange(logs.filter((x) => x.id !== l.id))}
              className="absolute top-4 right-4 h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <div className="flex items-center gap-3 mb-1">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <Input
              disabled={disabled}
              value={l.week}
              onChange={(e) => update(l.id, { week: e.target.value })}
              className="font-bold h-8 w-32 bg-transparent border-none p-0 focus-visible:ring-0"
            />
          </div>
          <div className="space-y-3">
            <div>
              <Label className="text-[10px] font-black uppercase text-muted-foreground mb-1 block">
                Activity Description
              </Label>
              <Textarea
                disabled={disabled}
                placeholder="What did you do this week?"
                value={l.activity}
                onChange={(e) => update(l.id, { activity: e.target.value })}
                rows={2}
                className="bg-background/50"
              />
            </div>
            <div>
              <Label className="text-[10px] font-black uppercase text-muted-foreground mb-1 block">
                Challenges Faced
              </Label>
              <Textarea
                disabled={disabled}
                placeholder="Any obstacles or difficulties?"
                value={l.challenges}
                onChange={(e) => update(l.id, { challenges: e.target.value })}
                rows={2}
                className="bg-background/50"
              />
            </div>
          </div>
          <div>
            <Label className="text-[10px] font-black uppercase text-muted-foreground mb-2 block">
              Generic Skills Gained
            </Label>
            <div className="flex flex-wrap gap-2">
              {SKILLS.map((s) => {
                const active = l.skills.includes(s);
                return (
                  <button
                    key={s}
                    disabled={disabled}
                    onClick={() => toggleSkill(l.id, s)}
                    className={`text-[11px] px-3 py-1.5 rounded-xl border transition-all font-bold ${active ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-background border-border text-muted-foreground hover:border-primary/50 hover:text-primary"}`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ))}
      {!disabled && (
        <Button
          onClick={addLog}
          variant="outline"
          size="sm"
          className="w-full h-12 gap-2 border-dashed border-2 hover:bg-primary/5"
        >
          <Plus className="h-4 w-4" />
          Add Weekly Log Entry
        </Button>
      )}
    </div>
  );
}

function PrintReport({
  state,
  g1,
  g2,
  g3,
  g4,
  total,
  letter,
  budgetTotal,
  efficiency,
  teacherEval,
}: any) {
  return (
    <div className="print-report" style={{ fontFamily: "Georgia, serif", color: "#000" }}>
      <div
        style={{
          textAlign: "center",
          borderBottom: "3px double #000",
          paddingBottom: 12,
          marginBottom: 16,
        }}
      >
        <h1 style={{ fontSize: 18, fontWeight: 900, margin: 0, letterSpacing: 1 }}>
          CYMATIC HUB EVOLUTION
        </h1>
        <p style={{ fontSize: 12, margin: "4px 0 0" }}>
          LOWER SECONDARY EXCELLENCE REPORT — NCDC 2026
        </p>
      </div>

      <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse", marginBottom: 14 }}>
        <tbody>
          {[
            ["Student Name", state.studentName || "—"],
            ["Class", state.className || "—"],
            ["Subject", state.subject || "—"],
            ["Project Title", state.title || "—"],
            ["UNEB Centre / Index", state.unebIndex || "—"],
          ].map(([k, v]) => (
            <tr key={k as string}>
              <td style={{ border: "1px solid #000", padding: 6, fontWeight: 700, width: "30%" }}>
                {k}
              </td>
              <td style={{ border: "1px solid #000", padding: 6 }}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ fontSize: 13, margin: "12px 0 6px", borderBottom: "1px solid #000" }}>
        BUBU Budget
      </h3>
      <table style={{ width: "100%", fontSize: 10, borderCollapse: "collapse", marginBottom: 12 }}>
        <thead>
          <tr>
            <th style={th}>Item</th>
            <th style={th}>Source</th>
            <th style={th}>Cost (UGX)</th>
          </tr>
        </thead>
        <tbody>
          {state.budget.map((b: BudgetItem) => (
            <tr key={b.id}>
              <td style={td}>{b.name}</td>
              <td style={td}>{b.source}</td>
              <td style={td}>{b.cost.toLocaleString()}</td>
            </tr>
          ))}
          <tr>
            <td style={{ ...td, fontWeight: 700 }} colSpan={2}>
              Total
            </td>
            <td style={{ ...td, fontWeight: 700 }}>{budgetTotal.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      <h3 style={{ fontSize: 13, margin: "12px 0 6px", borderBottom: "1px solid #000" }}>
        Weekly Logs
      </h3>
      <table style={{ width: "100%", fontSize: 10, borderCollapse: "collapse", marginBottom: 12 }}>
        <thead>
          <tr>
            <th style={th}>Week</th>
            <th style={th}>Activity</th>
            <th style={th}>Challenges</th>
            <th style={th}>Skills</th>
          </tr>
        </thead>
        <tbody>
          {state.logs.map((l: WeekLog) => (
            <tr key={l.id}>
              <td style={td}>{l.week}</td>
              <td style={td}>{l.activity}</td>
              <td style={td}>{l.challenges}</td>
              <td style={td}>{l.skills.join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ fontSize: 13, margin: "12px 0 6px", borderBottom: "1px solid #000" }}>
        Phase 3 Efficiency
      </h3>
      <p style={{ fontSize: 11, margin: "4px 0 12px" }}>
        Input: {state.input || "—"} · Output: {state.output || "—"} · Efficiency:{" "}
        {efficiency !== null ? `${efficiency}%` : "—"}
      </p>
      <p style={{ fontSize: 11, margin: "4px 0 12px" }}>
        <strong>Uniqueness:</strong> {state.uniqueness || "—"}
      </p>
      <p style={{ fontSize: 11, margin: "4px 0 12px" }}>
        <strong>Final Summary:</strong> {state.summary || "—"}
      </p>

      <h3 style={{ fontSize: 13, margin: "16px 0 6px", borderBottom: "1px solid #000" }}>
        Official Scoring Matrix
      </h3>
      <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse", marginBottom: 16 }}>
        <thead>
          <tr>
            <th style={th}>Phase</th>
            <th style={th}>Max</th>
            <th style={th}>Awarded</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={td}>1. Planning & Design</td>
            <td style={td}>2.0</td>
            <td style={td}>{teacherEval?.phase1_score?.toFixed(1) || g1.toFixed(1)}</td>
          </tr>
          <tr>
            <td style={td}>2. Implementation & Logbook</td>
            <td style={td}>3.0</td>
            <td style={td}>{teacherEval?.phase2_score?.toFixed(1) || g2.toFixed(1)}</td>
          </tr>
          <tr>
            <td style={td}>3. Product Output & Testing</td>
            <td style={td}>3.0</td>
            <td style={td}>{teacherEval?.phase3_score?.toFixed(1) || g3.toFixed(1)}</td>
          </tr>
          <tr>
            <td style={td}>4. Final Report</td>
            <td style={td}>2.0</td>
            <td style={td}>{teacherEval?.phase4_score?.toFixed(1) || g4.toFixed(1)}</td>
          </tr>
          <tr>
            <td style={{ ...td, fontWeight: 700 }}>TOTAL</td>
            <td style={{ ...td, fontWeight: 700 }}>10.0</td>
            <td style={{ ...td, fontWeight: 700 }}>
              {teacherEval?.total_competency_score?.toFixed(1) || total.toFixed(1)} ({letter.letter}{" "}
              — {letter.label})
            </td>
          </tr>
        </tbody>
      </table>

      {teacherEval?.status === "verified" && (
        <div style={{ marginBottom: 20, fontSize: 11 }}>
          <p>
            <strong>Teacher Comments:</strong> {teacherEval.teacher_comments}
          </p>
          <p>
            <strong>Verified By:</strong> {teacherEval.teacher_name} (License:{" "}
            {teacherEval.teacher_license})
          </p>
        </div>
      )}

      <div style={{ marginTop: 40, display: "flex", justifyContent: "space-between", gap: 40 }}>
        <div style={{ flex: 1 }}>
          <div style={{ borderTop: "1px solid #000", paddingTop: 4, fontSize: 10 }}>
            {teacherEval?.status === "verified"
              ? `E-Signed: ${teacherEval.teacher_name}`
              : "Subject Teacher Signature"}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ borderTop: "1px solid #000", paddingTop: 4, fontSize: 10 }}>
            Headteacher Stamp / Signature
          </div>
        </div>
      </div>
    </div>
  );
}

const th: React.CSSProperties = {
  border: "1px solid #000",
  padding: 5,
  textAlign: "left",
  background: "#eee",
};
const td: React.CSSProperties = { border: "1px solid #000", padding: 5 };
