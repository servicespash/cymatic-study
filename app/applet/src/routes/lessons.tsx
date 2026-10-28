import { NoteHierarchy } from "@/components/NoteHierarchy";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Download,
  Search,
  RefreshCw,
  Loader2,
  Brain,
  BookOpenText,
  Calendar,
  Sparkles,
  Layers,
} from "lucide-react";
import { topics } from "@/data/topics";
import { topicNotes as initialTopicNotes } from "@/data/notes";
import { quizQuestions } from "@/data/quizzes";
import { subjectLabels } from "@/lib/constants";
import { ExportPdfModal } from "@/components/ExportPdfModal";
import { useAuth } from "@/lib/auth-context";
import { useSubjectProgress } from "@/hooks/useSubjectProgress";
import { SpacedRepetitionModule } from "@/components/SpacedRepetitionModule";
import { TaskDiaryModule } from "@/components/TaskDiaryModule";
import { PageFlipBook } from "@/components/PageFlipBook";
import { StagedReviewConsole } from "@/components/StagedReviewConsole";
import { SemanticHeading } from "@/components/SEO/SemanticHeading";
import { toast } from "sonner";

export const Route = createFileRoute("/lessons")({
  head: () => ({ meta: [{ title: "Lessons — Lattys Cymatic Study" }] }),
  component: LessonsPage,
});

function LessonsPage() {
  const { isTeacher, isAdmin } = useAuth();
  const { progress } = useSubjectProgress();
  const [subject, setSubject] = useState("math");
  const [level, setLevel] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [mode, setMode] = useState<"lessons" | "sm2" | "diary" | "tactile">("lessons");
  const [dynamicNotes, setDynamicNotes] = useState<Record<string, any>>({});
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});
  const [pdfModal, setPdfModal] = useState<{
    isOpen: boolean;
    title: string;
    subject: string;
    docType: "lesson_notes" | "study_chart" | "quiz";
    showAnswers: boolean;
    content: { sectionTitle: string; body: any }[];
  }>({
    isOpen: false,
    title: "",
    subject: "",
    docType: "lesson_notes",
    showAnswers: false,
    content: [],
  });

  const canExportCurrentSubject = useMemo(() => {
    if (isTeacher || isAdmin) return true;
    const label = subjectLabels[subject as keyof typeof subjectLabels] || subject;
    const subProgress = progress.find((p) => p.subject.toLowerCase() === label.toLowerCase());
    return (subProgress?.completedPercentage ?? 0) > 0;
  }, [subject, isTeacher, isAdmin, progress]);

  const filtered = useMemo(() => {
    return topics.filter((t) => {
      const matchesSubject = t.subject === subject;
      const matchesLevel = t.level === level;
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSubject && matchesLevel && matchesSearch;
    });
  }, [subject, level, searchQuery]);

  const generateDynamicNotes = async (t: (typeof topics)[0]) => {
    if (isGenerating[t.id]) return;
    setIsGenerating((prev) => ({ ...prev, [t.id]: true }));
    try {
      const res = await fetch("/api/dynamic-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subjectLabels[t.subject as keyof typeof subjectLabels],
          level: t.level,
          topicTitle: t.title,
        }),
      });
      if (!res.ok) throw new Error("Failed to generate notes");
      const data = await res.json();
      if (data.sections) {
        setDynamicNotes((prev) => ({ ...prev, [t.id]: { sections: data.sections } }));
        toast.success(`Generated notes for ${t.title}`);
      } else {
        throw new Error("Invalid format");
      }
    } catch (e) {
      console.error(e);
      toast.error("AI service couldn't generate notes right now.");
    } finally {
      setIsGenerating((prev) => ({ ...prev, [t.id]: false }));
    }
  };

  return (
    <div className="app-container dashboard-container space-y-8 min-h-screen bg-background text-foreground">
      <SemanticHeading
        level={1}
        text="Explore Science Curriculum Lessons (S1 - S6)"
        searchQuestion="What science subjects and classes are covered under Uganda's New Lower Secondary Curriculum (NLSC) and A-Level?"
        zeroClickAnswer="Uganda's secondary curriculum spans Senior 1 to Senior 4 (O-Level) and Senior 5-6 (UACE), focusing exclusively on core Science subjects: Mathematics, Physics, Chemistry, Biology, and Agriculture. Lattys Cymatic Study provides fully aligned Socratic interactive notes, SM-2 spaced repetition, and Coded Study & Task Diary."
        id="curriculum-lessons-heading"
      />
      <p className="mb-6 text-sm text-muted-foreground -mt-4">
        Professional Science Curriculum Navigation for Senior 1 to Senior 6. Tap a topic to expand notes or switch to SM-2 & Study Diary.
      </p>

      {/* SEARCH BAR */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search science topics, formulas, or practical keywords..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-border bg-card/50 py-2.5 pl-10 pr-4 text-sm outline-none transition-smooth focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* MODE SELECTOR */}
      <div className="mb-6 flex flex-wrap gap-2 p-1.5 rounded-2xl bg-muted/60 border border-border">
        <button
          onClick={() => setMode("lessons")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${
            mode === "lessons" ? "bg-background text-primary shadow-sm" : "text-muted-foreground"
          }`}
        >
          <BookOpenText className="h-4 w-4" />
          <span>Curriculum Notes</span>
        </button>
        <button
          onClick={() => setMode("diary")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${
            mode === "diary" ? "bg-background text-primary shadow-sm" : "text-muted-foreground"
          }`}
        >
          <Calendar className="h-4 w-4 text-primary" />
          <span>Study & Task Diary</span>
        </button>
        <button
          onClick={() => setMode("sm2")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${
            mode === "sm2" ? "bg-background text-primary shadow-sm" : "text-muted-foreground"
          }`}
        >
          <Brain className="h-4 w-4" />
          <span>Spaced Repetition (SM-2)</span>
        </button>
        <button
          onClick={() => setMode("tactile")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${
            mode === "tactile" ? "bg-background text-primary shadow-sm" : "text-muted-foreground"
          }`}
        >
          <BookOpenText className="h-4 w-4" />
          <span>Tactile Reader</span>
        </button>
        <button
          onClick={() => setMode("console")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${
            mode === "console" ? "bg-background text-primary shadow-sm" : "text-muted-foreground"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Developer Console</span>
        </button>
      </div>

      {mode === "diary" ? (
        <TaskDiaryModule />
      ) : mode === "sm2" ? (
        <SpacedRepetitionModule />
      ) : mode === "tactile" ? (
        <PageFlipBook />
      ) : mode === "console" ? (
        <StagedReviewConsole />
      ) : (
        <>
          <div className="mt-6">
            <NoteHierarchy
              onSelectNote={(n, t) => {
                setSubject(t.subject);
                setLevel(t.level);
                setOpen(t.id);
              }}
            />
          </div>
        </>
      )}

      {pdfModal.isOpen && (
        <ExportPdfModal
          isOpen={pdfModal.isOpen}
          onClose={() => setPdfModal((prev) => ({ ...prev, isOpen: false }))}
          title={pdfModal.title}
          subject={pdfModal.subject}
          docType={pdfModal.docType}
          content={pdfModal.content}
          showAnswers={pdfModal.showAnswers}
        />
      )}
    </div>
  );
}
export default LessonsPage;
