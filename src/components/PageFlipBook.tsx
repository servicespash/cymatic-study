import { useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight, Bookmark, Sparkles, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TextbookPage {
  pageNumber: number;
  title: string;
  subject: string;
  content: string;
  keyTerm: string;
}

const samplePages: TextbookPage[] = [
  {
    pageNumber: 1,
    title: "Introduction to NCDC Lower Secondary Framework",
    subject: "Curriculum Overview",
    content:
      "The National Curriculum Development Centre (NCDC) revised Lower Secondary curriculum emphasizes competency-based learning. Students are evaluated not merely on rote memorization, but on practical application, collaborative projects, and critical thinking across STEM and humanities disciplines.",
    keyTerm: "Competency-Based Education (CBE)",
  },
  {
    pageNumber: 2,
    title: "Newton's Laws & Kinematics in Real Life",
    subject: "Physics S.3",
    content:
      "In Ugandan everyday life, Newton's laws govern everything from the acceleration of a boda-boda navigating traffic to water flow in rainwater harvesting systems. The relationship between net force, mass, and acceleration is expressed as F = ma.",
    keyTerm: "Newton's Second Law",
  },
  {
    pageNumber: 3,
    title: "Quadratic Equations & Problem Solving",
    subject: "Mathematics S.2",
    content:
      "Quadratic equations model parabolic trajectories, profit maximization in entrepreneurship, and structural design. We solve them through factorization, completing the square, or using the quadratic formula: x = (-b ± √(b² - 4ac)) / 2a.",
    keyTerm: "Quadratic Formula",
  },
  {
    pageNumber: 4,
    title: "Cell Division & Genetic Inheritance",
    subject: "Biology S.4",
    content:
      "Mitosis ensures somatic cell growth and tissue repair, while meiosis generates genetic diversity through crossing over in gametogenesis. Understanding these mechanisms is foundational for modern agricultural breeding and biotechnology in East Africa.",
    keyTerm: "Meiosis & Crossing Over",
  },
];

export function PageFlipBook() {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const page = samplePages[currentPageIndex];

  const handleNext = () => {
    if (currentPageIndex + 1 < samplePages.length) {
      setDirection(1);
      setCurrentPageIndex((i) => i + 1);
    }
  };

  const handlePrev = () => {
    if (currentPageIndex > 0) {
      setDirection(-1);
      setCurrentPageIndex((i) => i - 1);
    }
  };

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-2xl text-zinc-100 max-w-3xl mx-auto my-6">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-cyan-400" />
          <h2 className="text-lg font-extrabold">Tactile Digital Textbook (Page Flip Reader)</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            Page {page.pageNumber} of {samplePages.length}
          </span>
        </div>
      </div>

      <div className="relative overflow-hidden min-h-[320px] rounded-2xl border border-zinc-700 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-8 shadow-inner flex flex-col justify-between">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentPageIndex}
            custom={direction}
            initial={{ opacity: 0, rotateY: direction * 90, scale: 0.95 }}
            animate={{ opacity: 1, rotateY: 0, scale: 1 }}
            exit={{ opacity: 0, rotateY: direction * -90, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                {page.subject}
              </span>
              <div className="flex items-center gap-1 text-xs text-zinc-400">
                <Bookmark className="h-3.5 w-3.5 text-yellow-400" />
                <span>
                  Key Term: <strong className="text-zinc-200">{page.keyTerm}</strong>
                </span>
              </div>
            </div>

            <div className="space-y-3 py-2">
              <h3 className="text-xl font-black text-zinc-100 tracking-tight">{page.title}</h3>
              <p className="text-sm text-zinc-300 leading-relaxed font-sans">{page.content}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between pt-6 border-t border-zinc-800 mt-6">
          <button
            onClick={handlePrev}
            disabled={currentPageIndex === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 transition-all shadow-sm"
          >
            <ChevronLeft className="h-4 w-4" /> Previous Page
          </button>

          <div className="flex gap-1.5">
            {samplePages.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setDirection(i > currentPageIndex ? 1 : -1);
                  setCurrentPageIndex(i);
                }}
                className={`h-2 rounded-full transition-all ${
                  currentPageIndex === i ? "w-6 bg-cyan-400" : "w-2 bg-zinc-700 hover:bg-zinc-600"
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={currentPageIndex + 1 === samplePages.length}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 px-4 py-2 text-xs font-bold disabled:opacity-40 transition-all shadow-sm"
          >
            Next Page <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
