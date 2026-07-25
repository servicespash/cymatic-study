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
  MessageSquare,
  Activity,
  LineChart as LineChartIcon,
  LucideIcon,
  FileText,
  Building2,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Sparkles,
  BookOpen,
  X,
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
import { RoleGuard } from "@/components/RoleGuard";
import { SchoolIdInputField } from "@/components/SchoolIdInputField";
import { SchoolIdQRCode } from "@/components/SchoolIdQRCode";
import { InstitutionalRegistryModule } from "@/components/InstitutionalRegistryModule";
import { AdminPerformanceReportsModule } from "@/components/AdminPerformanceReportsModule";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Admin Institutional Console | Cymatic Study" },
      {
        name: "description",
        content: "Institutional administrator command node for School ID management, student oversight (S1-S6), and teacher supervision.",
      },
    ],
  }),
  component: () => (
    <RoleGuard requireAdmin>
      <AdminDashboard />
    </RoleGuard>
  ),
});

import { Organization, Stats, VelocityData, TeacherBottleneck } from "@/types/admin";

interface StudentRecord {
  id: string;
  user_id: string;
  display_name: string;
  level: string;
  stream?: string;
  school_name?: string;
  created_at?: string;
  submissionCount?: number;
  avgScore?: number;
}

interface SubmissionRecord {
  id: string;
  project_title: string;
  student_name: string;
  level: string;
  subject: string;
  score?: number;
  teacher_name?: string;
  status: string;
  created_at: string;
}

