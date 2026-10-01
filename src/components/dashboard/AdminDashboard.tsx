import React, { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { TrendingUp, Users, AlertTriangle, MessageSquare, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

interface AdminDashboardProps { profile: any; realStudents?: any[]; loadingStudents?: boolean; }

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ profile }) => {
  const navigate = useNavigate();
  const { organizationId } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!organizationId) return;
      setLoading(true);
      const [performance, monitor, submissions] = await Promise.all([
        supabase.rpc("get_organization_student_performance"),
        supabase.from("tutor_monitor_events").select("id,summary,severity,created_at,user_id").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(8),
        supabase.from("project_submissions").select("id").eq("organization_id", organizationId).eq("status", "pending"),
      ]);
      setStudents(performance.data || []);
      setAlerts(monitor.data || []);
      setPending(submissions.data?.length || 0);
      setLoading(false);
    };
    void load();
  }, [organizationId]);

  const assessed = students.filter(s => Number(s.attempts) > 0);
  const average = assessed.length ? assessed.reduce((n,s) => n + Number(s.average_score || 0), 0) / assessed.length : 0;
  const support = students.filter(s => s.performance_band === "needs_support" || s.performance_band === "at_risk").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-end justify-between gap-4">
        <div><h2 className="text-2xl font-black tracking-tight text-white">Institutional Overview</h2>
          <p className="text-zinc-500 text-sm">{profile?.school_name || "Current organization"} · live database metrics</p></div>
        <Button onClick={() => navigate({ to: "/admin/dashboard" })} variant="outline" className="border-zinc-800 bg-zinc-900/50">Open administration</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ["Students", students.length, Users],
          ["Assessed", assessed.length, CheckCircle],
          ["Average", `${average.toFixed(1)}%`, TrendingUp],
          ["Needs support", support, AlertTriangle],
        ].map(([label,value,Icon]) => <Card key={String(label)} className="border-zinc-800 bg-zinc-950/60 p-4">
          <Icon className="h-4 w-4 text-cyan-400" />
          <p className="mt-3 text-[10px] uppercase font-bold tracking-wider text-zinc-500">{label}</p>
          <p className="text-2xl font-black text-white">{loading ? "…" : value}</p>
        </Card>)}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="border-zinc-800 bg-zinc-950/60 p-5">
          <div className="flex items-center justify-between mb-4"><div><h3 className="font-bold text-white">Performance bands</h3><p className="text-xs text-zinc-500">Assessment evidence only.</p></div><TrendingUp className="h-4 w-4 text-cyan-400" /></div>
          <div className="space-y-2">
            {["strong_progress","on_track","needs_support","at_risk","insufficient_data"].map(b => {
              const n=students.filter(s=>s.performance_band===b).length;
              return <div key={b} className="flex justify-between rounded-lg bg-zinc-900/60 px-3 py-2 text-xs"><span className="text-zinc-400">{b.replaceAll("_"," ")}</span><span className="font-bold text-white">{n}</span></div>;
            })}
          </div>
        </Card>

        <Card className="border-zinc-800 bg-zinc-950/60 p-5">
          <div className="flex items-center justify-between mb-4"><div><h3 className="font-bold text-white">Tutor monitor</h3><p className="text-xs text-zinc-500">{alerts.length} recent organization events · {pending} submissions awaiting marking</p></div><MessageSquare className="h-4 w-4 text-cyan-400" /></div>
          {alerts.length === 0 ? <p className="text-sm text-zinc-600 py-6">No recent monitor events.</p> :
            <div className="space-y-2">{alerts.slice(0,5).map(a => <div key={a.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3"><div className="flex justify-between gap-3"><span className="text-[10px] uppercase font-bold text-zinc-500">{a.severity}</span><span className="text-[10px] text-zinc-600">{new Date(a.created_at).toLocaleString()}</span></div><p className="mt-1 text-xs text-zinc-300">{a.summary}</p></div>)}</div>}
        </Card>
      </div>
    </div>
  );
};
