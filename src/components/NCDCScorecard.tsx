import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useCurriculum } from "@/lib/curriculum-context";

interface NCDCScorecardProps {
  scores: {
    phase1: number;
    phase2: number;
    phase3: number;
    phase4: number;
  };
}

export function NCDCScorecard({ scores }: NCDCScorecardProps) {
  const { mode } = useCurriculum();

  const total = scores.phase1 + scores.phase2 + scores.phase3 + scores.phase4;
  const percentage = (total / 10) * 10; // It's out of 10, so weight is 10%

  const getDescriptor = (val: number) => {
    if (val >= 8.5)
      return {
        letter: "A",
        label: "Exceptional",
        tone: "text-emerald-500",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
      };
    if (val >= 7.0)
      return {
        letter: "B",
        label: "Outstanding",
        tone: "text-cyan-500",
        bg: "bg-cyan-500/10",
        border: "border-cyan-500/20",
      };
    if (val >= 5.0)
      return {
        letter: "C",
        label: "Satisfactory",
        tone: "text-amber-500",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
      };
    if (val >= 3.0)
      return {
        letter: "D",
        label: "Basic",
        tone: "text-orange-500",
        bg: "bg-orange-500/10",
        border: "border-orange-500/20",
      };
    return {
      letter: "E",
      label: "Elementary",
      tone: "text-rose-500",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
    };
  };

  const descriptor = getDescriptor(total);

  if (mode !== "lower-secondary") return null;

  return (
    <div className={`rounded-3xl border p-5 ${descriptor.bg} ${descriptor.border} transition-all`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`h-16 w-16 rounded-full flex items-center justify-center text-2xl font-black shadow-inner bg-background ${descriptor.tone}`}
          >
            {descriptor.letter}
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              NCDC Scorecard
            </p>
            <p className="text-4xl font-black mt-1">
              {total.toFixed(1)}
              <span className="text-lg text-muted-foreground"> / 10.0</span>
            </p>
            <p className={`text-sm font-bold mt-1 ${descriptor.tone}`}>{descriptor.label}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">
            NCDC Weight
          </p>
          <p className="text-2xl font-black">{total.toFixed(1)}%</p>
          <p className="text-[10px] text-muted-foreground">Continuous Assessment</p>
        </div>
      </div>
      <div className="mt-4 space-y-1">
        <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
          <span>Competency Progress</span>
          <span>{Math.round(total * 10)}%</span>
        </div>
        <Progress value={total * 10} className="h-1.5" />
      </div>
    </div>
  );
}
