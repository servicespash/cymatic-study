import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Copy, Download, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { decodeProjectPayload, encodeProjectPayload } from "@/lib/project-link";
import { gradeLabel, scoreToGrade, type Project, type TeacherMark } from "@/lib/projects-store";
import { PrintReport } from "@/components/PrintReport";
import { generateVectorPdf, safeFilename } from "@/lib/pdf-export";

export const Route = createFileRoute("/mark/$projectId")({
  head: () => ({
    meta: [
      { title: "Teacher's Marking Section — Cymatic Hub" },
      {
        name: "description",
        content: "Open a student-submitted project, award marks, and download the official report.",
      },
    ],
  }),
  component: MarkPage,
});

function MarkPage() {
  const [payload, setPayload] = useState<{ project: Project; token: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [score, setScore] = useState("");
  const [comment, setComment] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [teacherTitle, setTeacherTitle] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash || "";
    const match = hash.match(/d=([^&]+)/);
    if (!match) {
      setError("No marking payload found in this link.");
      return;
    }
    const decoded = decodeProjectPayload(match[1]);
    if (!decoded) {
      setError("This marking link is invalid or has been tampered with.");
      return;
    }
    setPayload(decoded);
    if (decoded.project.teacherMark) {
      const m = decoded.project.teacherMark;
      setScore(String(m.score));
      setComment(m.comment);
      setTeacherName(m.teacherName ?? "");
      setTeacherTitle(m.teacherTitle ?? "");
    }
  }, []);

  const numericScore = useMemo(() => {
    const n = Number(score);
    if (!isFinite(n)) return 0;
    return Math.max(0, Math.min(100, n));
  }, [score]);
  const grade = scoreToGrade(numericScore);

  const projectWithMark = useMemo<Project | null>(() => {
    if (!payload) return null;
    if (!score) return payload.project;
    const mark: TeacherMark = {
      score: numericScore,
      grade,
      comment: comment.trim(),
      teacherName: teacherName.trim() || undefined,
      teacherTitle: teacherTitle.trim() || undefined,
      markedAt: new Date().toISOString(),
      token: payload.token,
    };
    return { ...payload.project, teacherMark: mark };
  }, [payload, score, numericScore, grade, comment, teacherName, teacherTitle]);

  const handleDownload = async () => {
    if (!projectWithMark) return;
    if (!score) {
      toast.error("Enter a score before downloading the report.");
      return;
    }
    try {
      const name = safeFilename(
        `${projectWithMark.studentName || "student"}-${projectWithMark.title || "project"}-marked`,
      );
      await generateVectorPdf(projectWithMark, `${name}.pdf`);
      toast.success("Marked report downloaded");
    } catch (e) {
      console.error(e);
      toast.error("Could not generate PDF");
    }
  };

  const handleCopyReturnLink = async () => {
    if (!projectWithMark || !payload) return;
    if (!score) {
      toast.error("Enter a score before generating the return link.");
      return;
    }
    const encoded = encodeProjectPayload(projectWithMark, payload.token);
    const url = `${window.location.origin}/mark/${projectWithMark.id}#d=${encoded}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Return link copied — send it back to the student.");
    } catch {
      toast.error("Copy failed — long-press to copy manually.");
    }
  };

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-xl font-bold mb-2">Marking link unavailable</h1>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!payload || !projectWithMark) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-muted-foreground">
        Loading project…
      </div>
    );
  }

  const p = projectWithMark;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 rounded-2xl border border-primary/30 bg-primary/5 p-5">
        <p className="text-xs font-bold text-primary uppercase tracking-wider">
          Teacher's Marking Section
        </p>
        <h1 className="text-2xl font-black mt-1">{p.title || "Untitled project"}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Submitted by <strong>{p.studentName || "—"}</strong>
          {p.className ? ` · ${p.className}` : ""}
          {p.schoolName ? ` · ${p.schoolName}` : ""}
        </p>
      </div>

      {/* Worksheets read-only */}
      <section className="mb-6 rounded-2xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Student Worksheets
        </h2>
        <ReadField label="Subject" value={p.subject} />
        <ReadField label="Justification" value={p.justification} />
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">BUBU Budget</p>
          <ul className="text-sm space-y-1">
            {p.budget.length === 0 && <li className="text-muted-foreground">—</li>}
            {p.budget.map((b) => (
              <li key={b.id} className="flex justify-between border-b border-border/40 py-1">
                <span>
                  {b.name} <span className="text-xs text-muted-foreground">({b.source})</span>
                </span>
                <span className="font-mono">UGX {b.cost.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Weekly Logs</p>
          <ul className="text-sm space-y-2">
            {p.logs.length === 0 && <li className="text-muted-foreground">—</li>}
            {p.logs.map((l) => (
              <li key={l.id} className="rounded border border-border/60 p-2">
                <div className="font-bold">{l.week}</div>
                <div className="text-xs">
                  <strong>Activity:</strong> {l.activity || "—"}
                </div>
                <div className="text-xs">
                  <strong>Challenges:</strong> {l.challenges || "—"}
                </div>
                <div className="text-xs text-muted-foreground">
                  Skills: {l.skills.join(", ") || "—"}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <ReadField label="Uniqueness" value={p.uniqueness} />
        <ReadField
          label="Output vs Input"
          value={`Input ${p.input || "—"} → Output ${p.output || "—"}`}
        />
        <ReadField label="Final Summary" value={p.summary} />
      </section>

      {/* Marking form */}
      <section className="mb-6 rounded-2xl border border-primary/40 bg-card p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-primary mb-4">
          Award Marks
        </h2>
        <div className="grid sm:grid-cols-3 gap-3 mb-3">
          <div className="sm:col-span-1">
            <Label className="text-xs">Score (0–100)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="e.g. 78"
            />
          </div>
          <div className="sm:col-span-2 flex items-end">
            <div className="rounded-lg bg-muted px-4 py-2 w-full">
              <span className="text-xs text-muted-foreground">Grade: </span>
              <span className="text-lg font-black">
                {score ? `${grade} — ${gradeLabel(grade)}` : "—"}
              </span>
            </div>
          </div>
        </div>
        <div className="mb-3">
          <Label className="text-xs">Comment</Label>
          <Textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Strengths, areas to improve…"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Teacher name (optional)</Label>
            <Input
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              placeholder="Mr. / Ms. …"
            />
          </div>
          <div>
            <Label className="text-xs">Title / Subject (optional)</Label>
            <Input
              value={teacherTitle}
              onChange={(e) => setTeacherTitle(e.target.value)}
              placeholder="HOD Physics"
            />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Save & download PDF
          </Button>
          <Button onClick={handleCopyReturnLink} variant="secondary" className="gap-2">
            <Copy className="h-4 w-4" />
            Copy return link for student
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Students cannot enter marks in
          the app — only the teacher's link can record them.
        </p>
      </section>

      {/* Hidden print container */}
      <div
        style={{
          position: "fixed",
          left: "-10000px",
          top: 0,
          pointerEvents: "none",
        }}
        aria-hidden
      >
        <PrintReport ref={printRef} project={projectWithMark} />
      </div>
    </div>
  );
}

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground mb-1">{label}</p>
      <p className="text-sm whitespace-pre-wrap">{value || "—"}</p>
    </div>
  );
}
