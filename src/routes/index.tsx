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
} from "lucide-react";
import { SubjectCard } from "@/components/SubjectCard";
import { TermGoalGauge } from "@/components/TermGoalGauge";
import { BRAND } from "@/lib/constants";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useTutor } from "@/lib/TutorService";
import { buildGreeting, fetchWeatherSummary } from "@/lib/greetings";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/offline-db";
import { markGreeted, shouldGreet } from "@/lib/tutor-context";
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

export const Route = createFileRoute("/")({
  head: () => {
    const meta = generateMetaTags({
      title: "Latty's Cymatic Hub - Interactive Study Companion for Uganda Curriculum",
      description:
        "Elevate your learning with Latty's Cymatic Hub. Interactive study tools, notes, and quizzes for Mathematics, Physics, Chemistry, and Biology (Senior 1–4, Uganda New Curriculum).",
      canonicalUrl: "https://hub.cymatichub.xyz/",
      ogImage: "https://hub.cymatichub.xyz/og-home.jpg",
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
      name: "Latty's Cymatic Hub",
      description:
        "Interactive study companion for Uganda Secondary Curriculum with notes, quizzes, and tools for Math, Physics, Chemistry, and Biology.",
    });
    return {
      meta,
      links: [getCanonicalLink("https://hub.cymatichub.xyz/")],
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

const subjects = [
  {
    title: "Mathematics",
    description: "Algebra, geometry, trig & statistics with interactive calculators.",
    icon: Calculator,
    gradient: "math" as const,
    category: "math" as const,
  },
  {
    title: "Physics",
    description: "Forces, motion, electricity, waves and the laws of nature.",
    icon: Zap,
    gradient: "physics" as const,
    category: "physics" as const,
  },
  {
    title: "Chemistry",
    description: "Atoms, bonding, reactions and organic chemistry made clear.",
    icon: Atom,
    gradient: "chemistry" as const,
    category: "chemistry" as const,
  },
  {
    title: "Biology",
    description: "Cells, human systems, ecology and the science of life.",
    icon: Leaf,
    gradient: "biology" as const,
    category: "biology" as const,
  },
  {
    title: "Geography",
    description: "Map reading, weather, landforms, and world economic systems.",
    icon: Compass,
    gradient: "geography" as const,
    category: "geography" as const,
  },
  {
    title: "History",
    description: "East African, West African, South African and European world history.",
    icon: Landmark,
    gradient: "history" as const,
    category: "history" as const,
  },
  {
    title: "English Language",
    description: "Grammar, written correspondence, creative writing, and rhetorics.",
    icon: BookOpen,
    gradient: "english" as const,
    category: "english" as const,
  },
  {
    title: "Entrepreneurship",
    description: "Business ideas, bookkeeping, taxation, strategic plans, and auditing.",
    icon: Briefcase,
    gradient: "entrepreneurship" as const,
    category: "entrepreneurship" as const,
  },
];

const features = [
  {
    icon: FlaskConical,
    title: "Uganda Curriculum",
    desc: "Aligned with the UNEB Senior 1–4 syllabus, end-to-end.",
  },
  {
    icon: Wand2,
    title: "Your Live Tutor",
    desc: "Ask anything. Adams or Hawa explains it with heart.",
  },
  {
    icon: BookOpen,
    title: "Offline-friendly Notes",
    desc: "Saved lessons stay readable even without internet.",
  },
];

function HomePage() {
  const { persona, speak } = useTutor();
  const { user } = useAuth();
  const [todayPoints, setTodayPoints] = useState(0);
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

  const filteredSubjects =
    categoryFilter === "all" ? subjects : subjects.filter((s) => s.category === categoryFilter);

  useEffect(() => {
    if (!user) {
      setTodayPoints(0);
      return;
    }
    let cancelled = false;
    (async () => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      let total = 0;
      try {
        const { data } = await supabase
          .from("user_points")
          .select("points, created_at")
          .eq("user_id", user.id)
          .gte("created_at", startOfDay.toISOString());
        total = (data ?? []).reduce((s, r) => s + (r.points ?? 0), 0);
      } catch (err) {
        console.warn("Operation failed", err);
      }
      try {
        const local = await db.points.where("user_id").equals(user.id).toArray();
        const localToday = local
          .filter((p) => p.synced === 0 && new Date(p.created_at) >= startOfDay)
          .reduce((s, p) => s + p.points, 0);
        total += localToday;
      } catch (err) {
        console.warn("Operation failed", err);
      }
      if (!cancelled) setTodayPoints(total);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

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

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-12 md:py-20">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full opacity-25 blur-3xl animate-float"
              style={{
                width: `${180 + i * 60}px`,
                height: `${180 + i * 60}px`,
                top: `${5 + i * 18}%`,
                left: `${(i * 23) % 90}%`,
                background: i % 2 === 0 ? "var(--gradient-math)" : "var(--gradient-biology)",
                animationDelay: `${i * 0.6}s`,
              }}
            />
          ))}
        </div>

        <div className="relative mx-auto max-w-4xl">
          <div className="glass rounded-3xl p-8 md:p-12 text-center border border-border/40 shadow-card backdrop-blur-md animate-fade-in-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              New Lower Secondary · Uganda {BRAND.flag}
            </div>

            <h1 className="mb-4 text-4xl font-extrabold leading-[1.1] tracking-tight md:text-6xl lg:text-7xl">
              <span className="bg-gradient-hero bg-clip-text text-transparent">Cymatic Hub</span>
            </h1>

            <p className="mx-auto mb-4 max-w-2xl text-base text-muted-foreground md:text-lg font-medium leading-relaxed">
              An interactive study companion built for the Uganda Secondary Curriculum. Access
              notes, quizzes, projects, and advanced learning tools for Mathematics, Physics,
              Chemistry, and Biology.
            </p>

            <p className="mb-10 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground/60">
              {BRAND.name} × {BRAND.partner} · {BRAND.tagline} {BRAND.flag}
            </p>

            {/* Three CTAs */}
            <div className="grid gap-3 sm:grid-cols-3">
              <Link
                to="/lessons"
                className="group flex items-center justify-between gap-3 rounded-2xl bg-primary px-5 py-4 text-left text-sm font-semibold text-primary-foreground shadow-glow transition-smooth hover:scale-[1.03]"
              >
                <span className="flex items-center gap-2.5">
                  <BookOpen className="h-5 w-5" />
                  Explore Lessons
                </span>
                <ArrowRight className="h-4 w-4 transition-smooth group-hover:translate-x-1" />
              </Link>
              <Link
                to="/quizzes"
                className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-4 text-left text-sm font-semibold text-foreground transition-smooth hover:scale-[1.03] hover:bg-card/70"
              >
                <span className="flex items-center gap-2.5">
                  <Lightbulb className="h-5 w-5 text-secondary" />
                  Take Quizzes
                </span>
                <ArrowRight className="h-4 w-4 transition-smooth group-hover:translate-x-1" />
              </Link>
              <Link
                to="/tools"
                className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-4 text-left text-sm font-semibold text-foreground transition-smooth hover:scale-[1.03] hover:bg-card/70"
              >
                <span className="flex items-center gap-2.5">
                  <Calculator className="h-5 w-5 text-accent" />
                  Explore Tools
                </span>
                <ArrowRight className="h-4 w-4 transition-smooth group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Combined NCDC Subjects Accordion & Horizontal Carousel */}
      <section
        className="mx-auto max-w-6xl px-4 pb-12 animate-fade-in-up"
        style={{ animationDelay: "150ms" }}
      >
        <Accordion type="single" defaultValue="curriculum-subjects" collapsible className="w-full">
          <AccordionItem value="curriculum-subjects" className="border-none">
            <div className="glass rounded-3xl p-6 sm:p-8 border border-white/10 bg-white/5 backdrop-blur-md shadow-xl">
              <AccordionTrigger className="hover:no-underline py-0 text-left flex items-center justify-between w-full">
                <div className="flex flex-col gap-1 pr-4">
                  <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400 w-fit">
                    <GraduationCap className="h-3.5 w-3.5" />
                    Lower Secondary &amp; A-Level Curriculum
                  </span>
                  <h2 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl mt-1">
                    NCDC Interactive Subjects
                  </h2>
                  <p className="text-sm text-zinc-400">
                    Senior 1 to Senior 6 — Scroll aside to launch syllabus-mapped topics, notes, and
                    worksheets
                  </p>
                </div>
              </AccordionTrigger>

              <AccordionContent className="pt-8">
                {/* Category Filter and Scroll Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[200px] bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectItem value="all">All NCDC Subjects</SelectItem>
                      <SelectItem value="math">Mathematics</SelectItem>
                      <SelectItem value="physics">Physics</SelectItem>
                      <SelectItem value="chemistry">Chemistry</SelectItem>
                      <SelectItem value="biology">Biology</SelectItem>
                      <SelectItem value="geography">Geography</SelectItem>
                      <SelectItem value="history">History</SelectItem>
                      <SelectItem value="english">English Language</SelectItem>
                      <SelectItem value="entrepreneurship">Entrepreneurship</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Slider controls */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        scroll("left");
                      }}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white transition-smooth"
                      title="Scroll Left"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        scroll("right");
                      }}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white transition-smooth"
                      title="Scroll Right"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Horizontal Scrolling Carousel with Framer Motion */}
                <div className="relative">
                  <div
                    ref={carouselRef}
                    className="flex overflow-x-auto gap-6 pb-4 px-1 scrollbar-none snap-x snap-mandatory scroll-smooth"
                    style={{ WebkitOverflowScrolling: "touch" }}
                  >
                    {filteredSubjects.map((s, i) => (
                      <motion.div
                        key={s.title}
                        layout
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.05 }}
                        className="w-[280px] sm:w-[320px] shrink-0 snap-start"
                      >
                        <SubjectCard subject={s} delay={i * 50} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </div>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Term goal + projects teaser */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="glass animate-fade-in-up rounded-2xl p-6 shadow-card md:col-span-1">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Term Goal
            </p>
            <h3 className="mb-4 text-lg font-bold text-foreground">100-point challenge</h3>
            <TermGoalGauge value={todayPoints} />
            <p className="mt-3 text-xs text-muted-foreground">
              Pass quizzes (≥70%) to earn points. Adams &amp; Hawa cheer you on every day.
            </p>
          </div>

          <Link
            to="/projects"
            className="group glass animate-fade-in-up overflow-hidden rounded-2xl p-6 shadow-card transition-smooth hover:-translate-y-1 hover:shadow-glow md:col-span-2"
            style={{ animationDelay: "120ms" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent">
                  <GraduationCap className="h-3.5 w-3.5" />
                  Practical Project Work
                </div>
                <h3 className="mb-2 text-xl font-bold text-foreground">
                  Build, measure, observe — 7 hands-on projects per subject, per class.
                </h3>
                <p className="text-sm text-muted-foreground">
                  Real-world tasks with clear objectives, materials, steps and a marking guide. Work
                  alone or in your study group.
                </p>
              </div>
              <ArrowRight className="hidden h-5 w-5 shrink-0 text-primary transition-smooth group-hover:translate-x-1 sm:block" />
            </div>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/60 bg-card/30 px-4 py-16">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="flex animate-fade-in-up gap-4"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