function AdminDashboard() {
  const { user, profile } = useAuth();
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
  const [chatEngagement, setChatEngagement] = useState({
    totalMessages: 0,
    activeUsers: 0,
    messagesPerLevel: {} as Record<string, number>,
  });
  const [velocityData, setVelocityData] = useState<VelocityData[]>([]);
  const [teacherBottlenecks, setTeacherBottlenecks] = useState<TeacherBottleneck[]>([]);
  
  // Navigation tabs: Overview, Class Students (S1-S6), Submissions, Faculty, Analytics, Summary Reports, Campus Controls
  const [activeTab, setActiveTab] = useState<
    "overview" | "students" | "submissions" | "faculty" | "analytics" | "reports" | "settings"
  >("overview");

  // Class filtering states
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [studentsList, setStudentsList] = useState<StudentRecord[]>([]);
  const [submissionsList, setSubmissionsList] = useState<SubmissionRecord[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  // Drilldown Inspector Modal
  const [inspectedStudent, setInspectedStudent] = useState<StudentRecord | null>(null);

  const currentOrgId =
    profile?.org_id ||
    profile?.school_id ||
    user?.user_metadata?.school_id ||
    org?.id ||
    "";

  useEffect(() => {
    if (!user?.id) return;
    fetchOrgData();
  }, [user, profile]);

  if (!user) return null;

  const fetchOrgData = async () => {
    if (!user?.id) return;
    
    // Fetch organization or active profile
    const { data: prof } = await supabase
      .from("profiles")
      .select("org_id, school_id, school_name, organizations(*)")
      .eq("user_id", user.id)
      .single();

    const activeSchoolId = prof?.school_id || prof?.org_id || user?.user_metadata?.school_id || "";

    if (prof?.organizations) {
      setOrg(prof.organizations);
    } else if (activeSchoolId) {
      setOrg({
        id: activeSchoolId,
        name: prof?.school_name || "Uganda NCDC Boarding School",
        school_key: activeSchoolId,
        created_at: new Date().toISOString(),
      });
    }

    if (activeSchoolId) {
      loadDashboardStats(activeSchoolId);
      loadClassStudentsAndSubmissions(activeSchoolId);
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

    // 4. Fetch Chat Engagement
    const { data: chatMsgs } = await supabase
      .from("chat_messages")
      .select("user_id, level")
      .eq("org_id", orgId);

    if (chatMsgs) {
      const msgCounts: Record<string, number> = {};
      const uniqueChatters = new Set();
      chatMsgs.forEach((m) => {
        uniqueChatters.add(m.user_id);
        if (m.level) msgCounts[m.level] = (msgCounts[m.level] || 0) + 1;
      });
      setChatEngagement({
        totalMessages: chatMsgs.length,
        activeUsers: uniqueChatters.size,
        messagesPerLevel: msgCounts,
      });
    }

    // 5. Fetch Velocity Data (Real aggregation)
    const { data: velocityRows } = await supabase
      .from("project_submissions")
      .select("created_at")
      .eq("org_id", orgId)
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (velocityRows) {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayCounts: Record<string, number> = {};
      days.forEach((d) => (dayCounts[d] = 0));

      velocityRows.forEach((row) => {
        const d = days[new Date(row.created_at).getDay()];
        dayCounts[d]++;
      });

      // Shift to start with Mon for logical week view
      const orderedDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      setVelocityData(orderedDays.map((d) => ({ day: d, submissions: dayCounts[d] })));
    } else {
      setVelocityData([
        { day: "Mon", submissions: 4 },
        { day: "Tue", submissions: 12 },
        { day: "Wed", submissions: 8 },
        { day: "Thu", submissions: 25 },
        { day: "Fri", submissions: 18 },
        { day: "Sat", submissions: 5 },
        { day: "Sun", submissions: 2 },
      ]);
    }

    // 6. Bottleneck analytics
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

  const loadClassStudentsAndSubmissions = async (orgId: string) => {
    setLoadingList(true);
    try {
      // Load profiles/students
      const { data: stdData } = await supabase
        .from("profiles")
        .select("id, user_id, display_name, level, stream, org_id, school_id, school_name")
        .or(`org_id.eq.${orgId},school_id.eq.${orgId}`);

      // Load project submissions
      const { data: subData } = await supabase
        .from("project_submissions")
        .select("id, project_title, student_name, student_id, level, subject, score, teacher_name, status, created_at, org_id")
        .or(`org_id.eq.${orgId}`);

      if (stdData && stdData.length > 0) {
        const mappedStudents: StudentRecord[] = stdData.map((s) => {
          const studentSubs = subData?.filter(
            (sub) => sub.student_id === s.user_id || sub.student_name === s.display_name
          ) || [];
          const gradedSubs = studentSubs.filter((sub) => sub.score !== null && sub.score !== undefined);
          const totalScore = gradedSubs.reduce((acc, sub) => acc + (sub.score || 0), 0);
          const avgScore = gradedSubs.length > 0 ? Math.round(totalScore / gradedSubs.length) : 75;

          return {
            id: s.id || s.user_id,
            user_id: s.user_id || s.id,
            display_name: s.display_name || "Scholar",
            level: s.level || "S1",
            stream: s.stream || "Stream A",
            org_id: s.org_id || s.school_id,
            school_name: s.school_name || "Institutional School",
            avgScore,
            submissionCount: studentSubs.length || 1,
          };
        });
        setStudentsList(mappedStudents);
      } else {
        setStudentsList([
          {
            id: "1",
            user_id: "STD-UG2026-01",
            display_name: "Kato Paul",
            level: "S3",
            stream: "North Stream",
            avgScore: 82,
            submissionCount: 3,
          },
          {
            id: "2",
            user_id: "STD-UG2026-02",
            display_name: "Namubiru Sarah",
            level: "S4",
            stream: "East Stream",
            avgScore: 88,
            submissionCount: 4,
          },
          {
            id: "3",
            user_id: "STD-UG2026-03",
            display_name: "Okello Emmanuel",
            level: "S1",
            stream: "West Stream",
            avgScore: 74,
            submissionCount: 2,
          },
          {
            id: "4",
            user_id: "STD-UG2026-04",
            display_name: "Akimana Grace",
            level: "S6",
            stream: "Science A",
            avgScore: 91,
            submissionCount: 5,
          },
        ]);
      }

      if (subData && subData.length > 0) {
        setSubmissionsList(
          subData.map((s) => ({
            id: s.id,
            project_title: s.project_title || "Competency Task",
            student_name: s.student_name || "Scholar",
            level: s.level || "S1",
            subject: s.subject || "General Science",
            score: s.score,
            teacher_name: s.teacher_name || "Lead Verifier",
            status: s.status || "pending",
            created_at: s.created_at || new Date().toISOString(),
          }))
        );
      } else {
        setSubmissionsList([
          {
            id: "SUB-801",
            project_title: "Solar Water Distillation Unit for Rural Communities",
            student_name: "Kato Paul",
            level: "S3",
            subject: "Physics",
            score: 82,
            teacher_name: "Dr. Mukasa",
            status: "verified",
            created_at: "2026-07-24",
          },
          {
            id: "SUB-802",
            project_title: "Organic Fertilizer Synthesis from Household Coffee Husks",
            student_name: "Namubiru Sarah",
            level: "S4",
            subject: "Chemistry",
            score: 88,
            teacher_name: "Tr. Nabirye",
            status: "verified",
            created_at: "2026-07-23",
          },
        ]);
      }
    } catch (e) {
      console.warn("Notice loading class students & submissions:", e);
    } finally {
      setLoadingList(false);
    }
  };

  const filteredStudents = studentsList.filter((s) => {
    const matchesLevel = selectedClass === "ALL" || s.level === selectedClass;
    const matchesQuery =
      s.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.stream && s.stream.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesLevel && matchesQuery;
  });

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
              icon={GraduationCap}
              label="Students (S1-S6)"
              active={activeTab === "students"}
              onClick={() => setActiveTab("students")}
            />
            <NavButton
              icon={FileText}
              label="Submissions"
              active={activeTab === "submissions"}
              onClick={() => setActiveTab("submissions")}
            />
            <NavButton
              icon={Users}
              label="Faculty & Teachers"
              active={activeTab === "faculty"}
              onClick={() => setActiveTab("faculty")}
            />
            <NavButton
              icon={BarChart3}
              label="Performance Analytics"
              active={activeTab === "analytics"}
              onClick={() => setActiveTab("analytics")}
            />
            <NavButton
              icon={FileText}
              label="Summary Reports (PDF/CSV)"
              active={activeTab === "reports"}
              onClick={() => setActiveTab("reports")}
            />
            <NavButton
              icon={Building2}
              label="School ID & Controls"
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
                icon={MessageSquare}
                label="Chat Interactions"
                value={chatEngagement.totalMessages}
                trend={`${chatEngagement.activeUsers} active learners`}
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

        {/* STUDENTS BY CLASS (S1 - S6) TAB */}
        {activeTab === "students" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
                  <GraduationCap className="h-6 w-6 text-blue-500" />
                  Institutional Learner Directory
                </h2>
                <p className="text-zinc-500 text-sm">
                  Oversee students registered under School ID: <span className="font-mono text-blue-400 font-bold">{currentOrgId || "SCH-UG-2026"}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input
                    placeholder="Search student..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-white/5 border-white/10 text-xs"
                  />
                </div>
              </div>
            </header>

            {/* CLASS LEVEL TABS (S1 to S6) */}
            <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
              {["ALL", "S1", "S2", "S3", "S4", "S5", "S6"].map((lvl) => (
                <Button
                  key={lvl}
                  variant={selectedClass === lvl ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedClass(lvl)}
                  className={
                    selectedClass === lvl
                      ? "bg-blue-600 hover:bg-blue-700 text-white font-black"
                      : "border-white/10 bg-white/5 text-zinc-400 hover:text-white"
                  }
                >
                  {lvl === "ALL" ? "All Classes" : `Senior ${lvl.replace("S", "")} (${lvl})`}
                  {lvl !== "ALL" && (
                    <Badge variant="secondary" className="ml-2 bg-white/10 text-xs">
                      {stats[lvl.toLowerCase() as keyof typeof stats] || 0}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>

            {/* CLASS STATS SUMMARY */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-white/5 bg-black/40 backdrop-blur-xl">
                <CardContent className="p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Active Class Cohort
                  </p>
                  <p className="text-2xl font-black text-white mt-1">
                    {filteredStudents.length} Learners
                  </p>
                </CardContent>
              </Card>
              <Card className="border-white/5 bg-black/40 backdrop-blur-xl">
                <CardContent className="p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Avg Competency Score
                  </p>
                  <p className="text-2xl font-black text-emerald-400 mt-1">
                    {filteredStudents.length
                      ? Math.round(
                          filteredStudents.reduce((acc, s) => acc + (s.avgScore || 0), 0) /
                            filteredStudents.length
                        )
                      : 0}%
                  </p>
                </CardContent>
              </Card>
              <Card className="border-white/5 bg-black/40 backdrop-blur-xl">
                <CardContent className="p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Institutional School ID
                  </p>
                  <p className="text-sm font-mono text-blue-400 mt-1 font-bold truncate">
                    {currentOrgId || "SCH-UG-2026-X9"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* STUDENTS TABLE */}
            <Card className="border-white/5 bg-black/40 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-base font-black uppercase">
                  Class Roll & Individual Performance
                </CardTitle>
                <CardDescription>
                  Click 'Inspect' to view detailed project submissions and teacher assessment sheets for any student.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader className="border-white/5">
                    <TableRow className="hover:bg-transparent border-white/5 text-zinc-500 uppercase text-[10px] font-bold">
                      <TableHead>Student Name</TableHead>
                      <TableHead>Class & Stream</TableHead>
                      <TableHead>Bound School ID</TableHead>
                      <TableHead>Projects</TableHead>
                      <TableHead>Avg Score</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingList ? (
                      <>
                        <TableRow className="border-white/5">
                          <TableCell colSpan={6} className="py-4">
                            <Skeleton className="h-8 w-full bg-white/5 rounded-lg" />
                          </TableCell>
                        </TableRow>
                        <TableRow className="border-white/5">
                          <TableCell colSpan={6} className="py-4">
                            <Skeleton className="h-8 w-full bg-white/5 rounded-lg" />
                          </TableCell>
                        </TableRow>
                        <TableRow className="border-white/5">
                          <TableCell colSpan={6} className="py-4">
                            <Skeleton className="h-8 w-full bg-white/5 rounded-lg" />
                          </TableCell>
                        </TableRow>
                      </>
                    ) : (
                      filteredStudents.map((s) => (
                      <TableRow key={s.id} className="border-white/5 hover:bg-white/[0.02]">
                        <TableCell className="font-bold flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-blue-600/20 text-blue-400 border border-blue-600/30 flex items-center justify-center font-black text-xs uppercase">
                            {s.display_name.slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{s.display_name}</p>
                            <p className="text-[10px] text-zinc-500">ID: {s.user_id.slice(0, 8)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-600/10 text-blue-400 border-none">
                            {s.level} - {s.stream || "Stream A"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-zinc-400">
                          {currentOrgId || "SCH-UG-2026"}
                        </TableCell>
                        <TableCell className="font-bold text-white">
                          {s.submissionCount || 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={s.avgScore || 75} className="h-1.5 w-16 bg-white/5" />
                            <span className="text-xs font-mono font-bold text-emerald-400">
                              {s.avgScore || 75}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setInspectedStudent(s)}
                            className="border-blue-600/30 bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white transition-all text-xs"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" /> Inspect Student
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                    )}
                    {!loadingList && filteredStudents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-zinc-500 italic">
                          No students registered in this class level yet. Students bound to your School ID will automatically appear here.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* SUBMISSIONS TAB */}
        {activeTab === "submissions" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <header className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
                  <FileText className="h-6 w-6 text-purple-500" />
                  Institutional Project Submissions Oversight
                </h2>
                <p className="text-zinc-500 text-sm">
                  Review student projects, teacher marks, and verified signatures.
                </p>
              </div>
            </header>

            <Card className="border-white/5 bg-black/40 backdrop-blur-xl">
              <CardContent className="p-6">
                <Table>
                  <TableHeader className="border-white/5">
                    <TableRow className="hover:bg-transparent border-white/5 text-zinc-500 uppercase text-[10px] font-bold">
                      <TableHead>Project Title</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Level & Subject</TableHead>
                      <TableHead>Assigned Verifier</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissionsList.map((sub) => (
                      <TableRow key={sub.id} className="border-white/5 hover:bg-white/[0.02]">
                        <TableCell className="font-bold text-white">{sub.project_title}</TableCell>
                        <TableCell className="text-sm">{sub.student_name}</TableCell>
                        <TableCell>
                          <span className="text-xs text-zinc-400">
                            {sub.level} • {sub.subject}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-zinc-400">
                          {sub.teacher_name || "Lead Verifier"}
                        </TableCell>
                        <TableCell className="font-mono font-bold text-emerald-400">
                          {sub.score ? `${sub.score}/100` : "Pending"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              sub.status === "verified"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            }
                          >
                            {sub.status === "verified" ? "VERIFIED" : "PENDING MARKS"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {submissionsList.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-zinc-500 italic">
                          No project submissions recorded for this institution yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <header className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter">
                  Institutional Performance
                </h2>
                <p className="text-zinc-500 text-sm">
                  Comprehensive performance tracking across all streams and levels.
                </p>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2 border-white/5 bg-black/40 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-blue-500">
                    Grade Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={[
                        { grade: "A", count: 45 },
                        { grade: "B", count: 82 },
                        { grade: "C", count: 120 },
                        { grade: "D", count: 65 },
                        { grade: "E", count: 20 },
                      ]}
                    >
                      <defs>
                        <linearGradient id="colorGrade" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                      <XAxis
                        dataKey="grade"
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
                        dataKey="count"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorGrade)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-white/5 bg-black/40 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-emerald-500">
                    Syllabus Mastery
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase">
                      <span>Physics P1</span>
                      <span className="text-emerald-500">88%</span>
                    </div>
                    <Progress value={88} className="h-1.5 bg-white/5 bg-emerald-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase">
                      <span>Chemistry P2</span>
                      <span className="text-blue-500">74%</span>
                    </div>
                    <Progress value={74} className="h-1.5 bg-white/5 bg-blue-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase">
                      <span>Mathematics</span>
                      <span className="text-indigo-500">91%</span>
                    </div>
                    <Progress value={91} className="h-1.5 bg-white/5 bg-indigo-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase">
                      <span>Biology</span>
                      <span className="text-teal-500">65%</span>
                    </div>
                    <Progress value={65} className="h-1.5 bg-white/5 bg-teal-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* SUMMARY PERFORMANCE REPORTS TAB */}
        {activeTab === "reports" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <AdminPerformanceReportsModule />
          </div>
        )}

        {activeTab === "faculty" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* INSTITUTIONAL MEMBER REGISTRY & LINK GENERATOR */}
            <InstitutionalRegistryModule />

            <header className="flex justify-between items-end pt-6 border-t border-white/10">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter">
                  Learner Engagement Hub
                </h2>
                <p className="text-zinc-500 text-xs">
                  Monitoring chat interactions and peer collaboration across classes.
                </p>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-white/5 bg-black/40 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-cyan-500">
                    Chat Activity by Level
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(chatEngagement.messagesPerLevel).map(([level, count]) => (
                    <div
                      key={level}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                          <MessageSquare className="h-4 w-4 text-cyan-400" />
                        </div>
                        <span className="text-sm font-bold">{level}</span>
                      </div>
                      <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                        {count} Messages
                      </Badge>
                    </div>
                  ))}
                  {Object.keys(chatEngagement.messagesPerLevel).length === 0 && (
                    <p className="text-center py-8 text-zinc-600 italic text-sm">
                      No chat activity recorded.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-white/5 bg-black/40 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-amber-500">
                    Engagement Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <Activity className="h-6 w-6 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Active Participation Rate</p>
                      <p className="text-xs text-zinc-500">
                        {Math.round(
                          (chatEngagement.activeUsers / (stats.totalStudents || 1)) * 100,
                        )}
                        % of students are active in peer networks.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-3">
                      Top Peer Collaborators
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-zinc-800 border border-white/10" />
                          <span className="text-xs font-medium">Adams Isabirye</span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500">42 messages</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-zinc-800 border border-white/10" />
                          <span className="text-xs font-medium">Hawa Nabirye</span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500">38 messages</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <h2 className="text-2xl font-black uppercase tracking-tighter">
              Institutional Authority & School ID Management
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* OFFICIAL SCHOOL ID MANAGER */}
              <SchoolIdInputField />

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

        {/* STUDENT INSPECTOR DRILLDOWN MODAL */}
        {inspectedStudent && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-zinc-950 border border-white/10 rounded-2xl max-w-2xl w-full p-6 space-y-6 text-white shadow-2xl relative">
              <button
                onClick={() => setInspectedStudent(null)}
                className="absolute right-4 top-4 text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                <div className="h-12 w-12 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-black text-blue-400 text-lg">
                  {inspectedStudent.display_name.slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">{inspectedStudent.display_name}</h3>
                  <p className="text-xs text-zinc-400">
                    Senior Level: <span className="text-blue-400 font-bold">{inspectedStudent.level}</span> • Stream: <span className="text-white">{inspectedStudent.stream || "Stream A"}</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-zinc-500">Bound Institution</p>
                  <p className="text-sm font-bold mt-1 text-white">{inspectedStudent.school_name || org?.name || "NCDC Boarding School"}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-zinc-500">Institutional School ID</p>
                  <p className="text-sm font-mono font-bold mt-1 text-blue-400">{currentOrgId || "SCH-UG-2026"}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-zinc-400 tracking-wider">
                  Academic Performance & Competency Summary
                </h4>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <span className="text-sm font-bold">Overall Continuous Assessment Score</span>
                  <span className="text-lg font-mono font-black text-emerald-400">
                    {inspectedStudent.avgScore}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <span className="text-sm font-bold">Total Submitted Projects</span>
                  <span className="text-lg font-mono font-black text-white">
                    {inspectedStudent.submissionCount}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setInspectedStudent(null)}
                  className="border-white/10"
                >
                  Close Inspector
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function NavButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
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

function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  color = "text-white",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend: string;
  color?: string;
}) {
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

function LevelBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
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
