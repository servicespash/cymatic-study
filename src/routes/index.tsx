import { createFileRoute, Link } from "@tanstack/react-router";
import { generateMetaTags, getCanonicalLink, getWebPageSchema } from "@/lib/seo";
import {
  ArrowRight,
  Atom,
  BookOpen,
  Calculator,
  FlaskConical,
  GraduationCap,
  Lightbulb,
  Leaf,
  Sparkles,
  Wand2,
  Zap,
  Compass,
  Landmark,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Activity,
  Target,
} from "lucide-react";
import { TermGoalGauge } from "@/components/TermGoalGauge";
import { BRAND } from "@/lib/constants";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTutor } from "@/lib/TutorService";
import { buildGreeting, fetchWeatherSummary } from "@/lib/greetings";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/offline-db";
import { markGreeted, shouldGreet } from "@/lib/tutor-context";
import { useGamificationStore } from "@/store/useGamificationStore";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AmbientSoundscapePlayer } from "@/components/AmbientSoundscapePlayer";
import { CentralizedSciencesHero } from "@/components/dashboard/CentralizedSciencesHero";

export const Route = createFileRoute("/")({
  head: () => {
    const meta = generateMetaTags({
      title: "Latty's Cymatic Study - Interactive Study Companion for Uganda Curriculum",
      description:
        "Elevate your learning with Latty's Cymatic Study. Interactive study tools, notes, and quizzes for Mathematics, Physics, Chemistry, and Biology (Senior 1–4, Uganda New Curriculum).",
      canonicalUrl: "https://study.cymatichub.xyz/",
      ogImage: "https://study.cymatichub.xyz/og-home.jpg",
      keywords: [
        "Uganda curriculum",
        "secondary school",
        "physics",
        "chemistry",
        "mathematics",
        "biology",
        "study notes",
        "quizzes",
      ],
    });
    const schema = getWebPageSchema({
      name: "Latty's Cymatic Study",
      description:
        "Interactive study companion for Uganda Secondary Curriculum with notes, quizzes, and tools for Math, Physics, Chemistry, and Biology.",
    });
    return {
      meta,
      links: [getCanonicalLink("https://study.cymatichub.xyz/")],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(schema),
        },
      ],
    };
  },
  component: HomePage,
});

const features = [
  {
    icon: FlaskConical,
    title: "Uganda & Intl Curriculum",
    desc: "Syllabus aligned for Senior 1–4 (O-Level) & Senior 5–6 (A-Level).",
  },
  {
    icon: Wand2,
    title: "Your AI Study Buddies",
    desc: "Adams and Hawa are ready to coach and cheer you on daily.",
  },
  {
    icon: BookOpen,
    title: "Offline-First Study Notes",
    desc: "Access your lessons anywhere, anytime even without internet.",
  },
];

type GoalPeriod = "daily" | "weekly" | "term";

