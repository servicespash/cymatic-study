import { useState } from "react";
import {
  Search,
  ChevronDown,
  BookOpen,
  Filter,
  ArrowRight,
  X,
  Sparkles,
  Compass,
  Lock,
  Atom,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";

const scienceSubjectsList = [
  {
    id: "math",
    label: "Mathematics",
    icon: "📐",
    count: 24,
    desc: "Algebra, Geometry, Calculus & Statistics",
    room: "Sciences",
    active: true,
  },
  {
    id: "physics",
    label: "Physics",
    icon: "⚡",
    count: 18,
    desc: "Mechanics, Waves, Thermodynamics & Electromagnetism",
    room: "Sciences",
    active: true,
  },
  {
    id: "chemistry",
    label: "Chemistry",
    icon: "🧪",
    count: 20,
    desc: "Stoichiometry, Bonding, Periodic Table & Organic Chem",
    room: "Sciences",
    active: true,
  },
  {
    id: "biology",
    label: "Biology",
    icon: "🧬",
    count: 22,
    desc: "Genetics, Cytology, Human Anatomy & Ecology",
    room: "Sciences",
    active: true,
  },
  {
    id: "agriculture",
    label: "Agriculture",
    icon: "🌱",
    count: 16,
    desc: "Soil Science, Agronomy, Livestock & Agribusiness",
    room: "Sciences",
    active: true,
  },
];

const maskedSubjectsList = [
  {
    id: "entrepreneurship",
    label: "Entrepreneurship",
    icon: "💼",
    count: 12,
    desc: "Business Planning, Enterprise & Trade (Term 2)",
    room: "Arts",
    active: false,
  },
  {
    id: "geography",
    label: "Geography",
    icon: "🌍",
    count: 16,
    desc: "Physical, Human & Regional Geography (Term 2)",
    room: "Humanities",
    active: false,
  },
  {
    id: "history",
    label: "History & Political Education",
    icon: "🏛️",
    count: 14,
    desc: "East African, European & Pan-African Studies (Term 2)",
    room: "Humanities",
    active: false,
  },
];

export function SubjectQuickNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const filteredSciences = scienceSubjectsList.filter(
    (s) =>
      s.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.desc.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="w-full max-w-4xl mx-auto my-4 px-4">
      <div className="flex flex-col sm:flex-row items-center gap-3 rounded-2xl border border-border/80 bg-card/90 p-4 shadow-xl backdrop-blur-md">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search Science subjects (Math, Physics, Chemistry, Biology, Agriculture)..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="w-full rounded-xl border border-border bg-background/80 py-2.5 pl-10 pr-4 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none transition-all"
          />
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary/10 border border-primary/30 px-5 py-2.5 text-xs font-bold text-primary hover:bg-primary/20 transition-all shadow-sm flex-shrink-0"
        >
          <Atom className="h-4 w-4" />
          <span>Science Directory</span>
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="overflow-hidden mt-2 rounded-2xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur-md"
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                  Sciences Room (Senior 1–6 Primary Academic Tree)
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Active Science Subjects */}
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[320px] overflow-y-auto pr-1">
              {filteredSciences.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => {
                    setIsOpen(false);
                    navigate({ to: "/lessons", search: { subject: sub.id } as any });
                  }}
                  className="group text-left p-3 rounded-xl border border-border/80 bg-background/60 hover:bg-primary/10 hover:border-primary/40 transition-all flex flex-col justify-between gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{sub.icon}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted border border-border text-muted-foreground group-hover:text-primary">
                      {sub.count} topics
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground group-hover:text-primary">
                      {sub.label}
                    </h4>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">{sub.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Masked Arts & Humanities UI State */}
            <div className="mt-3 pt-3 border-t border-border/50">
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-dashed border-border/80 bg-muted/20">
                <div className="flex items-center gap-2">
                  <Compass className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      Arts &amp; Humanities Room (Senior 1–6)
                    </p>
                    <p className="text-[10px] text-muted-foreground/70">
                      Entrepreneurship, Geography, History, Literature &amp; Languages
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-muted/40 text-muted-foreground border-border shrink-0"
                >
                  <Lock className="h-2.5 w-2.5 mr-1 inline" />
                  Coming Soon
                </Badge>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
