import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  Users,
  TrendingUp,
  AlertOctagon,
  Settings,
  UserPlus,
  Database,
  BarChart3,
  LayoutDashboard,
  ShieldAlert,
  GraduationCap,
  Calendar,
  Clock,
  ArrowUpRight,
  MoreVertical,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard | Latty's Cymatic Study" },
      {
        name: "description",
        content: "Admin management console. Designed by Isabirye Latif.",
      },
    ],
  }),
  component: AdminDashboard,
});

import { Organization, Stats, VelocityData, TeacherBottleneck } from "@/types/admin";
// ... existing imports ...

function AdminDashboard() {
  const { user } = useAuth();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    s1: 0,
    s2: 0,
    s3: 0,
    s4: 0,
    s5: 0,
    s6: 0,
    pendingSubmissions: 0,
    activeTeachers: 0,
  });
  const [velocityData, setVelocityData] = useState<VelocityData[]>([]);
  const [teacherBottlenecks, setTeacherBottlenecks] = useState<TeacherBottleneck[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "analytics" | "faculty" | "settings">(
    "overview",
  );

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (!profile || (profile.role !== "org_admin" && profile.role !== "admin")) {
        setAuthorized(false);
        window.location.replace("/admin/login");
        return;
      }
      setAuthorized(true);
      fetchOrgData();
    })();
  }, [user]);

  if (authorized === null)
    return <div className="p-8 text-sm text-muted-foreground">Verifying access…</div>;
  if (authorized === false) return null;

  const fetchOrgData = async () => {
    if (!user?.id) return;
    // 1. Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id, organizations(*)")
      .eq("user_id", user.id)
      .single();

    if (profile?.organizations && profile.org_id) {
      setOrg(profile.organizations);
      loadDashboardStats(profile.org_id);
    }
  };

  const loadDashboardStats = async (orgId: string) => {
    // 1. Fetch student counts by level
    const { data: students } = await supabase.from("profiles").select("level").eq("org_id", orgId);

    const counts = { S1: 0, S2: 0, S3: 0, S4: 0, S5: 0, S6: 0 };
    students?.forEach((s) => {
      if (s.level && counts[s.level as keyof typeof counts] !== undefined) {
        counts[s.level as keyof typeof counts]++;
      }
    });

    // 2. Fetch pending submissions
    const { count: pendingCount } = await supabase
      .from("project_submissions")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("status", "pending");

    // 3. Fetch active teachers (users with teacher role in this org)
    // For simplicity, counting distinct teacher_ids in submissions
    const { data: teachersInSubs } = await supabase
      .from("project_submissions")
      .select("teacher_id, teacher_name")
      .eq("org_id", orgId)
      .not("teacher_id", "is", null);

    const uniqueTeachers = new Set(teachersInSubs?.map((t) => t.teacher_id));

    setStats({
      totalStudents: students?.length || 0,
      s1: counts.S1,
      s2: counts.S2,
      s3: counts.S3,
      s4: counts.S4,
      s5: counts.S5,
      s6: counts.S6,
      pendingSubmissions: pendingCount || 0,
      activeTeachers: uniqueTeachers.size,
    });

    // 4. Mock velocity data (In real app, query by created_at)
    setVelocityData([
      { day: "Mon", submissions: 4 },
      { day: "Tue", submissions: 12 },
      { day: "Wed", submissions: 8 },
      { day: "Thu", submissions: 25 },
      { day: "Fri", submissions: 18 },
      { day: "Sat", submissions: 5 },
      { day: "Sun", submissions: 2 },
    ]);

    // 5. Bottleneck analytics
    // Aggregate pending vs verified per teacher
    const { data: bottlenecks } = await supabase
      .from("project_submissions")
      .select("teacher_name, status")
      .eq("org_id", orgId);

    const teacherMap: Record<string, { pending: number; verified: number }> = {};
    bottlenecks?.forEach((b) => {
      if (!b.teacher_name) return;
      if (!teacherMap[b.teacher_name]) teacherMap[b.teacher_name] = { pending: 0, verified: 0 };
      if (b.status === "pending") teacherMap[b.teacher_name].pending++;
      if (b.status === "verified") teacherMap[b.teacher_name].verified++;
    });

    setTeacherBottlenecks(
      Object.entries(teacherMap).map(([name, data]) => ({
        name,
        ...data,
        ratio: Math.round((data.verified / (data.pending + data.verified || 1)) * 100),
      })),
    );
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-600/30">
      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 border-r border-white/5 bg-black/50 backdrop-blur-3xl z-50 hidden lg:flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-black">
              C
            </div>
            <span className="font-black uppercase tracking-widest text-sm">Cymatic Command</span>
          </div>

          <nav className="space-y-1">
            <NavButton
              icon={LayoutDashboard}
              label="Overview"
              active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
            />
            <NavButton
              icon={BarChart3}
              label="Macro-Analytics"
              active={activeTab === "analytics"}
              onClick={() => setActiveTab("analytics")}
            />
            <NavButton
              icon={Users}
              label="Faculty Hub"
              active={activeTab === "faculty"}
              onClick={() => setActiveTab("faculty")}
            />
            <NavButton
              icon={Settings}
              label="Campus Controls"
              active={activeTab === "settings"}
              onClick={() => setActiveTab("settings")}
            />
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-white/5">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5">
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs uppercase">
              SA
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold truncate">School Admin</p>
              <p className="text-[10px] text-zinc-500 truncate">{org?.name || "Loading..."}</p>
            </div>
            <Lock className="h-3 w-3 text-zinc-600" />
          </div>
        </div>
      </aside>

      {/* Main Command Center */}
      <main className="lg:ml-64 p-8">
        <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight uppercase">Dashboard Overview</h1>
            <p className="text-zinc-500 text-sm">Institutional command node for {org?.name}.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-blue-600/30 bg-blue-600/5 text-blue-400 px-3 py-1"
            >
              <ShieldAlert className="h-3 w-3 mr-2" />
              Secure Org Environment
            </Badge>
            <Button size="sm" variant="outline" className="border-white/10 bg-white/5">
              <Calendar className="h-4 w-4 mr-2" />
              May 2026 Cycle
            </Button>
          </div>
        </header>

        {activeTab === "overview" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Macro Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={Users}
                label="Total Students"
                value={stats.totalStudents}
                trend="+12% from last cycle"
              />
              <StatCard
                icon={TrendingUp}
                label="Project Velocity"
                value={`${velocityData.reduce((a, b) => a + b.submissions, 0)}/wk`}
                trend="Optimal Throughput"
                color="text-emerald-500"
              />
              <StatCard
                icon={AlertOctagon}
                label="Teacher Bottlenecks"
                value={stats.pendingSubmissions}
                trend="Pending Verification"
                color="text-amber-500"
              />
              <StatCard
                icon={CheckCircle2}
                label="NCDC Compliance"
                value="94%"
                trend="Targeting 100%"
                color="text-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Velocity Chart */}
              <Card className="lg:col-span-2 border-white/5 bg-black/40 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-lg font-black uppercase">
                    Project Velocity Curve
                  </CardTitle>
                  <CardDescription>
                    Real-time competency tracking across the institutional network.
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={velocityData}>
                      <defs>
                        <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                      <XAxis
                        dataKey="day"
                        stroke="#ffffff40"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#000",
                          border: "1px solid #ffffff10",
                          borderRadius: "12px",
                        }}
                        itemStyle={{ color: "#fff" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="submissions"
                        stroke="#2563eb"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorSub)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Stream Distribution */}
              <Card className="border-white/5 bg-black/40 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-lg font-black uppercase">Stream Reach</CardTitle>
                  <CardDescription>Distribution across S1-S6.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <LevelBar
                    label="S1"
                    count={stats.s1}
                    total={stats.totalStudents}
                    color="bg-blue-600"
                  />
                  <LevelBar
                    label="S2"
                    count={stats.s2}
                    total={stats.totalStudents}
                    color="bg-indigo-600"
                  />
                  <LevelBar
                    label="S3"
                    count={stats.s3}
                    total={stats.totalStudents}
                    color="bg-violet-600"
                  />
                  <LevelBar
                    label="S4"
                    count={stats.s4}
                    total={stats.totalStudents}
                    color="bg-purple-600"
                  />
                  <LevelBar
                    label="S5"
                    count={stats.s5}
                    total={stats.totalStudents}
                    color="bg-emerald-600"
                  />
                  <LevelBar
                    label="S6"
                    count={stats.s6}
                    total={stats.totalStudents}
                    color="bg-amber-600"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Teacher Bottleneck Table */}
            <Card className="border-white/5 bg-black/40 backdrop-blur-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-black uppercase tracking-tight">
                    Faculty Operational Grid
                  </CardTitle>
                  <CardDescription>
                    Identifying grading bottlenecks and verification status.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" className="border-white/10 bg-white/5">
                  Export Registry
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader className="border-white/5">
                    <TableRow className="hover:bg-transparent border-white/5 text-zinc-500 uppercase text-[10px] font-bold">
                      <TableHead>Instructor Name</TableHead>
                      <TableHead>Verified Submissions</TableHead>
                      <TableHead>Pending Queue</TableHead>
                      <TableHead>Efficiency Rating</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teacherBottlenecks.map((t, idx) => (
                      <TableRow key={idx} className="border-white/5 hover:bg-white/[0.02]">
                        <TableCell className="font-bold">{t.name}</TableCell>
                        <TableCell>
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-none">
                            {t.verified}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-amber-500/10 text-amber-500 border-none">
                            {t.pending}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={t.ratio} className="h-1.5 w-20 bg-white/5" />
                            <span className="text-xs font-mono">{t.ratio}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-500">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {teacherBottlenecks.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-zinc-600 italic">
                          No grading activity detected yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "faculty" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter">
                  Faculty Access Terminals
                </h2>
                <p className="text-zinc-500 text-sm">
                  Manage institutional access for internal faculty members.
                </p>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="h-4 w-4 mr-2" />
                Enroll New Instructor
              </Button>
            </div>

            <Card className="border-white/5 bg-black/40 backdrop-blur-xl p-12 text-center">
              <Database className="h-12 w-12 text-zinc-800 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-1">Faculty Terminal Management</h3>
              <p className="text-zinc-600 text-sm max-w-sm mx-auto">
                This panel allows you to configure specific terminal permissions for subject
                teachers across your campus network.
              </p>
            </Card>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <h2 className="text-2xl font-black uppercase tracking-tighter">
              Isolated Campus Controls
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-white/5 bg-black/40 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-blue-500">
                    Tenant Identity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-500">Organization Display Name</Label>
                    <Input defaultValue={org?.name} className="bg-white/5 border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-500">Corporate School Key</Label>
                    <div className="flex gap-2">
                      <Input
                        defaultValue={org?.school_key}
                        disabled
                        className="bg-white/5 border-white/10 font-mono text-blue-400"
                      />
                      <Button variant="outline" className="border-white/10">
                        Rotate Key
                      </Button>
                    </div>
                    <p className="text-[10px] text-zinc-600">
                      Rotating the key will log out all currently active faculty sessions.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/5 bg-black/40 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-emerald-500">
                    Operational Boundaries
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                    <div>
                      <p className="text-xs font-bold">Automatic UNEB Pre-Sync</p>
                      <p className="text-[10px] text-zinc-500">
                        Sync verified projects directly to national servers.
                      </p>
                    </div>
                    <Badge className="bg-blue-600/20 text-blue-400">ACTIVE</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 opacity-50">
                    <div>
                      <p className="text-xs font-bold">Strict Local IP Lock</p>
                      <p className="text-[10px] text-zinc-500">
                        Restrict admin access to campus WiFi only.
                      </p>
                    </div>
                    <Badge variant="outline" className="border-white/10">
                      DISABLED
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function NavButton({ icon: Icon, label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
        active
          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
          : "text-zinc-500 hover:text-white hover:bg-white/5"
      }`}
    >
      <Icon className={`h-4 w-4 ${active ? "text-white" : "text-zinc-600"}`} />
      {label}
    </button>
  );
}

function StatCard({ icon: Icon, label, value, trend, color = "text-white" }: any) {
  return (
    <Card className="border-white/5 bg-black/40 backdrop-blur-xl group hover:border-blue-600/30 transition-all">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all text-zinc-400">
            <Icon className="h-5 w-5" />
          </div>
          <ArrowUpRight className="h-4 w-4 text-zinc-600" />
        </div>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">
          {label}
        </p>
        <h3 className={`text-2xl font-black ${color}`}>{value}</h3>
        <p className="text-[10px] text-zinc-600 mt-2 font-medium">{trend}</p>
      </CardContent>
    </Card>
  );
}

function LevelBar({ label, count, total, color }: any) {
  const percentage = Math.round((count / (total || 1)) * 100);
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tighter">
        <span>{label} Stream</span>
        <span className="text-zinc-500">
          {count} Learners ({percentage}%)
        </span>
      </div>
      <Progress value={percentage} className={`h-1.5 bg-white/5 ${color}`} />
    </div>
  );
}