export function HomePage() {
  const { persona, speak } = useTutor();
  const { user, isAdmin, isTeacher, role, schoolName } = useAuth();

  // Points logic
  const [todayPoints, setTodayPoints] = useState(0);
  const [weeklyPoints, setWeeklyPoints] = useState(0);
  const [termPoints, setTermPoints] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState<GoalPeriod>("term");

  // Fetch real points from online & offline local DB
  useEffect(() => {
    if (!user) {
      const store = useGamificationStore.getState();
      const xp = store.xp || 0;
      const completed = store.completedTasks || [];
      const now = new Date();
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const startOfWeek = new Date();
      startOfWeek.setDate(now.getDate() - 7);
      startOfWeek.setHours(0, 0, 0, 0);

      const todayTasks = completed.filter((t) => new Date(t.date) >= startOfDay).length * 10;
      const weeklyTasks = completed.filter((t) => new Date(t.date) >= startOfWeek).length * 10;
      const termTasks = completed.length * 10;

      setTodayPoints(Math.min(20, Math.max(todayTasks, xp > 0 ? Math.min(20, xp) : 0)));
      setWeeklyPoints(Math.min(50, Math.max(weeklyTasks, xp > 0 ? Math.min(50, xp) : 0)));
      setTermPoints(Math.min(100, Math.max(termTasks, xp > 0 ? Math.min(100, xp) : 0)));
      return;
    }
    let cancelled = false;
    (async () => {
      const now = new Date();

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const startOfWeek = new Date();
      startOfWeek.setDate(now.getDate() - 7);
      startOfWeek.setHours(0, 0, 0, 0);

      const startOfTerm = new Date();
      startOfTerm.setDate(now.getDate() - 90);
      startOfTerm.setHours(0, 0, 0, 0);

      let remotePoints: any[] = [];
      try {
        const { data } = await supabase
          .from("user_points")
          .select("points, created_at")
          .eq("user_id", user.id)
          .gte("created_at", startOfTerm.toISOString());
        remotePoints = data ?? [];
      } catch (err) {
        console.warn("Could not load remote points", err);
      }

      let localPoints: any[] = [];
      try {
        localPoints = await db.points.where("user_id").equals(user.id).toArray();
      } catch (err) {
        console.warn("Could not load local points", err);
      }

      // Compute aggregates
      const remoteToday = remotePoints
        .filter((r) => new Date(r.created_at) >= startOfDay)
        .reduce((sum, r) => sum + (r.points ?? 0), 0);
      const localToday = localPoints
        .filter((p) => new Date(p.created_at) >= startOfDay)
        .reduce((sum, p) => sum + p.points, 0);

      const remoteWeekly = remotePoints
        .filter((r) => new Date(r.created_at) >= startOfWeek)
        .reduce((sum, r) => sum + (r.points ?? 0), 0);
      const localWeekly = localPoints
        .filter((p) => new Date(p.created_at) >= startOfWeek)
        .reduce((sum, p) => sum + p.points, 0);

      const remoteTerm = remotePoints.reduce((sum, r) => sum + (r.points ?? 0), 0);
      const localTerm = localPoints
        .filter((p) => new Date(p.created_at) >= startOfTerm)
        .reduce((sum, p) => sum + p.points, 0);

      if (!cancelled) {
        setTodayPoints(remoteToday + localToday);
        setWeeklyPoints(remoteWeekly + localWeekly);
        setTermPoints(remoteTerm + localTerm);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Handle live greeting on entry
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!shouldGreet()) return;
      let name: string | undefined;
      let ad: string | undefined;
      try {
        if (user) {
          const { data: p } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("user_id", user.id)
            .maybeSingle();
          name = p?.display_name ?? undefined;
        }
        const { data: ads } = await supabase
          .from("news_broadcasts")
          .select("title")
          .eq("is_active", true)
          .eq("is_ad", true)
          .order("published_at", { ascending: false })
          .limit(1);
        if (ads && ads[0]) ad = ads[0].title;
      } catch (err) {
        console.warn("Operation failed", err);
      }
      const weather = await fetchWeatherSummary();
      if (cancelled) return;
      const text = await buildGreeting(persona, {
        name,
        weather: weather ?? undefined,
        ad,
        role: role,
        schoolName: schoolName,
      });
      void speak(text, { force: true });
      markGreeted();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Determine current gauge value and limit based on challenge period
  const activePointsValue =
    selectedGoal === "daily" ? todayPoints : selectedGoal === "weekly" ? weeklyPoints : termPoints;
  const activeGoalMax = selectedGoal === "daily" ? 20 : selectedGoal === "weekly" ? 50 : 100;

  return (
    <div className="w-full px-3 sm:px-6 lg:px-8 space-y-6 pb-16">
      {/* ROLE-SPECIFIC COMMAND & WORKSPACE BAR */}
      {isAdmin && (
        <section className="pt-2">
          <div className="rounded-3xl border border-blue-500/30 bg-blue-500/10 p-6 sm:p-8 backdrop-blur-md shadow-lg">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center md:text-left">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white uppercase tracking-wider">
                  <Landmark className="w-3.5 h-3.5" />
                  Institutional Administrator Node
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                  Welcome, Administrator{" "}
                  {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Admin"}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Your campus command center is active. Oversee department analytics, staff
                  credentials, and institutional rosters.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/admin/dashboard"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md"
                >
                  <Landmark className="w-4 h-4" />
                  Admin Console
                </Link>
                <Link
                  to="/teacher"
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary/80 hover:bg-secondary text-secondary-foreground text-xs font-bold transition-all border border-border"
                >
                  Teacher Station
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {isTeacher && !isAdmin && (
        <section className="pt-6">
          <div className="rounded-3xl border border-teal-500/30 bg-teal-500/10 p-6 sm:p-8 backdrop-blur-md shadow-lg">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center md:text-left">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-600 text-white uppercase tracking-wider">
                  <Briefcase className="w-3.5 h-3.5" />
                  Faculty &amp; Assessment Workspace
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                  Welcome, Teacher{" "}
                  {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Faculty"}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Manage student grading, grading queues, and curriculum performance insights.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/teacher"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-md"
                >
                  <Briefcase className="w-4 h-4" />
                  Teacher Station
                </Link>
                <Link
                  to="/marking"
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary/80 hover:bg-secondary text-secondary-foreground text-xs font-bold transition-all border border-border"
                >
                  Marking Desk
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Centralized Clean Landing Hero */}
      <CentralizedSciencesHero />

      {/* Upgraded 100-Point Challenge Card & Practical Work Projects Teaser */}
      <section className="w-full">
        <div className="grid gap-5 md:grid-cols-3">
          {/* Challenge Card - Connected to Dashboard & Filterable Dropdown */}
          <div className="glass animate-fade-in-up rounded-2xl border border-border bg-card p-6 shadow-card md:col-span-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-1.5">
                  <Trophy className="h-4 w-4 text-secondary" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Active Study Goal
                  </span>
                </div>

                {/* Period filter dropdown */}
                <div onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={selectedGoal}
                    onValueChange={(val) => setSelectedGoal(val as GoalPeriod)}
                  >
                    <SelectTrigger className="h-7 w-[110px] text-[10px] font-bold uppercase bg-muted/60 border-border rounded-lg px-2 text-foreground">
                      <SelectValue placeholder="Period" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-popover-foreground text-xs font-bold">
                      <SelectItem value="daily">Daily Goal</SelectItem>
                      <SelectItem value="weekly">Weekly Goal</SelectItem>
                      <SelectItem value="term">Term Goal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <h3 className="text-base font-black tracking-tight text-foreground mb-4">
                {selectedGoal === "daily" && "Daily 20-Point Quest"}
                {selectedGoal === "weekly" && "Weekly 50-Point Sprint"}
                {selectedGoal === "term" && "Term 100-Point Challenge"}
              </h3>

              <div className="flex justify-center py-2">
                <TermGoalGauge value={activePointsValue} max={activeGoalMax} />
              </div>
            </div>

            <div className="mt-4 border-t border-border/50 pt-4">
              <p className="text-[11px] leading-relaxed text-muted-foreground mb-3">
                {selectedGoal === "daily" &&
                  "Earn 20 points today by completing quizzes and scoring over 70%."}
                {selectedGoal === "weekly" &&
                  "Consistency pays off! Hit 50 points this week to unlock study badges."}
                {selectedGoal === "term" &&
                  "Build long-term success. Master subjects and complete term goals."}
              </p>

              <Link
                to="/dashboard"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-xs font-bold text-primary py-2.5 transition-all"
              >
                <Activity className="h-3.5 w-3.5" />
                {user
                  ? isAdmin
                    ? "Institutional Command"
                    : isTeacher
                      ? "Teacher Dashboard"
                      : "Student Dashboard"
                  : "Go to Student Dashboard"}
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Practical Projects Teaser */}
          <Link
            to="/projects"
            className="group glass animate-fade-in-up overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-md md:col-span-2 flex flex-col justify-between"
            style={{ animationDelay: "100ms" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-3.5 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-accent">
                  <GraduationCap className="h-3.5 w-3.5" />
                  Practical Project Work
                </div>
                <h3 className="mb-3.5 text-xl font-black text-foreground tracking-tight leading-snug">
                  Build, measure, observe — Hands-on projects mapping both O-Level &amp; A-Level
                  subjects.
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Real-world tasks with detailed objective outlines, required materials, methodology
                  instructions, and a precise marking guide. Work at your own pace or collaborate in
                  group studies.
                </p>
              </div>
              <ArrowRight className="hidden h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-x-1.5 sm:block" />
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs font-bold text-primary group-hover:underline">
              Explore hands-on curriculum projects
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>
        </div>
      </section>

      {/* Trust Highlights & Features */}
      <section className="border-t border-border bg-card/10 px-4 py-12">
        <div className="w-full grid gap-8 md:grid-cols-3">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="flex animate-fade-in-up gap-4"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/10">
                <f.icon className="h-5.5 w-5.5" />
              </div>
              <div>
                <h3 className="mb-1 text-sm font-bold text-foreground">{f.title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
