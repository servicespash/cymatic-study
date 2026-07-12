import { useState, useEffect, useRef } from "react";
import { Search, BookOpen, GraduationCap, Calculator, X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { topics } from "@/data/topics";
import { quizQuestions } from "@/data/quizzes";
import { cn } from "@/lib/utils";

// Define the searchable items
type SearchResult = {
  id: string;
  title: string;
  type: "lesson" | "quiz" | "tool" | "project";
  category?: string;
  path: string;
};

const tools: SearchResult[] = [
  {
    id: "t1",
    title: "Pythagoras Calculator",
    type: "tool",
    category: "Mathematics",
    path: "/tools/math",
  },
  {
    id: "t2",
    title: "Quadratic Solver",
    type: "tool",
    category: "Mathematics",
    path: "/tools/math",
  },
  {
    id: "t3",
    title: "Trigonometry Calculator",
    type: "tool",
    category: "Mathematics",
    path: "/tools/math",
  },
  {
    id: "t4",
    title: "Matrix 3x3 Determinant",
    type: "tool",
    category: "Mathematics",
    path: "/tools/math",
  },
  {
    id: "t5",
    title: "Area & Perimeter Calculator",
    type: "tool",
    category: "Mathematics",
    path: "/tools/math",
  },
  {
    id: "t6",
    title: "SUVAT Kinematics",
    type: "tool",
    category: "Physics",
    path: "/tools/physics",
  },
  {
    id: "t7",
    title: "Density Calculator",
    type: "tool",
    category: "Physics",
    path: "/tools/physics",
  },
  {
    id: "t8",
    title: "Ohm's Law (V=IR)",
    type: "tool",
    category: "Physics",
    path: "/tools/physics",
  },
  {
    id: "t9",
    title: "Refraction (Snell's Law)",
    type: "tool",
    category: "Physics",
    path: "/tools/physics",
  },
  {
    id: "t10",
    title: "Momentum (p=mv)",
    type: "tool",
    category: "Physics",
    path: "/tools/physics",
  },
  {
    id: "t11",
    title: "Projectile Motion",
    type: "tool",
    category: "Physics",
    path: "/tools/physics",
  },
  {
    id: "t12",
    title: "Heat Energy (Q=mcΔθ)",
    type: "tool",
    category: "Physics",
    path: "/tools/physics",
  },
  {
    id: "t13",
    title: "Pressure Calculator",
    type: "tool",
    category: "Physics",
    path: "/tools/physics",
  },
  {
    id: "t14",
    title: "Wave Speed (v=fλ)",
    type: "tool",
    category: "Physics",
    path: "/tools/physics",
  },
  {
    id: "t15",
    title: "Periodic Table Reference",
    type: "tool",
    category: "Chemistry",
    path: "/tools/chemistry",
  },
  {
    id: "t16",
    title: "pH / pOH Calculator",
    type: "tool",
    category: "Chemistry",
    path: "/tools/chemistry",
  },
  {
    id: "t17",
    title: "Mole Concept (n=m/Mr)",
    type: "tool",
    category: "Chemistry",
    path: "/tools/chemistry",
  },
  {
    id: "t18",
    title: "Concentration (C=n/V)",
    type: "tool",
    category: "Chemistry",
    path: "/tools/chemistry",
  },
  {
    id: "t19",
    title: "Periodic Trends Reference",
    type: "tool",
    category: "Chemistry",
    path: "/tools/chemistry",
  },
  { id: "t20", title: "BMI Calculator", type: "tool", category: "Biology", path: "/tools/biology" },
  {
    id: "t21",
    title: "Heart Rate Zones",
    type: "tool",
    category: "Biology",
    path: "/tools/biology",
  },
  {
    id: "t22",
    title: "Magnification Calculator",
    type: "tool",
    category: "Biology",
    path: "/tools/biology",
  },
  { id: "t23", title: "Punnett Square", type: "tool", category: "Biology", path: "/tools/biology" },
  {
    id: "t24",
    title: "Water Potential",
    type: "tool",
    category: "Biology",
    path: "/tools/biology",
  },
  {
    id: "t25",
    title: "Quadrat Population Estimate",
    type: "tool",
    category: "Biology",
    path: "/tools/biology",
  },
];

const projects: SearchResult[] = [
  { id: "p1", title: "Practical Projects", type: "project", path: "/projects" },
];

export function SearchEngine() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const q = query.toLowerCase();

    // Search Lessons
    const lessonResults: SearchResult[] = topics
      .filter((t) => t.title.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q))
      .map((t) => ({
        id: t.id,
        title: `${t.title} (S.${t.level} ${t.subject.toUpperCase()})`,
        type: "lesson",
        category: t.subject,
        path: "/lessons", // For now, lesson routing is generic, could be improved
      }));

    // Search Quizzes (by unique topics that have quizzes)
    const uniqueTopicsWithQuizzes = Array.from(new Set(quizQuestions.map((q) => q.topicId)));
    const quizResults: SearchResult[] = topics
      .filter(
        (t) =>
          uniqueTopicsWithQuizzes.includes(t.id) &&
          (t.title.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q)),
      )
      .map((t) => ({
        id: `quiz-${t.id}`,
        title: `${t.title} Quiz`,
        type: "quiz",
        category: t.subject,
        path: `/quizzes/${t.subject}`,
      }));

    // Search Tools
    const toolResults = tools.filter(
      (t) => t.title.toLowerCase().includes(q) || t.category?.toLowerCase().includes(q),
    );

    // Search Projects
    const projectResults = projects.filter((p) => p.title.toLowerCase().includes(q));

    setResults([...lessonResults, ...quizResults, ...toolResults, ...projectResults].slice(0, 8));
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full mb-8" ref={containerRef}>
      <div className="group relative flex items-center rounded-2xl border border-border bg-card/50 px-4 py-3 shadow-sm transition-all focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5 backdrop-blur-sm">
        <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search lessons, quizzes, or tools..."
          className="flex-1 bg-transparent px-3 text-sm font-medium outline-none placeholder:text-muted-foreground/50"
        />
        {query && (
          <button onClick={() => setQuery("")} className="p-1 hover:text-primary transition-colors">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in slide-in-from-top-2">
          <div className="max-h-[400px] overflow-y-auto p-2">
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  navigate({ to: r.path as any });
                  setIsOpen(false);
                  setQuery("");
                }}
                className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-primary/5 transition-colors group"
              >
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg shadow-sm",
                    r.type === "lesson"
                      ? "bg-blue-500/10 text-blue-500"
                      : r.type === "quiz"
                        ? "bg-green-500/10 text-green-500"
                        : r.type === "tool"
                          ? "bg-purple-500/10 text-purple-500"
                          : "bg-orange-500/10 text-orange-500",
                  )}
                >
                  {r.type === "lesson" ? (
                    <BookOpen className="h-5 w-5" />
                  ) : r.type === "quiz" ? (
                    <GraduationCap className="h-5 w-5" />
                  ) : r.type === "tool" ? (
                    <Calculator className="h-5 w-5" />
                  ) : (
                    <GraduationCap className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 mb-0.5">
                    {r.type} {r.category ? `• ${r.category}` : ""}
                  </p>
                  <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                    {r.title}
                  </p>
                </div>
              </button>
            ))}
          </div>
          <div className="border-t border-border bg-muted/30 p-2 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Tip: Adams & Haawa recommend daily search.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
