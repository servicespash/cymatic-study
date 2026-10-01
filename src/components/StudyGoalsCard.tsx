import { useEffect, useState } from "react";
import { Target, Calendar, CheckCircle2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

type Goal = {
  id: string;
  goal_scope: "daily" | "weekly" | "term";
  period_start: string;
  period_end: string;
  target_points: number;
  achieved_points: number;
  target_description: string | null;
};

const scopes: Goal["goal_scope"][] = ["daily", "weekly", "term"];

export function StudyGoalsCard() {
  const { user, organizationId } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [points, setPoints] = useState<Record<string, number>>({});
  const [target, setTarget] = useState(25);
  const [description, setDescription] = useState("");
  const [scope, setScope] = useState<Goal["goal_scope"]>("daily");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user?.id) return;
    const { data: goalRows } = await supabase
      .from("learning_goals")
      .select("*")
      .eq("user_id", user.id)
      .order("period_start", { ascending: false });
    setGoals((goalRows || []) as Goal[]);

    const { data: pointRows } = await supabase
      .from("user_points")
      .select("points,created_at")
      .eq("user_id", user.id);
    const now = new Date();
    const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const day = (pointRows || []).filter((p: any) => new Date(p.created_at).getTime() >= startDay)
      .reduce((s: number, p: any) => s + Number(p.points || 0), 0);
    const weekStart = new Date(startDay); weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
    const week = (pointRows || []).filter((p: any) => new Date(p.created_at).getTime() >= weekStart.getTime())
      .reduce((s: number, p: any) => s + Number(p.points || 0), 0);
    const term = (pointRows || []).reduce((s: number, p: any) => s + Number(p.points || 0), 0);
    setPoints({ daily: day, weekly: week, term });
  };

  useEffect(() => { void load(); }, [user?.id]);

  const saveGoal = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const start = new Date(); start.setHours(0,0,0,0);
      const end = new Date(start);
      if (scope === "daily") end.setDate(end.getDate());
      if (scope === "weekly") end.setDate(end.getDate() + 6);
      if (scope === "term") end.setMonth(end.getMonth() + 3);
      await supabase.from("learning_goals").upsert({
        user_id: user.id,
        organization_id: organizationId,
        goal_scope: scope,
        period_start: start.toISOString().slice(0,10),
        period_end: end.toISOString().slice(0,10),
        target_points: Math.max(0, target),
        achieved_points: points[scope] || 0,
        target_description: description.trim() || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,goal_scope,period_start" });
      setDescription("");
      await load();
    } finally { setSaving(false); }
  };

  return (
    <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2"><Target className="h-5 w-5 text-cyan-400" /></div>
        <div><h3 className="font-bold text-white">Study goals</h3><p className="text-xs text-zinc-500">Daily, weekly and term points from recorded activity.</p></div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {scopes.map((s) => {
          const goal = goals.find(g => g.goal_scope === s);
          const earned = points[s] || goal?.achieved_points || 0;
          const pct = goal ? Math.min(100, Math.round((earned / Math.max(1, goal.target_points)) * 100)) : 0;
          return <div key={s} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
            <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">{s}</p>
            <p className="mt-1 text-lg font-black text-white">{earned}{goal ? <span className="text-xs text-zinc-500"> / {goal.target_points}</span> : null}</p>
            {goal && <div className="mt-2 h-1.5 rounded-full bg-zinc-800 overflow-hidden"><div className="h-full bg-cyan-500" style={{width: pct + "%"}} /></div>}
          </div>;
        })}
      </div>

      <div className="grid gap-2 sm:grid-cols-[auto_auto_1fr_auto]">
        <select value={scope} onChange={e => setScope(e.target.value as Goal["goal_scope"])} className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white">
          {scopes.map(s => <option key={s} value={s}>{s} goal</option>)}
        </select>
        <input type="number" min={0} value={target} onChange={e => setTarget(Number(e.target.value))} className="w-24 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white" />
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Goal focus" className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white" />
        <button disabled={saving} onClick={saveGoal} className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-3 py-2 text-xs font-bold text-black disabled:opacity-50"><Save className="h-3.5 w-3.5" />Save</button>
      </div>

      <div className="flex items-center gap-2 text-[10px] text-zinc-500"><Calendar className="h-3.5 w-3.5" /> Progress is calculated from persisted points, not local completion counters.</div>
    </section>
  );
}
