import { useMemo } from "react";
import { TrendingUp, Users, Award } from "lucide-react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";

type StudentScore = {
  id: string;
  name: string;
  score: number; // 0-10 scale
};

type PerformanceCurveProps = {
  students: StudentScore[];
  highlightStudentId?: string;
  title?: string;
};

function getGradeFromScore(score: number): { letter: string; color: string; label: string } {
  if (score >= 8.5) return { letter: "A", color: "#10b981", label: "Exceptional" };
  if (score >= 7.0) return { letter: "B", color: "#06b6d4", label: "Outstanding" };
  if (score >= 5.0) return { letter: "C", color: "#f59e0b", label: "Satisfactory" };
  if (score >= 3.0) return { letter: "D", color: "#f97316", label: "Basic" };
  return { letter: "E", color: "#ef4444", label: "Elementary" };
}

export function PerformanceCurve({
  students,
  highlightStudentId,
  title = "Class Performance Curve",
}: PerformanceCurveProps) {
  // Sort students by score descending for ranking, but we can plot them by index
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => b.score - a.score);
  }, [students]);

  // Data for Recharts - mapping to index-based scatter points
  const chartData = useMemo(() => {
    return sortedStudents.map((s, idx) => ({
      index: idx + 1,
      score: s.score,
      name: s.name,
      id: s.id,
      grade: getGradeFromScore(s.score),
    }));
  }, [sortedStudents]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (students.length === 0) return { mean: 0, median: 0, highest: 0, lowest: 0 };

    const scores = students.map((s) => s.score);
    const sorted = [...scores].sort((a, b) => a - b);
    const sum = scores.reduce((a, b) => a + b, 0);

    return {
      mean: +(sum / scores.length).toFixed(1),
      median:
        sorted.length % 2 === 0
          ? +((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2).toFixed(1)
          : +sorted[Math.floor(sorted.length / 2)].toFixed(1),
      highest: Math.max(...scores),
      lowest: Math.min(...scores),
    };
  }, [students]);

  // Grade distribution
  const distribution = useMemo(() => {
    const dist = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    students.forEach((s) => {
      const grade = getGradeFromScore(s.score);
      dist[grade.letter as keyof typeof dist]++;
    });
    return dist;
  }, [students]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border border-border bg-card p-2 shadow-xl">
          <p className="text-xs font-bold text-foreground">{data.name}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Rank #{data.index} · Score: {data.score}/10
          </p>
          <div
            className="mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold text-white"
            style={{ backgroundColor: data.grade.color }}
          >
            Grade {data.grade.letter}
          </div>
        </div>
      );
    }
    return null;
  };

  if (students.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 font-bold">No Student Data</h3>
        <p className="text-sm text-muted-foreground">
          Performance curve will appear once students submit projects
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 overflow-hidden">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold">{title}</h3>
            <p className="text-xs text-muted-foreground">{students.length} students evaluated</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5">
          <Award className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold text-primary">Class Avg: {stats.mean}/10</span>
        </div>
      </div>

      {/* Recharts Scatter Curve */}
      <div className="mb-6 h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: -25 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis
              type="number"
              dataKey="index"
              name="Student Rank"
              hide={false}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: "#666" }}
              domain={[1, students.length]}
            />
            <YAxis
              type="number"
              dataKey="score"
              name="Score"
              domain={[0, 10]}
              ticks={[0, 2, 4, 6, 8, 10]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: "#666" }}
            />
            <ZAxis type="number" range={[50, 400]} />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.1)" }}
            />

            <ReferenceLine
              y={stats.mean}
              stroke="#3b82f6"
              strokeDasharray="3 3"
              label={{ position: "right", value: "Avg", fill: "#3b82f6", fontSize: 10 }}
            />

            <Scatter
              name="Students"
              data={chartData}
              line={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }}
              lineType="fitting"
              shape="circle"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.grade.color}
                  stroke={entry.id === highlightStudentId ? "#fff" : "none"}
                  strokeWidth={2}
                  className={entry.id === highlightStudentId ? "animate-pulse" : ""}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mb-6 flex items-center justify-center gap-4 text-[10px]">
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-[#10b981]" /> <span>A (Exceptional)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-[#06b6d4]" /> <span>B (Outstanding)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-[#f59e0b]" /> <span>C (Satisfactory)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-[#ef4444]" /> <span>E (Elementary)</span>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="rounded-lg bg-muted/50 p-2 text-center">
          <p className="text-lg font-black">{stats.mean}</p>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Mean</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-2 text-center">
          <p className="text-lg font-black">{stats.median}</p>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Median</p>
        </div>
        <div className="rounded-lg bg-emerald-500/10 p-2 text-center">
          <p className="text-lg font-black text-emerald-600">{stats.highest}</p>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Highest</p>
        </div>
        <div className="rounded-lg bg-rose-500/10 p-2 text-center">
          <p className="text-lg font-black text-rose-600">{stats.lowest}</p>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Lowest</p>
        </div>
      </div>

      {/* Grade Distribution Bar */}
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Grade Distribution
        </p>
        <div className="flex h-4 w-full overflow-hidden rounded-full bg-muted">
          {(["A", "B", "C", "D", "E"] as const).map((letter) => {
            const count = distribution[letter];
            const percent = students.length > 0 ? (count / students.length) * 100 : 0;
            const colors: Record<string, string> = {
              A: "bg-emerald-500",
              B: "bg-cyan-500",
              C: "bg-amber-500",
              D: "bg-orange-500",
              E: "bg-rose-500",
            };
            if (percent === 0) return null;
            return (
              <div
                key={letter}
                className={colors[letter]}
                style={{ width: `${percent}%` }}
                title={`${letter}: ${count} students`}
              />
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">
          <span>A ({distribution.A})</span>
          <span>B ({distribution.B})</span>
          <span>C ({distribution.C})</span>
          <span>D ({distribution.D})</span>
          <span>E ({distribution.E})</span>
        </div>
      </div>

      {/* Highlighted Student (if any) */}
      {highlightStudentId && (
        <div className="mt-4 rounded-lg border border-primary/30 bg-primary/10 p-3">
          {(() => {
            const student = students.find((s) => s.id === highlightStudentId);
            if (!student) return null;
            const rank = sortedStudents.findIndex((s) => s.id === highlightStudentId) + 1;
            const grade = getGradeFromScore(student.score);

            return (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Current Student</p>
                  <p className="font-bold">{student.name}</p>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <p className="text-2xl font-black" style={{ color: grade.color }}>
                      {student.score}/10
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Rank {rank} of {students.length}
                    </p>
                  </div>
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-white font-black shadow-lg"
                    style={{ backgroundColor: grade.color, boxShadow: `0 0 15px ${grade.color}44` }}
                  >
                    {grade.letter}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
