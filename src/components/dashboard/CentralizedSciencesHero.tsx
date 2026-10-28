import { Link } from "@tanstack/react-router";
import { BookOpen, Sparkles, ArrowRight, Calculator, Lightbulb } from "lucide-react";
import { BRAND } from "@/lib/constants";

export function CentralizedSciencesHero() {
  return (
    <section className="w-full py-2">
      <div className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 bg-gradient-to-br from-card/95 via-card/80 to-background p-5 sm:p-8 md:p-12 shadow-xl backdrop-blur-2xl">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-[32rem] h-[32rem] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-[32rem] h-[32rem] bg-accent/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full space-y-4 sm:space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/15 px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-widest text-primary shadow-sm">
            <Sparkles className="h-4 w-4" />
            Comprehensive Academic Curriculum · Uganda {BRAND.flag}
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-6xl font-black leading-tight tracking-tight text-foreground w-full">
            <span className="bg-gradient-to-r from-primary via-cyan-400 to-accent bg-clip-text text-transparent">
              Cymatic Study
            </span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-muted-foreground font-medium leading-relaxed w-full">
            An interactive learning companion customized for both Lower Secondary (Senior 1–4) and
            Advanced Level (Senior 5–6) Uganda curricula. Track your study goals, practice quizzes,
            and explore comprehensive notes across disciplines.
          </p>

          <p className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-muted-foreground/90 w-full">
            {BRAND.name} × {BRAND.partner} · {BRAND.tagline} {BRAND.flag}
          </p>

          {/* Main CTAs - edge-to-edge responsive grid without centering drift */}
          <div className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pt-2">
            <Link
              to="/lessons"
              className="group flex w-full items-center justify-between gap-3 rounded-xl sm:rounded-2xl bg-primary px-5 py-4 sm:px-6 sm:py-5 text-left text-sm font-bold text-primary-foreground shadow-lg transition-all hover:scale-[1.01]"
            >
              <span className="flex items-center gap-2.5">
                <BookOpen className="h-5 w-5 shrink-0" />
                <span>Explore Lessons</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              to="/quizzes"
              className="group flex w-full items-center justify-between gap-3 rounded-xl sm:rounded-2xl border border-border bg-card px-5 py-4 sm:px-6 sm:py-5 text-left text-sm font-bold text-foreground transition-all hover:scale-[1.01] hover:bg-muted/40 shadow-sm"
            >
              <span className="flex items-center gap-2.5">
                <Lightbulb className="h-5 w-5 shrink-0 text-secondary" />
                <span>Take Quizzes</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              to="/tools"
              className="group flex w-full items-center justify-between gap-3 rounded-xl sm:rounded-2xl border border-border bg-card px-5 py-4 sm:px-6 sm:py-5 text-left text-sm font-bold text-foreground transition-all hover:scale-[1.01] hover:bg-muted/40 shadow-sm sm:col-span-2 lg:col-span-1"
            >
              <span className="flex items-center gap-2.5">
                <Calculator className="h-5 w-5 shrink-0 text-accent" />
                <span>Study Tools</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CentralizedSciencesHero;
