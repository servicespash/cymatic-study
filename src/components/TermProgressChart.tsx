import { useGamificationStore } from "@/store/useGamificationStore";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { TrendingUp, Target, Calendar } from "lucide-react";

export function TermProgressChart() {
  const { completedTasks } = useGamificationStore();
  const completedCount = completedTasks.length;

  // Calculate term points
  const sumScores = completedTasks.reduce((acc, t) => acc + t.scorePct, 0);
  const userScore = parseFloat((sumScores / 90).toFixed(2));

  // Generate data points for chart
  // We want to show a 90-day trajectory. To avoid a massive crowded graph, we sample or plot key intervals:
  // e.g. Day 0, Day 10, Day 20, Day 30, Day 40, Day 50, Day 60, Day 70, Day 80, Day 90
  const intervals = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90];

  const chartData = intervals.map((day) => {
    // Ideal score at Day X is (100 / 90) * day
    const ideal = parseFloat(((100 / 90) * day).toFixed(1));

    // User actual score at Day X.
    // We can simulate an accumulated curve that reaches the user's current termScore on the current estimated Day (completedCount)
    let actual: number | null = null;

    if (day <= completedCount) {
      // If we are before or at the current day progress
      if (day === 0) {
        actual = 0;
      } else {
        // Calculate user score up to that day
        const tasksUpToDay = completedTasks.slice(0, day);
        const scoresSum = tasksUpToDay.reduce((acc, t) => acc + t.scorePct, 0);
        actual = parseFloat((scoresSum / 90).toFixed(2));
      }
    } else if (day === completedCount + 10 && completedCount > 0) {
      // Small projected dot for upcoming days to show direction
      actual = userScore;
    }

    return {
      name: `Day ${day}`,
      "Ideal Trajectory": ideal,
      "Your Score": actual !== null ? actual : undefined,
    };
  });

  return (
    <div className="bg-zinc-900/80 backdrop-blur-md rounded-2xl p-6 border border-zinc-800/80 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
            <Target className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg tracking-tight">
              90-Day Term Goal Path
            </h3>
            <p className="text-zinc-500 text-xs">
              Your competency score vs. the ideal 100-point NCDC trajectory
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-950 rounded-xl border border-zinc-800">
          <Calendar className="h-3.5 w-3.5 text-zinc-500" />
          <span className="text-xs font-medium text-zinc-400">Day {completedCount} of 90</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 bg-zinc-950/30 p-4 rounded-xl border border-zinc-800/40">
        <div className="text-left">
          <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
            Current Score
          </span>
          <p className="text-xl font-extrabold text-indigo-400 mt-0.5">
            {userScore} <span className="text-xs font-normal text-zinc-500">/ 100</span>
          </p>
        </div>
        <div className="text-left">
          <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
            Ideal Today
          </span>
          <p className="text-xl font-extrabold text-zinc-300 mt-0.5">
            {parseFloat(((100 / 90) * completedCount).toFixed(2))}{" "}
            <span className="text-xs font-normal text-zinc-500">/ 100</span>
          </p>
        </div>
        <div className="text-left">
          <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
            Goal Pace
          </span>
          <p
            className={`text-xl font-extrabold mt-0.5 ${userScore >= (100 / 90) * completedCount ? "text-emerald-400" : "text-amber-400"}`}
          >
            {userScore >= (100 / 90) * completedCount ? "ON TRACK" : "BEHIND PACE"}
          </p>
        </div>
      </div>

      <div className="h-56 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIdeal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#71717a" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#71717a" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.4} />
            <XAxis dataKey="name" stroke="#52525b" fontSize={10} />
            <YAxis stroke="#52525b" fontSize={10} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                borderColor: "#27272a",
                borderRadius: "12px",
              }}
              itemStyle={{ color: "#a1a1aa" }}
              labelStyle={{ color: "#fff" }}
            />
            <Legend wrapperStyle={{ fontSize: "11px", color: "#a1a1aa" }} />
            <Area
              type="monotone"
              dataKey="Ideal Trajectory"
              stroke="#52525b"
              fillOpacity={1}
              fill="url(#colorIdeal)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
            <Area
              type="monotone"
              dataKey="Your Score"
              stroke="#6366f1"
              fillOpacity={1}
              fill="url(#colorActual)"
              strokeWidth={3}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
