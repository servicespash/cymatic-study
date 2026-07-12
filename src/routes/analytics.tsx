import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { LineChart as LineIcon, Trophy, Target, TrendingUp } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics | Latty's Cymatic Hub" },
      {
        name: "description",
        content: "Performance metrics and student insights. Designed by Isabirye Latif.",
      },
    ],
  }),
  component: AnalyticsPage,
});

type Subject = { id: string; name: string; ca: number; paper: number };

const DEFAULT_SUBJECTS: Subject[] = [
  { id: "math", name: "Mathematics", ca: 14, paper: 60 },
  { id: "phy", name: "Physics", ca: 12, paper: 55 },
  { id: "chem", name: "Chemistry", ca: 13, paper: 58 },
  { id: "bio", name: "Biology", ca: 15, paper: 62 },
];

function letterFor(total: number) {
  if (total >= 85) return { letter: "A", label: "Exceptional Competency", tone: "bg-emerald-500" };
  if (total >= 70) return { letter: "B", label: "Outstanding", tone: "bg-cyan-500" };
  if (total >= 50) return { letter: "C", label: "Satisfactory", tone: "bg-amber-500" };
  if (total >= 30) return { letter: "D", label: "Basic", tone: "bg-orange-500" };
  return { letter: "E", label: "Elementary", tone: "bg-rose-500" };
}

function AnalyticsPage() {
  const [subjects, setSubjects] = useState<Subject[]>(DEFAULT_SUBJECTS);

  const summary = useMemo(() => {
    return subjects.map((s) => {
      const ca = Math.max(0, Math.min(20, s.ca));
      const paper = Math.max(0, Math.min(80, s.paper));
      const total = ca + paper;
      return { ...s, ca, paper, total, grade: letterFor(total) };
    });
  }, [subjects]);

  const avg = summary.length ? summary.reduce((a, s) => a + s.total, 0) / summary.length : 0;
  const avgGrade = letterFor(avg);

  const update = (id: string, patch: Partial<Subject>) =>
    setSubjects((arr) => arr.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
            <LineIcon className="h-5 w-5" />
          </div>
          <h1 className="text-3xl font-black">Performance Analytics</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Simulate the official NCDC 20/80 formula: Continuous Assessment (out of 20) + UNEB Paper
          (out of 80) = Competency Grade.
        </p>
      </header>

      {/* Aggregate hero */}
      <section className="mb-8 rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-accent/10 to-transparent p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase font-bold text-muted-foreground tracking-widest">
              Predicted Average
            </p>
            <p className="text-5xl font-black mt-1">
              {avg.toFixed(1)}
              <span className="text-xl text-muted-foreground">/100</span>
            </p>
            <Badge className={`mt-2 text-white ${avgGrade.tone}`}>
              <Trophy className="h-3 w-3 mr-1" /> {avgGrade.letter} — {avgGrade.label}
            </Badge>
          </div>
          <div className="text-right text-xs text-muted-foreground max-w-[200px]">
            Drag the sliders below to see how raising your continuous assessment or final paper
            marks pushes you toward Excellence.
          </div>
        </div>
      </section>

      {/* Subjects */}
      <div className="space-y-4 mb-10">
        {summary.map((s) => {
          const toA = Math.max(0, 85 - s.total);
          return (
            <div key={s.id} className="rounded-3xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h3 className="font-bold text-lg">{s.name}</h3>
                <div className="flex items-center gap-2">
                  <Badge className={`text-white ${s.grade.tone}`}>
                    {s.grade.letter} — {s.grade.label}
                  </Badge>
                  <span className="text-2xl font-black tabular-nums">{s.total}</span>
                  <span className="text-xs text-muted-foreground">/100</span>
                </div>
              </div>

              {/* Stacked 20/80 bar */}
              <div className="flex h-6 rounded-full overflow-hidden border border-border bg-muted mb-4">
                <div className="bg-primary" style={{ width: `${(s.ca / 100) * 100}%` }} />
                <div className="bg-accent" style={{ width: `${(s.paper / 100) * 100}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mb-4">
                <span>20% CA</span>
                <span>80% UNEB Paper</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <SliderField
                  label={`Continuous Assessment (${s.ca}/20)`}
                  value={s.ca}
                  max={20}
                  onChange={(v) => update(s.id, { ca: v })}
                />
                <SliderField
                  label={`UNEB Final Paper (${s.paper}/80)`}
                  value={s.paper}
                  max={80}
                  onChange={(v) => update(s.id, { paper: v })}
                />
              </div>

              {s.grade.letter !== "A" && (
                <p className="mt-3 text-xs flex items-center gap-1.5 text-muted-foreground">
                  <Target className="h-3.5 w-3.5 text-primary" />
                  Need <strong className="text-foreground">+{toA} marks</strong> to reach
                  Exceptional (A).
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Formula explainer */}
      <section className="rounded-3xl border border-border bg-card p-6">
        <h2 className="font-bold flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4 text-primary" /> The 20/80 Formula
        </h2>
        <pre className="text-xs bg-muted/40 p-3 rounded-xl overflow-x-auto">
          {`Final Score = Continuous Assessment (max 20) + UNEB Paper (max 80)
A = 85–100  ·  B = 70–84  ·  C = 50–69  ·  D = 30–49  ·  E = below 30`}
        </pre>
      </section>
    </div>
  );
}

function SliderField({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <Label className="text-xs font-semibold mb-2 block">{label}</Label>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-primary"
        />
        <Input
          type="number"
          min={0}
          max={max}
          value={value}
          onChange={(e) => onChange(Math.max(0, Math.min(max, Number(e.target.value) || 0)))}
          className="w-16 h-8 text-sm"
        />
      </div>
    </div>
  );
}
