import { useEffect, useState } from "react";
import { useSubjectProgress } from "@/hooks/useSubjectProgress";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { BookOpen, Trophy, Activity, Award, Sparkles, RefreshCw, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export interface RecentActivity {
  id: string;
  type: "quiz" | "lesson" | "chat" | "project";
  description: string;
  timestamp: string;
}

export function StudentActivityDashboard() {
  const { progress, loading } = useSubjectProgress();
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  const fetchActivities = async () => {
    performance.mark("fetchActivities-start");
    setLoadingActivities(true);
    try {
      const { data, error } = await supabase
        .from("user_activity_logs")
        .select("id, type, description, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      setActivities(
        (data || []).map((a) => ({
          id: a.id,
          type: a.type as any,
          description: a.description,
          timestamp: a.created_at,
        })),
      );
    } catch (e) {
      console.error(e);
      toast.error("Failed to load activity logs.");
    } finally {
      setLoadingActivities(false);
      performance.mark("fetchActivities-end");
      performance.measure("fetchActivities", "fetchActivities-start", "fetchActivities-end");
    }
  };

  useEffect(() => {
    performance.mark("dashboard-render-start");
    fetchActivities();
  }, [progress]);

  useEffect(() => {
    performance.mark("dashboard-render-end");
    performance.measure("dashboard-render", "dashboard-render-start", "dashboard-render-end");
  });

  // Color mappings for subjects
  const subjectColors: Record<string, string> = {
    Math: "#6366f1", // indigo
    Physics: "#06b6d4", // cyan
    Chemistry: "#10b981", // emerald
    Biology: "#f59e0b", // amber
  };

  const getSubjectColor = (subject: string) => {
    return subjectColors[subject] || "#a1a1aa";
  };

  const chartData = progress.map((p) => ({
    name: p.subject,
    percentage: p.completedPercentage,
    color: getSubjectColor(p.subject),
  }));

  return (
    <div className="space-y-6">
      {/* Overview stats cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {progress.map((sub, index) => {
          const color = getSubjectColor(sub.subject);
          return (
            <motion.div
              key={sub.subject}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="p-5 rounded-3xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-xl relative overflow-hidden group shadow-md"
            >
              {/* Top Accent bar */}
              <div
                className="absolute top-0 inset-x-0 h-1 transition-all group-hover:h-1.5"
                style={{ backgroundColor: color }}
              />
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                    Syllabus
                  </span>
                  <h4 className="text-base font-black text-white mt-0.5">{sub.subject}</h4>
                </div>
                <span
                  className="text-xs font-mono font-bold px-2.5 py-1 rounded-full border bg-zinc-950/60"
                  style={{ color: color, borderColor: `${color}30` }}
                >
                  {sub.completedPercentage}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-6 space-y-2">
                <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${sub.completedPercentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-zinc-500 font-medium">
                    Last read:{" "}
                    {sub.lastInteracted
                      ? new Date(sub.lastInteracted).toLocaleDateString()
                      : "Never"}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Charts & Activity Logs split panel */}
      <div className="grid gap-6 md:grid-cols-5">
        {/* Recharts progress visualizer */}
        <div className="md:col-span-3 rounded-3xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-xl p-5 flex flex-col justify-between shadow-xl min-h-[340px]">
          <div>
            <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-wider">
              <Award className="w-4 h-4" /> Curriculum Mastery Map
            </span>
            <h3 className="text-lg font-bold text-white mt-1">Subject Achievement Metrics</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Completion statistics derived from syllabus interaction, quizzes, and project works.
            </p>
          </div>

          <div className="flex-1 min-h-[220px] mt-4 flex items-center justify-center">
            {loading ? (
              <span className="text-xs text-zinc-500">Loading progress...</span>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#71717a"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#71717a"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    cursor={{ fill: "#27272a30" }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 shadow-lg text-xs">
                            <span className="font-bold text-white block">{data.name}</span>
                            <span className="text-zinc-400 mt-0.5 block flex items-center gap-1.5">
                              Syllabus Mastery:{" "}
                              <strong style={{ color: data.color }}>{data.percentage}%</strong>
                            </span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="percentage" radius={[8, 8, 0, 0]} barSize={32}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Activities list */}
        <div className="md:col-span-2 rounded-3xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-xl p-5 flex flex-col justify-between shadow-xl min-h-[340px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-500 uppercase tracking-wider">
                <Activity className="w-4 h-4" /> Offline Activity Stream
              </span>
              <button
                onClick={fetchActivities}
                className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                title="Refresh Logs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">Recent Activity Log</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Chronological log of your local interactions, sync items, and notes exports.
            </p>
          </div>

          <div className="flex-1 mt-4 overflow-y-auto max-h-[200px] pr-1 space-y-2.5">
            {loadingActivities ? (
              <div className="text-center py-6 text-xs text-zinc-600">Loading activities...</div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8 text-xs text-zinc-600 font-mono">
                No recent activities logged.
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {activities.map((act) => (
                  <motion.div
                    key={act.id || act.timestamp}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-3 bg-zinc-950/40 rounded-2xl border border-zinc-800/30 flex gap-2.5 items-start text-xs group"
                  >
                    <div className="mt-0.5">
                      {act.type === "quiz" && (
                        <div className="w-5 h-5 bg-indigo-500/10 text-indigo-400 rounded-lg flex items-center justify-center border border-indigo-500/20">
                          <Trophy className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {act.type === "lesson" && (
                        <div className="w-5 h-5 bg-emerald-500/10 text-emerald-400 rounded-lg flex items-center justify-center border border-emerald-500/20">
                          <BookOpen className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {act.type === "chat" && (
                        <div className="w-5 h-5 bg-cyan-500/10 text-cyan-400 rounded-lg flex items-center justify-center border border-cyan-500/20">
                          <HelpCircle className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {act.type === "project" && (
                        <div className="w-5 h-5 bg-amber-500/10 text-amber-400 rounded-lg flex items-center justify-center border border-amber-500/20">
                          <Award className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-zinc-200">{act.description}</p>
                      <span className="text-[9px] font-mono text-zinc-600 mt-1 block">
                        {new Date(act.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
