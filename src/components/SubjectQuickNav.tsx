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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";

const subjectsList = [
  {
    id: "mathematics",
    label: "Mathematics",
    icon: "📐",
    count: 24,
    desc: "Algebra, Geometry & Calculus",
  },
  {
    id: "physics",
    label: "Physics",
    icon: "⚡",
    count: 18,
    desc: "Mechanics, Waves & Electromagnetism",
  },
  {
    id: "chemistry",
    label: "Chemistry",
    icon: "🧪",
    count: 20,
    desc: "Stoichiometry, Bonding & Organic Chem",
  },
  {
    id: "biology",
    label: "Biology",
    icon: "🧬",
    count: 22,
    desc: "Genetics, Ecology & Cell Division",
  },
  {
    id: "english",
    label: "English Language",
    icon: "📖",
    count: 15,
    desc: "Grammar, Comprehension & Essay Writing",
  },
  {
    id: "entrepreneurship",
    label: "Entrepreneurship",
    icon: "💼",
    count: 12,
    desc: "Business Planning, Finance & Trade",
  },
  {
    id: "ict",
    label: "ICT & Computing",
    icon: "💻",
    count: 14,
    desc: "Algorithms, Databases & Web Tech",
  },
  {
    id: "geography",
    label: "Geography",
    icon: "🌍",
    count: 16,
    desc: "Physical & Regional Geography",
  },
];

export function SubjectQuickNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const filteredSubjects = subjectsList.filter(
    (s) =>
      s.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.desc.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="w-full max-w-4xl mx-auto my-4 px-4">
      <div className="flex flex-col sm:flex-row items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4 shadow-xl backdrop-blur-md">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Quick search NCDC subjects, topics, or curriculum competencies..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 pl-10 pr-4 text-xs text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 focus:outline-none transition-all"
          />
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 px-5 py-2.5 text-xs font-bold text-cyan-400 hover:bg-cyan-500/20 transition-all shadow-sm flex-shrink-0"
        >
          <Compass className="h-4 w-4" />
          <span>Subject Directory</span>
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
            className="overflow-hidden mt-2 rounded-2xl border border-zinc-800 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur-md"
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-200">
                  Select NCDC Curriculum Subject
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-zinc-100 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-2.5 max-h-[320px] overflow-y-auto pr-1">
              {filteredSubjects.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => {
                    setIsOpen(false);
                    navigate({ to: "/lessons", search: { subject: sub.id } as any });
                  }}
                  className="group text-left p-3 rounded-xl border border-zinc-800/80 bg-zinc-900/60 hover:bg-cyan-500/10 hover:border-cyan-500/40 transition-all flex flex-col justify-between gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{sub.icon}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-400 group-hover:text-cyan-400">
                      {sub.count} topics
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-100 group-hover:text-cyan-300">
                      {sub.label}
                    </h4>
                    <p className="text-[10px] text-zinc-400 truncate mt-0.5">{sub.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
