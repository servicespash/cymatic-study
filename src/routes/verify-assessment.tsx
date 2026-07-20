import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  getProjectSubmissionForMarking,
  verifyProjectSubmission,
} from "@/lib/project-submissions.functions";
import { gradeLabel, scoreToGrade, type Project } from "@/lib/projects-store";

export const Route = createFileRoute("/verify-assessment")({
  head: () => ({
    meta: [
      { title: "Teacher Verification — Cymatic Study" },
      { name: "description", content: "Secure teacher-only project marking section." },
    ],
  }),
  component: VerifyAssessmentPage,
});

function VerifyAssessmentPage() {
  const [token, setToken] = useState("");
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [score, setScore] = useState("");
  const [comment, setComment] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [teacherTitle, setTeacherTitle] = useState("");
  const [teacherLicenseId, setTeacherLicenseId] = useState("");
  const [schoolReferenceKey, setSchoolReferenceKey] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const nextToken = new URLSearchParams(window.location.search).get("token") ?? "";
    setToken(nextToken);
    if (!nextToken) {
      setError("No verification token was provided.");
      setLoading(false);
      return;
    }

    // Swapped full-stack wrapper invocation for native client invocation
    getProjectSubmissionForMarking({ token: nextToken })
      .then((res) => {
        setProject(res.project as Project);
        const mark = (res.project as Project).teacherMark;
        if (mark) {
          setScore(String(mark.score));
          setComment(mark.comment);
          setTeacherName(mark.teacherName ?? "");
          setTeacherTitle(mark.teacherTitle ?? "");
          setTeacherLicenseId(mark.teacherLicenseId ?? "");
          setSchoolReferenceKey(mark.schoolReferenceKey ?? "");
        }
      })
      .catch((err) => {
        console.error(err);
        setError("This verification link is invalid or has expired.");
      })
      .finally(() => setLoading(false));
  }, []);

  const numericScore = useMemo(() => Math.max(0, Math.min(100, Number(score) || 0)), [score]);
  const grade = scoreToGrade(numericScore);

  const verify = async () => {
    if (!project || !token || score === "") {
      toast.error("Enter a score before verifying.");
      return;
    }
    setVerifying(true);
    try {
      // Swapped full-stack wrapper invocation for native client invocation
      const res = await verifyProjectSubmission({
        token,
        score: numericScore,
        comment,
        teacherName,
        teacherTitle,
        teacherLicenseId,
        schoolReferenceKey,
      });
      setProject(res.project as Project);
      toast.success("Marks verified. The student's app will update automatically.");
    } catch (err) {
      console.error(err);
      toast.error("Could not verify marks.");
    } finally {
      setVerifying(false);
    }
  };

  const download = async () => {
    if (!project?.teacherMark) {
      toast.error("Verify marks before downloading the final PDF.");
      return;
    }
    try {
      const { exportProjectReport } = await import("@/lib/project-pdf");
      await exportProjectReport(project, "Teacher-Verified");
      toast.success("PDF downloaded");
    } catch (err) {
      console.error(err);
      toast.error("Could not generate PDF.");
    }
  };

  if (loading) return <Shell>Loading teacher verification…</Shell>;
  if (error || !project) return <Shell>{error || "Project not found."}</Shell>;

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground">
      <div className="mx-auto max-w-3xl space-y-5">
        <header className="rounded-2xl border border-primary/30 bg-primary/10 p-5">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
            <ShieldCheck className="h-4 w-4" /> Cymatic Study Teacher's Marking Section
          </p>
          <h1 className="mt-2 text-2xl font-black">{project.title || "Untitled project"}</h1>
          <p className="text-sm text-muted-foreground">
            {project.studentName || "Student"} · {project.className || "Class not set"} ·{" "}
            {project.schoolName || "School not set"}
          </p>
        </header>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Submitted worksheet summary
          </h2>
          <Read label="Subject" value={project.subject} />
          <Read label="Justification" value={project.justification} />
          <Read label="Final report" value={project.summary} />
          <p className="mt-3 text-xs text-muted-foreground">
            Budget items: {project.budget.length} · Logbook entries: {project.logs.length}
          </p>
        </section>

        <section className="rounded-2xl border border-primary/40 bg-card p-5">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-primary">
            Official verification footer
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Awarded score / 100">
              <Input
                type="number"
                min={0}
                max={100}
                value={score}
                onChange={(e) => setScore(e.target.value)}
              />
            </Field>
            <div className="rounded-lg bg-muted px-4 py-3 text-sm">
              <span className="text-muted-foreground">Grade: </span>
              <strong>{score === "" ? "—" : `${grade} — ${gradeLabel(grade)}`}</strong>
            </div>
            <Field label="Teacher name">
              <Input value={teacherName} onChange={(e) => setTeacherName(e.target.value)} />
            </Field>
            <Field label="Title / subject">
              <Input value={teacherTitle} onChange={(e) => setTeacherTitle(e.target.value)} />
            </Field>
            <Field label="License / registration number">
              <Input
                value={teacherLicenseId}
                onChange={(e) => setTeacherLicenseId(e.target.value)}
              />
            </Field>
            <Field label="School reference key">
              <Input
                value={schoolReferenceKey}
                onChange={(e) => setSchoolReferenceKey(e.target.value)}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Remarks">
                <Textarea rows={4} value={comment} onChange={(e) => setComment(e.target.value)} />
              </Field>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={verify} disabled={verifying} className="gap-2">
              <CheckCircle2 className="h-4 w-4" /> Verify
            </Button>
            <Button onClick={download} variant="secondary" className="gap-2">
              <Download className="h-4 w-4" /> Download verified PDF
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 text-center text-sm text-muted-foreground">
      {children}
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs font-semibold">{label}</Label>
      {children}
    </div>
  );
}

function Read({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="whitespace-pre-wrap text-sm">{value || "—"}</p>
    </div>
  );
}
