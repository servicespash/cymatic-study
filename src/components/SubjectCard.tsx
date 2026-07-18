import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Star } from "lucide-react";

export interface SubjectType {
  title: string;
  description: string;
  icon: any;
  gradient: string;
  category: string;
  level?: string;
  type?: string;
  classRange?: string;
}

const gradientMap: Record<string, string> = {
  math: "from-indigo-500 to-blue-600 bg-gradient-to-br",
  physics: "from-amber-500 to-orange-600 bg-gradient-to-br",
  chemistry: "from-emerald-500 to-teal-600 bg-gradient-to-br",
  biology: "from-rose-500 to-pink-600 bg-gradient-to-br",
  geography: "from-cyan-500 to-blue-600 bg-gradient-to-br",
  history: "from-amber-600 to-yellow-600 bg-gradient-to-br",
  english: "from-purple-500 to-pink-500 bg-gradient-to-br",
  entrepreneurship: "from-teal-500 to-green-600 bg-gradient-to-br",
  ict: "from-slate-500 to-zinc-600 bg-gradient-to-br",
  economics: "from-violet-500 to-indigo-600 bg-gradient-to-br",
  divinity: "from-yellow-500 to-orange-500 bg-gradient-to-br",
  swahili: "from-orange-500 to-red-500 bg-gradient-to-br",
  luganda: "from-red-500 to-rose-600 bg-gradient-to-br",
  literature: "from-fuchsia-500 to-purple-600 bg-gradient-to-br",
  agriculture: "from-green-500 to-emerald-600 bg-gradient-to-br",
  art: "from-pink-500 to-purple-500 bg-gradient-to-br",
  cre: "from-sky-500 to-indigo-500 bg-gradient-to-br",
};

export function SubjectCard({ subject, delay = 0 }: { subject: SubjectType; delay?: number }) {
  const Icon = subject.icon;
  const gradClass = gradientMap[subject.gradient] || "from-zinc-500 to-zinc-600 bg-gradient-to-br";

  return (
    <Link
      to="/quizzes"
      search={{ subject: subject.category }}
      style={{ animationDelay: `${delay}ms` }}
      className="group relative flex h-[190px] flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-md dark:hover:shadow-primary/5"
    >
      {/* Background glow ball */}
      <div
        className={`absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-10 blur-xl transition-all duration-300 group-hover:scale-150 group-hover:opacity-20 ${gradClass}`}
        aria-hidden
      />

      <div>
        {/* Header Badges */}
        <div className="mb-2 flex items-center justify-between gap-1.5">
          <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary dark:bg-primary/20">
            {subject.classRange || "S.1 - S.6"}
          </span>
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[9px] font-bold ${
              subject.type === "Compulsory"
                ? "bg-amber-500/15 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                : "bg-teal-500/15 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400"
            }`}
          >
            {subject.type === "Compulsory" ? (
              <CheckCircle2 className="h-2 w-2" />
            ) : (
              <Star className="h-2 w-2" />
            )}
            {subject.type || "Selectable"}
          </span>
        </div>

        {/* Content Section */}
        <div className="flex gap-2.5">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${gradClass} shadow-sm text-white`}
          >
            <Icon className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="line-clamp-1 text-sm font-bold text-foreground transition-colors group-hover:text-primary">
              {subject.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-[11px] leading-normal text-muted-foreground">
              {subject.description}
            </p>
          </div>
        </div>
      </div>

      {/* Footer / CTA */}
      <div className="mt-2 flex items-center justify-between border-t border-border/40 pt-2 text-[11px] font-bold text-primary">
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
          {subject.level?.split(" ")[0] || "O-Level"}
        </span>
        <div className="inline-flex items-center gap-1 opacity-90 transition-all group-hover:gap-1.5 group-hover:opacity-100">
          Start quiz
          <ArrowRight className="h-3 w-3" />
        </div>
      </div>
    </Link>
  );
}
