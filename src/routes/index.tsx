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
import { SubjectCard } from "@/components/SubjectCard";
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
import { ProgressVisualization } from "@/components/ProgressVisualization";
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
import { curriculumSubjects, CurriculumSubject } from "@/data/curriculumSubjects";

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
  const { user, isAdmin, isTeacher } = useAuth();

  // Points logic
  const [todayPoints, setTodayPoints] = useState(0);
  const [weeklyPoints, setWeeklyPoints] = useState(0);
  const [termPoints, setTermPoints] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState<GoalPeriod>("term");

  // Tab configuration for O-Level vs A-Level arrangement
  const [curriculumTab, setCurriculumTab] = useState<"all" | "alevel" | "olevel">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const carouselRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const { scrollLeft, clientWidth } = carouselRef.current;
      const scrollAmount = clientWidth * 0.75;
      carouselRef.current.scrollTo({
        left: direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Filter and arrange subjects
  const filteredSubjects = curriculumSubjects.filter((subj) => {
    // 1. Level Filter
    if (curriculumTab === "alevel" && subj.level !== "Senior 5–6 (A-Level)") return false;
    if (curriculumTab === "olevel" && subj.level !== "Senior 1–4 (O-Level)") return false;

    // 2. Category Filter
    if (categoryFilter !== "all" && subj.category !== categoryFilter) return false;

    return true;
  });

  // Sort logically: Compulsory first, then Selectables/Optionals
  const arrangedSubjects = [...filteredSubjects].sort((a, b) => {
    // Keep A-Level arranged above O-Level in the "all" view
    if (curriculumTab === "all") {
      if (a.level !== b.level) {
        return a.level.includes("A-Level") ? -1 : 1;
      }
    }
    // Sort by compulsory status
    if (a.type === "Compulsory" && b.type !== "Compulsory") return -1;
    if (a.type !== "Compulsory" && b.type === "Compulsory") return 1;
    return a.title.localeCompare(b.title);
  });

  // Fetch real points from online & offline local DB
  useEffect(() => {
    if (!user) {
      setTodayPoints(0);
      setWeeklyPoints(0);
      setTermPoints(0);
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
      const text = await buildGreeting(persona, { name, weather: weather ?? undefined, ad });
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
    <div className="space-y-8 pb-12">
      {/* Hero Header */}
      <section className="relative overflow-hidden px-4 py-12 md:py-16">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full opacity-20 blur-3xl animate-float"
              style={{
                width: `${200 + i * 80}px`,
                height: `${200 + i * 80}px`,
                top: `${10 + i * 20}%`,
                left: `${15 + i * 30}%`,
                background: i % 2 === 0 ? "var(--primary)" : "var(--accent)",
                animationDelay: `${i * 0.8}s`,
              }}
            />
          ))}
        </div>

        <div className="relative mx-auto max-w-4xl">
          <div className="glass rounded-3xl border border-border bg-card/60 p-8 md:p-12 text-center shadow-card backdrop-blur-md animate-fade-in-up">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Comprehensive Academic Curriculum · Uganda {BRAND.flag}
            </div>

            <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight md:text-6xl text-foreground">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Cymatic Study
              </span>
            </h1>

            <p className="mx-auto mb-6 max-w-2xl text-base text-muted-foreground md:text-lg font-medium leading-relaxed">
              An interactive learning companion customized for both Lower Secondary (Senior 1–4) and
              Advanced Level (Senior 5–6) Uganda curricula. Track your goals, practice quizzes, and
              earn rewards!
            </p>

            <p className="mb-8 text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground/80">
              {BRAND.name} × {BRAND.partner} · {BRAND.tagline} {BRAND.flag}
            </p>

            {/* Main CTAs */}
            <div className="grid gap-3 sm:grid-cols-3">
              <Link
                to="/lessons"
                className="group flex items-center justify-between gap-3 rounded-2xl bg-primary px-5 py-4 text-left text-sm font-bold text-primary-foreground shadow-glow transition-all hover:scale-[1.02]"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Explore Lessons
                </span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/quizzes"
                className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-4 text-left text-sm font-bold text-foreground transition-all hover:scale-[1.02] hover:bg-muted/40"
              >
                <span className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-secondary" />
                  Take Quizzes
                </span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/tools"
                className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-4 text-left text-sm font-bold text-foreground transition-all hover:scale-[1.02] hover:bg-muted/40"
              >
                <span className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-accent" />
                  Study Tools
                </span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Personalized Performance Dashboard (Only for logged-in students) */}
      {user && !isTeacher && !isAdmin && (
        <section className="mx-auto max-w-6xl px-4 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <Target className="h-3 w-3 text-cyan-400" />
              Your Live Syllabus Coverage
            </h2>
            <Link to="/dashboard" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
              View Analytics
            </Link>
          </div>
          <ProgressVisualization />
        </section>
      )}

      {/* Upgraded NCDC Subjects Section with Perfect Adaptive Contrast */}
      <section
        className="mx-auto max-w-6xl px-4 animate-fade-in-up"
        style={{ animationDelay: "100ms" }}
      >
        <Accordion type="single" defaultValue="curriculum-subjects" collapsible className="w-full">
          <AccordionItem value="curriculum-subjects" className="border-none">
            <div className="rounded-3xl border border-border bg-card/45 p-6 sm:p-8 shadow-card backdrop-blur-md">
              <AccordionTrigger className="hover:no-underline py-0 text-left flex items-center justify-between w-full">
                <div className="flex flex-col gap-1 pr-4">
                  <span className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary w-fit">
                    <GraduationCap className="h-3.5 w-3.5" />
                    NCDC Approved Curriculum &amp; General Subjects
                  </span>
                  <h2 className="text-2xl font-black tracking-tight text-foreground md:text-3xl mt-1">
                    Uganda National Curriculum Subjects
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Senior 1 to Senior 6 — Swipe or scroll through the compact interactive subject
                    cards below
                  </p>
                </div>
              </AccordionTrigger>

              <AccordionContent className="pt-6">
                {/* Curriculum Level Toggle & Filters */}
                <div className="flex flex-col gap-4 border-t border-border/60 pt-6 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setCurriculumTab("all")}
                      className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                        curriculumTab === "all"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      All Subjects ({curriculumSubjects.length})
                    </button>
                    <button
                      onClick={() => setCurriculumTab("alevel")}
                      className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                        curriculumTab === "alevel"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      Senior 5 &amp; Senior 6 (A-Level)
                    </button>
                    <button
                      onClick={() => setCurriculumTab("olevel")}
                      className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                        curriculumTab === "olevel"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      Senior 1 to Senior 4 (O-Level)
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-[180px] rounded-xl border border-border bg-card text-foreground">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border text-popover-foreground">
                        <SelectItem value="all">All Fields</SelectItem>
                        <SelectItem value="math">Mathematics</SelectItem>
                        <SelectItem value="physics">Physics</SelectItem>
                        <SelectItem value="chemistry">Chemistry</SelectItem>
                        <SelectItem value="biology">Biology</SelectItem>
                        <SelectItem value="geography">Geography</SelectItem>
                        <SelectItem value="history">History</SelectItem>
                        <SelectItem value="english">English &amp; Lit</SelectItem>
                        <SelectItem value="entrepreneurship">Business</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Carousel controls */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          scroll("left");
                        }}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
                        title="Scroll Left"
                      >
                        <ChevronLeft className="h-4.5 w-4.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          scroll("right");
                        }}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
                        title="Scroll Right"
                      >
                        <ChevronRight className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Horizontal Sliding Carousel of Small Compact Cards */}
                <div className="relative mt-6">
                  <div
                    ref={carouselRef}
                    className="flex overflow-x-auto gap-4 pb-4 px-1 scrollbar-none snap-x snap-mandatory scroll-smooth"
                    style={{ WebkitOverflowScrolling: "touch" }}
                  >
                    {arrangedSubjects.map((s, i) => (
                      <motion.div
                        key={s.title}
                        layout
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.03 }}
                        className="w-[240px] sm:w-[280px] shrink-0 snap-start"
                      >
                        <SubjectCard subject={s} delay={i * 30} />
                      </motion.div>
                    ))}
                    {arrangedSubjects.length === 0 && (
                      <div className="w-full py-12 text-center text-sm text-muted-foreground border border-dashed border-border rounded-2xl">
                        No subjects match the selected filters. Try another tab or category.
                      </div>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </div>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Upgraded 100-Point Challenge Card & Practical Work Projects Teaser */}
      <section className="mx-auto max-w-6xl px-4">
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
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
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
