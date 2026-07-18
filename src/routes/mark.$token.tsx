import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ShieldAlert, CheckCircle2, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/mark/$token")({
  head: () => ({
    meta: [
      { title: "Marking Station — Cymatic Study" },
      { name: "description", content: "External teacher marking station." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: MarkTokenPage,
});

export interface ProjectData {
  title?: string;
  description?: string;
  subject?: string;
  justification?: string;
  studentName?: string;
  student_name?: string;
  className?: string;
  schoolName?: string;
}

export interface ProjectPayload {
  student_name?: string;
  submission_date?: string;
}

export interface Submission {
  id: string;
  project_id: string | null;
  student_user_id: string | null;
  project_data: ProjectData | null;
  project_payload: ProjectPayload | null;
  status: string;
  is_verified: boolean;
  phase1_score: number | null;
  phase2_score: number | null;
  phase3_score: number | null;
  phase4_score: number | null;
  awarded_score: number | null;
  awarded_grade: string | null;
  remarks: string | null;
  teacher_name: string | null;
  teacher_title: string | null;
  teacher_license: string | null;
  submitted_at: string | null;
}

function MarkTokenPage() {
  const { token } = Route.useParams();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [p3, setP3] = useState("");
  const [p4, setP4] = useState("");
  const [remarks, setRemarks] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [teacherTitle, setTeacherTitle] = useState("");
  const [teacherLicense, setTeacherLicense] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_submission_by_token", {
        _token: token,
      });
      if (error) {
        setError(error.message ?? "Could not load submission.");
      } else if (!data) {
        setError("Submission not found or link expired.");
      } else {
        const s = data as Submission;
        setSubmission(s);
        if (s.phase1_score !== null) setP1(String(s.phase1_score));
        if (s.phase2_score !== null) setP2(String(s.phase2_score));
        if (s.phase3_score !== null) setP3(String(s.phase3_score));
        if (s.phase4_score !== null) setP4(String(s.phase4_score));
        if (s.remarks) setRemarks(s.remarks);
        if (s.teacher_name) setTeacherName(s.teacher_name);
        if (s.teacher_title) setTeacherTitle(s.teacher_title);
        if (s.teacher_license) setTeacherLicense(s.teacher_license);
      }
      setLoading(false);
    })();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { data, error } = await supabase.rpc("submit_evaluation_by_token", {
      _token: token,
      _phase1: Number(p1) || 0,
      _phase2: Number(p2) || 0,
      _phase3: Number(p3) || 0,
      _phase4: Number(p4) || 0,
      _remarks: remarks,
      _teacher_name: teacherName,
      _teacher_title: teacherTitle || null,
      _teacher_license: teacherLicense || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message ?? "Submission failed.");
      return;
    }
    toast.success("Evaluation recorded.");
    setDone(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-xl font-bold mb-2">Marking link unavailable</h1>
        <p className="text-sm text-muted-foreground">{error ?? "Unknown error"}</p>
      </div>
    );
  }

  if (done) {
    const total = ((Number(p1) + Number(p2) + Number(p3) + Number(p4)) / 4).toFixed(2);
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500 mb-4" />
        <h1 className="text-2xl font-black mb-2">Evaluation submitted</h1>
        <p className="text-sm text-muted-foreground">
          Total competency score: <strong className="text-foreground">{total}/10</strong>
        </p>
        <p className="mt-4 text-xs text-muted-foreground">
          The student has been notified. You can close this page.
        </p>
      </div>
    );
  }

  const project = submission.project_data || submission.project_payload || {};

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6 rounded-2xl border border-primary/30 bg-primary/5 p-5">
        <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
          <Award className="h-4 w-4" /> External Marking Station
        </div>
        <h1 className="text-2xl font-black mt-1">{project?.title || "Student Project"}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Submitted by <strong>{project?.studentName || project?.student_name || "—"}</strong>
          {project?.className ? ` · ${project.className}` : ""}
          {project?.schoolName ? ` · ${project.schoolName}` : ""}
        </p>
        {submission.is_verified && (
          <p className="mt-2 text-xs text-amber-300">
            This submission was already verified. Re-submitting will overwrite the previous
            evaluation.
          </p>
        )}
      </header>

      {project?.subject && (
        <section className="mb-6 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Subject
          </h2>
          <p className="text-sm">{project.subject}</p>
          {project?.justification && (
            <>
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 mt-4">
                Justification
              </h2>
              <p className="text-sm whitespace-pre-wrap">{project.justification}</p>
            </>
          )}
        </section>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-border bg-card p-5"
      >
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Phase Scores (0–10)
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Phase 1 — Planning", val: p1, set: setP1 },
            { label: "Phase 2 — Data Collection", val: p2, set: setP2 },
            { label: "Phase 3 — Analysis", val: p3, set: setP3 },
            { label: "Phase 4 — Final Report", val: p4, set: setP4 },
          ].map(({ label, val, set }) => (
            <div key={label}>
              <label className="text-[11px] font-semibold uppercase text-muted-foreground">
                {label}
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                required
                value={val}
                onChange={(e) => set(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background p-2.5 text-sm"
              />
            </div>
          ))}
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase text-muted-foreground">
            Remarks
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={3}
            maxLength={1000}
            className="mt-1 w-full rounded-lg border border-input bg-background p-2.5 text-sm"
            placeholder="Strengths, areas to improve, NCDC competency notes…"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="text-[11px] font-semibold uppercase text-muted-foreground">
              Teacher name *
            </label>
            <input
              required
              maxLength={100}
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-background p-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase text-muted-foreground">
              Title
            </label>
            <input
              maxLength={100}
              value={teacherTitle}
              onChange={(e) => setTeacherTitle(e.target.value)}
              placeholder="e.g. Head of Sciences"
              className="mt-1 w-full rounded-lg border border-input bg-background p-2.5 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-[11px] font-semibold uppercase text-muted-foreground">
              Teaching License ID (optional)
            </label>
            <input
              maxLength={100}
              value={teacherLicense}
              onChange={(e) => setTeacherLicense(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-background p-2.5 text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-60"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Award className="h-4 w-4" />
          )}
          Submit Evaluation
        </button>

        <p className="text-[10px] text-center text-muted-foreground">
          Marking is locked to this unique link. Students cannot grade their own submissions.
        </p>
      </form>
    </div>
  );
}
