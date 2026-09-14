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
  CloudLightning,
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
import { AuthRouteMiddleware } from "@/middlewares/auth-middleware";
import { SchoolIdInputField } from "@/components/SchoolIdInputField";
import { SchoolIdQRCode } from "@/components/SchoolIdQRCode";
import { InstitutionalRegistryModule } from "@/components/InstitutionalRegistryModule";
import { AdminPerformanceReportsModule } from "@/components/AdminPerformanceReportsModule";
import { StudentMatrix } from "@/components/admin/StudentMatrix";
import { Skeleton } from "@/components/ui/skeleton";
import { TeacherApprovalTable } from "@/components/admin/TeacherApprovalTable";
import { DeploymentStatus } from "@/components/DeploymentStatus";
import { AdminOnboardingWorkflow } from "@/components/AdminOnboardingWorkflow";
import { UnifiedInstitutionalDirectory } from "@/components/UnifiedInstitutionalDirectory";
import { BulkQRGenerator } from "@/components/BulkQRGenerator";
import { DisciplineNudges } from "@/components/DisciplineNudges";
import { SupabaseLivePulseHeader } from "@/components/SupabaseLivePulseHeader";
import { GlobalErrorBoundary } from "@/components/GlobalErrorBoundary";

export const Route = createFileRoute("/admin/dashboard/")({
  head: () => ({
    meta: [
      { title: "Admin Institutional Console | Cymatic Study" },
      {
        name: "description",
        content:
          "Institutional administrator command node for School ID management, student oversight (S1-S6), and teacher supervision.",
      },
    ],
  }),
  component: AdminDashboard,
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
  role?: string;
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

import { ReleaseDashboard } from "@/components/ReleaseDashboard";

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
  const [isOnboardingNeeded, setIsOnboardingNeeded] = useState(false);

  // Navigation tabs: Overview, Class Students (S1-S6), Submissions, Faculty, Analytics, Summary Reports, Campus Controls, Feedback
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "students"
    | "submissions"
    | "faculty"
    | "analytics"
    | "reports"
    | "settings"
    | "feedback"
  >("overview");

  // Class filtering states
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [studentsList, setStudentsList] = useState<StudentRecord[]>([]);
  const [submissionsList, setSubmissionsList] = useState<SubmissionRecord[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  // Drilldown Inspector Modal
  const [inspectedStudent, setInspectedStudent] = useState<StudentRecord | null>(null);

  // Feedback State
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  const currentOrgId = profile?.organization_id || user?.user_metadata?.school_id || org?.id || "";

  useEffect(() => {
    if (!user?.id) return;
    fetchOrgData();
  }, [user?.id, profile?.organization_id]);

  if (!user) return null;

  const fetchOrgData = async () => {
    if (!user?.id) return;

    // Fetch organization or active profile
    const { data: prof } = await supabase
      .from("profiles")
      .select("org_id, school_name, organizations(*)")
      .eq("user_id", user.id)
      .single();

    const activeSchoolId = prof?.org_id || user?.user_metadata?.school_id || "";
    const activeOrgName = prof?.organizations?.name || prof?.school_name || "Institutional School";

    if (!activeSchoolId) {
      setIsOnboardingNeeded(true);
    } else {
      setIsOnboardingNeeded(false);
      if (prof?.organizations) {
        setOrg(prof.organizations);
      } else {
        setOrg(null);
        if (activeSchoolId) {
          // If we have an ID but no record, it might be an orphaned admin or first-time setup
          console.warn(`[Admin] Organization record not found for ID: ${activeSchoolId}`);
        }
      }
      loadDashboardStats(activeSchoolId);
      loadClassStudentsAndSubmissions(activeSchoolId, activeOrgName);
      loadFeedback();
    }
  };

  const loadFeedback = async () => {
    setLoadingFeedback(true);
    try {
      const { data, error } = await supabase
        .from("user_feedback")
        .select(`
          *,
          profiles:user_id (display_name)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        // Fallback to local storage if table doesn't exist
        const local = localStorage.getItem("local_user_feedback");
        setFeedbackList(local ? JSON.parse(local) : []);
        return;
      }
      setFeedbackList(data || []);
    } catch (e) {
      const local = localStorage.getItem("local_user_feedback");
      setFeedbackList(local ? JSON.parse(local) : []);
    } finally {
      setLoadingFeedback(false);
    }
  };

  const updateFeedbackStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from("user_feedback").update({ status }).eq("id", id);

      if (error) {
        // Update local storage feedback
        const local = localStorage.getItem("local_user_feedback");
        if (local) {
          const parsed = JSON.parse(local);
          const updated = parsed.map((item: any) => (item.id === id ? { ...item, status } : item));
          localStorage.setItem("local_user_feedback", JSON.stringify(updated));
          setFeedbackList(updated);
        }
      }
      toast.success(`Feedback marked as ${status}`);
      loadFeedback();
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  const loadDashboardStats = async (orgId: string) => {
    // 1. Fetch profiles by org_id or school_id
    const { data: allProfiles } = await supabase
      .from("profiles")
      .select("role")
      .eq("org_id", orgId);

    const counts = { S1: 0, S2: 0, S3: 0, S4: 0, S5: 0, S6: 0 };
    let studentCount = 0;
    let teacherCount = 0;

    allProfiles?.forEach((s) => {
      const rawRole = (s.role || "").toLowerCase();
      if (rawRole.includes("teacher")) {
        teacherCount++;
      } else if (rawRole.includes("admin")) {
        // Exclude admin from students
      } else {
        studentCount++;
        if (s.level && counts[s.level as keyof typeof counts] !== undefined) {
          counts[s.level as keyof typeof counts]++;
        }
      }
    });

    // 2. Fetch pending submissions
    const { count: pendingCount } = await supabase
      .from("project_submissions")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "pending");

    // 3. Fetch active teachers (users with teacher role in this org)
    const { data: teachersInSubs } = await supabase
      .from("project_submissions")
      .select("teacher_id, teacher_name")
      .eq("organization_id", orgId)
      .not("teacher_id", "is", null);

    const uniqueTeachers = new Set(teachersInSubs?.map((t) => t.teacher_id));
    const finalTeacherCount = Math.max(teacherCount, uniqueTeachers.size);

    setStats({
      totalStudents: studentCount,
      s1: counts.S1,
      s2: counts.S2,
      s3: counts.S3,
      s4: counts.S4,
      s5: counts.S5,
      s6: counts.S6,
      pendingSubmissions: pendingCount || 0,
      activeTeachers: finalTeacherCount,
    });

    // 4. Fetch Chat Engagement
    const { data: chatMsgs } = await supabase
      .from("chat_messages")
      .select("user_id, level")
      .eq("organization_id", orgId);

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
      .eq("organization_id", orgId)
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
      // Velocity Data
      setVelocityData([]);
    }

    // 6. Bottleneck analytics
    // Aggregate pending vs verified per teacher
    const { data: bottlenecks } = await supabase
      .from("project_submissions")
      .select("teacher_name, status")
      .eq("organization_id", orgId);

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

  const loadClassStudentsAndSubmissions = async (orgId: string, orgName: string) => {
    setLoadingList(true);
    try {
      // Load profiles/students
      let { data: stdData } = await (supabase.from("profiles") as any)
        .select("id, user_id, display_name, org_id, school_name, role")
        .eq("org_id", orgId);

      // Load project submissions
      let { data: subData } = await (supabase.from("project_submissions") as any)
        .select("id, student_id, total_competency_score, teacher_name, status, created_at, school_key")
        .eq("school_key", orgId);

      // No auto-seeding of fake mock records; respect real institutional data integrity
      if (stdData && stdData.length > 0) {
        const mappedStudents: StudentRecord[] = stdData
          .filter((s) => s.role === "student" || s.role === "student_monitor") // Only students
          .map((s) => {
          const studentSubs = subData?.filter((sub) => sub.student_id === (s.user_id || s.id)) || [];
          const gradedSubs = studentSubs.filter(
            (sub) => sub.total_competency_score !== null && sub.total_competency_score !== undefined,
          );
          const totalScore = gradedSubs.reduce((acc, sub) => acc + (sub.total_competency_score || 0), 0);
          const avgScore = gradedSubs.length > 0 ? Math.round(totalScore / gradedSubs.length) : 75;

          return {
            id: s.id || s.user_id,
            user_id: s.user_id || s.id,
            display_name: s.display_name || "Scholar",
            level: "S1",
            stream: "Stream A",
            role: s.role || "student",
            org_id: s.org_id || s.school_id,
            school_name: orgName,
            avgScore,
            submissionCount: studentSubs.length || 0,
          };
        });
        setStudentsList(mappedStudents);
      } else {
        setStudentsList([]);
      }

      if (subData && subData.length > 0) {
        setSubmissionsList(
          subData.map((s) => ({
            id: s.id,
            project_title: "Competency Task",
            student_name: "Scholar",
            level: "S1",
            subject: "General Science",
            score: s.total_competency_score,
            teacher_name: s.teacher_name || "Lead Verifier",
            status: s.status || "pending",
            created_at: s.created_at || new Date().toISOString(),
          })),
        );
      } else {
        setSubmissionsList([]);
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

  if (isOnboardingNeeded) {
    return (
      <AdminOnboardingWorkflow
        onComplete={(schoolId, schoolName) => {
          setIsOnboardingNeeded(false);
          fetchOrgData();
        }}
      />
    );
  }

  return (
    <div className="w-full bg-background text-foreground selection:bg-blue-600/30">
      {/* Main Command Center */}
      <main className="p-4 md:p-8 app-container dashboard-container space-y-8 w-full max-w-7xl mx-auto">
        {/* Horizontal Navigation for remaining modules */}
        <div className="flex overflow-x-auto gap-2 pb-2 mb-6 border-b border-border/50 hide-scrollbar">
          {[
            { id: "overview", label: "Overview", icon: LayoutDashboard },
            { id: "submissions", label: "Submissions", icon: FileText },
            { id: "analytics", label: "Analytics", icon: BarChart3 },
            { id: "reports", label: "Reports", icon: FileText },
            { id: "settings", label: "School ID & Settings", icon: Settings },
            { id: "feedback", label: "Feedback", icon: MessageSquare }
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.id as any)}
              className="whitespace-nowrap rounded-full"
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>

        <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight uppercase">Dashboard Overview</h1>
            <p className="text-zinc-500 text-sm">Institutional command node for {org?.name}.</p>
          </div>
          <div className="flex items-center gap-3">
            <SupabaseLivePulseHeader />
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
            <div className="dashboard-grid-4">
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

            <div className="dashboard-grid">
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
                  Oversee students registered under School ID:{" "}
                  <span className="font-mono text-blue-400 font-bold">
                    {currentOrgId || "UNLINKED"}
                  </span>
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
            <div className="dashboard-grid">
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
                            filteredStudents.length,
                        )
                      : 0}
                    %
                  </p>
                </CardContent>
              </Card>
              <Card className="border-white/5 bg-black/40 backdrop-blur-xl">
                <CardContent className="p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Institutional School ID
                  </p>
                  <p className="text-sm font-mono text-blue-400 mt-1 font-bold truncate">
                    {currentOrgId || "NOT FOUND"}
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
                  Click 'Inspect' to view detailed project submissions and teacher assessment sheets
                  for any student.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StudentMatrix
                  students={filteredStudents}
                  loading={loadingList}
                  searchTerm={searchQuery}
                  setSearchTerm={setSearchQuery}
                  setInspectedStudent={setInspectedStudent}
                  onRefresh={() => {
                    loadClassStudentsAndSubmissions(currentOrgId, org?.name || "Institutional School");
                    loadDashboardStats(currentOrgId);
                  }}
                  currentOrgId={currentOrgId}
                />
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

            <div className="dashboard-grid">
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

        {activeTab === "feedback" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <header className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
                  <MessageSquare className="h-6 w-6 text-blue-500" />
                  Student Feedback Management
                </h2>
                <p className="text-zinc-500 text-sm">
                  Review student suggestions, bug reports, and general feedback.
                </p>
              </div>
            </header>

            <Card className="border-white/5 bg-black/40 backdrop-blur-xl">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="border-white/5 bg-white/5">
                    <TableRow className="hover:bg-transparent border-white/5 text-zinc-500 uppercase text-[10px] font-bold">
                      <TableHead>Type</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead className="max-w-md">Message</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingFeedback ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2">
                            <Activity className="h-6 w-6 animate-spin text-blue-500" />
                            <p className="text-sm text-zinc-500">Synchronizing feedback logs...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      feedbackList.map((f) => (
                        <TableRow key={f.id} className="border-white/5 hover:bg-white/[0.02]">
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`uppercase text-[10px] border-none ${
                                f.type === "bug"
                                  ? "bg-red-500/10 text-red-500"
                                  : f.type === "suggestion"
                                    ? "bg-blue-500/10 text-blue-500"
                                    : "bg-zinc-500/10 text-zinc-500"
                              }`}
                            >
                              {f.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-xs font-bold text-white">
                                {f.profiles?.display_name || "User"}
                              </p>
                              <p className="text-[10px] text-zinc-500">
                                {f.level || "S1"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-[10px] font-mono text-zinc-500 truncate block max-w-[100px]">
                              {f.section}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-md">
                            <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                              {f.message}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`text-[10px] font-black uppercase ${
                                f.status === "open"
                                  ? "bg-amber-500/10 text-amber-500"
                                  : f.status === "resolved"
                                    ? "bg-emerald-500/10 text-emerald-500"
                                    : "bg-zinc-500/10 text-zinc-500"
                              }`}
                            >
                              {f.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {f.status === "open" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 text-[10px] text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                                  onClick={() => updateFeedbackStatus(f.id, "resolved")}
                                >
                                  Resolve
                                </Button>
                              )}
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-zinc-500"
                                onClick={() => {
                                  // Potentially delete or archive
                                  toast.info("Detailed view coming soon");
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    {feedbackList.length === 0 && !loadingFeedback && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-zinc-500 italic">
                          No feedback entries recorded yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* SUMMARY PERFORMANCE REPORTS TAB */}
        {activeTab === "reports" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <AdminPerformanceReportsModule />
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <h2 className="text-2xl font-black uppercase tracking-tighter">
              Institutional Authority & School ID Management
            </h2>

            <div className="dashboard-grid">
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

            <div className="pt-4">
              <UnifiedInstitutionalDirectory schoolId={currentOrgId} />
            </div>

            <div className="dashboard-grid pt-4">
              <BulkQRGenerator />
              <DisciplineNudges />
            </div>

            <div className="pt-4">
              <h3 className="text-xl font-black uppercase tracking-tight mb-4 flex items-center gap-2">
                <CloudLightning className="h-5 w-5 text-amber-500" />
                Edge CDN Webhook & Release Console
              </h3>
              <ReleaseDashboard />
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
                    Senior Level:{" "}
                    <span className="text-blue-400 font-bold">{inspectedStudent.level}</span> •
                    Stream:{" "}
                    <span className="text-white">{inspectedStudent.stream || "Stream A"}</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-zinc-500">Bound Institution</p>
                  <p className="text-sm font-bold mt-1 text-white">
                    {inspectedStudent.school_name || org?.name || "NCDC Boarding School"}
                  </p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-zinc-500">
                    Institutional School ID
                  </p>
                  <p className="text-sm font-mono font-bold mt-1 text-blue-400">
                    {currentOrgId || "SCH-UG-2026"}
                  </p>
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
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
    >
      <Icon className={`h-4 w-4 ${active ? "text-white" : "text-muted-foreground"}`} />
      {label}
    </button>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  color = "text-foreground",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend: string;
  color?: string;
}) {
  return (
    <Card className="border-border bg-card/60 backdrop-blur-xl group hover:border-blue-600/30 transition-all">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all text-muted-foreground">
            <Icon className="h-5 w-5" />
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground/70" />
        </div>
        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-1">
          {label}
        </p>
        <h3 className={`text-2xl font-black ${color}`}>{value}</h3>
        <p className="text-[10px] text-muted-foreground/60 mt-2 font-medium">{trend}</p>
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
        <span className="text-muted-foreground">
          {count} Learners ({percentage}%)
        </span>
      </div>
      <Progress value={percentage} className={`h-1.5 bg-muted ${color}`} />
    </div>
  );
}
