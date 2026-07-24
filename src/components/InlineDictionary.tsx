import { useState } from "react";
import { BookOpen, Sparkles, X, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DictionaryTerm {
  term: string;
  definition: string;
  subject: string;
  example: string;
}

const predefinedTerms: Record<string, DictionaryTerm> = {
  stoichiometry: {
    term: "Stoichiometry",
    definition:
      "The calculation of relative quantities of reactants and products in chemical reactions based on balanced equations.",
    subject: "Chemistry",
    example: "Determining the mass of carbon dioxide produced by burning 10g of propane.",
  },
  mitosis: {
    term: "Mitosis",
    definition:
      "A type of cell division that results in two daughter cells each having the same number and kind of chromosomes as the parent nucleus.",
    subject: "Biology",
    example: "Growth and tissue repair in somatic cells.",
  },
  wavelength: {
    term: "Wavelength",
    definition:
      "The distance between successive crests of a wave, especially points in a sound wave or electromagnetic wave.",
    subject: "Physics",
    example: "Distance between adjacent bright fringes in Young's double slit experiment.",
  },
  quadratic: {
    term: "Quadratic Equation",
    definition:
      "An equation of the second degree, meaning it contains at least one squared term. Form: ax² + bx + c = 0.",
    subject: "Mathematics",
    example: "Modeling parabolic motion or profit optimization.",
  },
  ncdc: {
    term: "NCDC",
    definition:
      "National Curriculum Development Centre, mandated to develop curricula and educational materials for schools in Uganda.",
    subject: "Curriculum Overview",
    example: "Lower secondary competency-based syllabus framework.",
  },
};

export function InlineDictionaryTrigger({
  termKey,
  children,
}: {
  termKey: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const data = predefinedTerms[termKey.toLowerCase()] || {
    term: termKey,
    definition:
      "A key technical concept within the NCDC curriculum framework requiring conceptual mastery and practical application.",
    subject: "General",
    example: "Applied in coursework and practical lab assessments.",
  };

  return (
    <span className="relative inline-block">
      <button
        onClick={() => setIsOpen(true)}
        className="font-bold text-cyan-400 hover:text-cyan-300 underline decoration-cyan-500/40 decoration-dotted underline-offset-4 transition-all cursor-pointer"
        title="Click for inline definition"
      >
        {children}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 5 }}
            className="absolute left-0 bottom-full mb-2 z-50 w-72 rounded-2xl border border-cyan-500/30 bg-zinc-950/95 p-4 shadow-2xl text-zinc-100 backdrop-blur-md"
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-cyan-400" />
                <span className="text-xs font-extrabold text-cyan-300">{data.term}</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-zinc-100 p-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-1.5 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                {data.subject} Definition
              </span>
              <p className="text-zinc-300 leading-relaxed">{data.definition}</p>
              <div className="pt-1 text-[11px] text-cyan-400/90 italic">
                Example: {data.example}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
