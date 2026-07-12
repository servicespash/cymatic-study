import type { LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

type Subject = {
  title: string;
  description: string;
  icon: any;
  gradient: string;
  category: string;
};

const gradientMap: Record<string, string> = {
  math: "bg-gradient-math",
  physics: "bg-gradient-physics",
  chemistry: "bg-gradient-chemistry",
  biology: "bg-gradient-biology",
  geography: "bg-gradient-to-r from-emerald-500 to-teal-500",
  history: "bg-gradient-to-r from-amber-600 to-orange-500",
  english: "bg-gradient-to-r from-purple-500 to-pink-500",
  entrepreneurship: "bg-gradient-to-r from-blue-500 to-cyan-500",
};

export function SubjectCard({ subject, delay = 0 }: { subject: Subject; delay?: number }) {
  const Icon = subject.icon;
  return (
    <Link
      to="/quizzes/$subject"
      params={{ subject: subject.category }}
      style={{ animationDelay: `${delay}ms` }}
      className="group relative animate-fade-in-up overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-card transition-smooth hover:-translate-y-1 hover:shadow-glow"
    >
      <div
        className={`absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-25 blur-2xl transition-smooth group-hover:opacity-50 ${gradientMap[subject.gradient]}`}
        aria-hidden
      />
      <div
        className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ${gradientMap[subject.gradient]} shadow-soft`}
      >
        <Icon className="h-6 w-6 text-primary-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-bold text-foreground">{subject.title}</h3>
      <p className="mb-4 text-sm text-muted-foreground">{subject.description}</p>
      <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
        Start quizzes
        <ArrowRight className="h-4 w-4 transition-smooth group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
