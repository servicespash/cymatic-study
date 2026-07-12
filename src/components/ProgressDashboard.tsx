import { useState, useEffect } from "react";
import { db } from "@/lib/db";
import { useGamificationStore } from "@/store/useGamificationStore";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";
import { BookOpen, Calendar, TrendingUp, Award } from "lucide-react";
import { motion } from "framer-motion";

export function ProgressDashboard() {
  const [sessions, setSessions] = useState<any[]>([]);
  const completedGaps = useGamificationStore((s) => s.completedGaps);
  const [activeTab, setActiveTab] = useState<"mastery" | "activity">("mastery");
  const [visibleSubjects, setVisibleSubjects] = useState<string[]>([
    "Math",
    "Physics",
    "Chemistry",
    "Biology",
  ]);

  useEffect(() => {
    async function loadSessions() {
      const allSessions = await db.chatSessions.toArray();
      setSessions(allSessions);
    }
    loadSessions();
  }, [completedGaps]);

  // Map keywords to subjects
  const categorizeText = (text: string): "Math" | "Physics" | "Chemistry" | "Biology" | null => {
    const t = text.toLowerCase();
    if (
      /math|algebra|quadratic|equation|calculus|geometry|fraction|divide|multiply|subtract|add|sum|sigma|theorem|numeric|number/.test(
        t,
      )
    ) {
      return "Math";
    }
    if (
      /physics|force|gravity|velocity|speed|kinematics|motion|mechanics|wave|optics|light|laser|electricity|magnet|ampere|volt|joule|newton/.test(
        t,
      )
    ) {
      return "Physics";
    }
    if (
      /chemistry|chemical|acid|base|ph|molecule|atom|bond|compound|periodic|reaction|catalyst|element|flask|beaker|alkali/.test(
        t,
      )
    ) {
      return "Chemistry";
    }
    if (
      /biology|cell|dna|organism|gene|evolution|plant|photosynthesis|mitochondria|bacteria|virus|anatomy|heart|lung|species/.test(
        t,
      )
    ) {
      return "Biology";
    }
    return null;
  };

  const stats = {
    Math: { sessions: 0, gaps: 0 },
    Physics: { sessions: 0, gaps: 0 },
    Chemistry: { sessions: 0, gaps: 0 },
    Biology: { sessions: 0, gaps: 0 },
  };

  sessions.forEach((session) => {
    let detected: "Math" | "Physics" | "Chemistry" | "Biology" | null = null;
    if (session.messages) {
      for (const msg of session.messages) {
        detected = categorizeText(msg.text);
        if (detected) break;
      }
    }
    if (detected) {
      stats[detected].sessions += 1;
    }
  });

  completedGaps.forEach((gap) => {
    const detected = categorizeText(gap);
    if (detected) {
      stats[detected].gaps += 1;
    }
  });

  const subjects = ["Math", "Physics", "Chemistry", "Biology"] as const;

  const chartData = subjects
    .filter((sub) => visibleSubjects.includes(sub))
    .map((sub) => {
      const baseProgress = stats[sub].sessions * 15 + stats[sub].gaps * 25;
      const progress = Math.min(100, Math.max(10, baseProgress)); // baseline 10% for layout elegance
      return {
        subject: sub,
        Progress: progress,
        Sessions: stats[sub].sessions,
        "Gaps Solved": stats[sub].gaps,
      };
    });

  // Calculate timeline activity data (last 7 days), filtered by selected subjects
  const timelineData = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
    const dateStr = date.toDateString();

    const count = sessions.filter((s) => {
      const sessionDate = new Date(s.timestamp).toDateString();
      if (sessionDate !== dateStr) return false;

      // Determine subject of session
      let detected: string | null = null;
      if (s.messages) {
        for (const msg of s.messages) {
          detected = categorizeText(msg.text);
          if (detected) break;
        }
      }

      // If session belongs to an untoggled subject, filter it out
      if (detected && !visibleSubjects.includes(detected)) {
        return false;
      }
      return true;
    }).length;

    return {
      day: dayName,
      Sessions: count,
    };
  });

  const totalSessions = sessions.length;
  const totalGaps = completedGaps.length;

  const subjectPillColors: Record<string, string> = {
    Math: "border-cyan-500/30 text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20",
    Physics: "border-violet-500/30 text-violet-400 bg-violet-500/10 hover:bg-violet-500/20",
    Chemistry: "border-orange-500/30 text-orange-400 bg-orange-500/10 hover:bg-orange-500/20",
    Biology: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20",
  };

  const handleToggleSubject = (sub: string) => {
    setVisibleSubjects((prev) => {
      if (prev.includes(sub)) {
        // Prevent clearing all subjects to keep chart clean
        if (prev.length === 1) return prev;
        return prev.filter((s) => s !== sub);
      }
      return [...prev, sub];
    });
  };

  return (
    <div
      id="progress-dashboard-panel"
      className="bg-zinc-900/80 backdrop-blur-md rounded-2xl p-6 border border-zinc-800/80 shadow-xl space-y-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
            <TrendingUp className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg tracking-tight">
              Learning Performance
            </h3>
            <p className="text-zinc-500 text-xs">Real-time metrics derived from study sessions</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Subject Filter Pills */}
          <div className="flex flex-wrap gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 mr-2">
            {subjects.map((sub) => {
              const active = visibleSubjects.includes(sub);
              return (
                <button
                  key={sub}
                  onClick={() => handleToggleSubject(sub)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                    active
                      ? subjectPillColors[sub]
                      : "border-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
                  aria-label={`Toggle ${sub} visibility`}
                >
                  {sub}
                </button>
              );
            })}
          </div>

          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setActiveTab("mastery")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "mastery"
                  ? "bg-zinc-800 text-white shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Subject Mastery
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "activity"
                  ? "bg-zinc-800 text-white shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Activity Timeline
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-950/40 border border-zinc-800/50 p-4 rounded-xl flex flex-col justify-between">
          <span className="text-zinc-500 text-xs font-medium">Study Sessions</span>
          <span className="text-2xl font-bold text-white mt-1">{totalSessions}</span>
        </div>
        <div className="bg-zinc-950/40 border border-zinc-800/50 p-4 rounded-xl flex flex-col justify-between">
          <span className="text-zinc-500 text-xs font-medium">Knowledge Gaps Cleared</span>
          <span className="text-2xl font-bold text-cyan-400 mt-1">{totalGaps}</span>
        </div>
        <div className="bg-zinc-950/40 border border-zinc-800/50 p-4 rounded-xl flex flex-col justify-between">
          <span className="text-zinc-500 text-xs font-medium">Primary Focus</span>
          <span className="text-md font-bold text-white mt-1 truncate">
            {
              chartData.reduce((prev, current) =>
                prev.Progress > current.Progress ? prev : current,
              ).subject
            }
          </span>
        </div>
        <div className="bg-zinc-950/40 border border-zinc-800/50 p-4 rounded-xl flex flex-col justify-between">
          <span className="text-zinc-500 text-xs font-medium">Global Rank Tier</span>
          <span className="text-sm font-bold text-yellow-400 mt-1">
            {totalGaps >= 8
              ? "Master Scholar"
              : totalGaps >= 3
                ? "Active Scholar"
                : "Novice Learner"}
          </span>
        </div>
      </div>

      <div className="h-64 w-full bg-zinc-950/20 rounded-xl p-4 border border-zinc-800/30">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === "mastery" ? (
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 10, right: 10, top: 10, bottom: 5 }}
            >
              <XAxis
                type="number"
                domain={[0, 100]}
                stroke="#71717a"
                fontSize={11}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis dataKey="subject" type="category" stroke="#71717a" fontSize={11} width={80} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  borderColor: "#27272a",
                  borderRadius: "12px",
                }}
                itemStyle={{ color: "#a1a1aa" }}
                labelStyle={{ color: "#fff" }}
              />
              <Bar dataKey="Progress" fill="#06b6d4" radius={[0, 8, 8, 0]} barSize={16} />
            </BarChart>
          ) : (
            <AreaChart data={timelineData} margin={{ left: 5, right: 5, top: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="day" stroke="#71717a" fontSize={11} />
              <YAxis stroke="#71717a" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  borderColor: "#27272a",
                  borderRadius: "12px",
                }}
                itemStyle={{ color: "#a1a1aa" }}
                labelStyle={{ color: "#fff" }}
              />
              <Area
                type="monotone"
                dataKey="Sessions"
                stroke="#a855f7"
                fillOpacity={1}
                fill="url(#colorSessions)"
                strokeWidth={2}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
