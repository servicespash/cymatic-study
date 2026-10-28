import { NoteHierarchy } from "@/components/NoteHierarchy";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  ChevronDown,
  Download,
  Search,
  RefreshCw,
  Loader2,
  Brain,
  BookOpenText,
  Sparkles,
  Eye,
  Atom,
  Lock,
  Calendar,
  Clock,
  Compass,
  FileText,
  CheckCircle2,
  ImageIcon,
} from "lucide-react";
import { topics as staticTopics } from "@/data/topics";
import { topicNotes as initialTopicNotes } from "@/data/notes";
import { quizQuestions } from "@/data/quizzes";
import { subjectLabels } from "@/lib/constants";
import { ExportPdfModal } from "@/components/ExportPdfModal";
import { useAuth } from "@/lib/auth-context";
import { useSubjectProgress } from "@/hooks/useSubjectProgress";
import { SpacedRepetitionModule } from "@/components/SpacedRepetitionModule";
import { PageFlipBook } from "@/components/PageFlipBook";
import { LearningTaxDiary } from "@/components/lessons/LearningTaxDiary";
import { SemanticHeading } from "@/components/SEO/SemanticHeading";
import {
  SCIENCE_SUBJECTS,
  CLASS_LEVELS_SCIENCE,
  MASKED_ARTS_AND_HUMANITIES,
} from "@/data/scienceCurriculum";
import {
  getCombinedTopics,
  getCombinedTopicNote,
  useCurriculumStore,
} from "@/lib/curriculum-store";
import { DiagramLightboxModal } from "@/components/curriculum/DiagramLightboxModal";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { GlassmorphismSubjectSidebar } from "@/components/navigation/GlassmorphismSubjectSidebar";

export const Route = createFileRoute("/lessons")({
  validateSearch: (search: Record<string, unknown>) => ({
    subject: typeof search.subject === "string" ? search.subject : undefined,
    level:
      typeof search.level === "number" || typeof search.level === "string"
        ? Number(search.level)
        : undefined,
  }),
  head: () => ({ meta: [{ title: "Curriculum Lessons — Latty's Cymatic Study" }] }),
  component: LessonsPage,
});

function LessonsPage() {
  const searchParams = Route.useSearch();
  const { isTeacher, isAdmin } = useAuth();
  const { progress } = useSubjectProgress();

  const [subject, setSubject] = useState<string>(searchParams?.subject || "math");
  const [level, setLevel] = useState<number>(searchParams?.level || 1);
  const [activeRoom, setActiveRoom] = useState<"sciences" | "arts_humanities">("sciences");
  const { publishedTopics } = useCurriculumStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [mode, setMode] = useState<"lessons" | "sm2" | "tax-diary" | "tactile">("lessons");
  const [lightboxDiagram, setLightboxDiagram] = useState<any | null>(null);

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

  // Sync state if URL query params change
  useEffect(() => {
    if (searchParams?.subject && searchParams.subject !== subject) {
      setSubject(searchParams.subject);
    }
    if (searchParams?.level && searchParams.level !== level) {
      setLevel(searchParams.level);
    }
  }, [searchParams?.subject, searchParams?.level]);

  // Determine if the current subject is started for student downloads
  const canExportCurrentSubject = useMemo(() => {
    if (isTeacher || isAdmin) return true;
    const label = subjectLabels[subject as keyof typeof subjectLabels] || subject;
    const subProgress = progress.find((p) => p.subject.toLowerCase() === label.toLowerCase());
    return (subProgress?.completedPercentage ?? 0) > 0;
  }, [subject, isTeacher, isAdmin, progress]);

  // Combined topics for the active science subject & level (includes static + published)
  const filtered = useMemo(() => {
    const combined = getCombinedTopics(subject, level);
    if (!searchQuery.trim()) return combined;

    const q = searchQuery.toLowerCase().trim();
    return combined.filter((t) => {
      const matchesTitle = t.title.toLowerCase().includes(q);
      const matchesDesc = t.description.toLowerCase().includes(q);
      const matchesFormulas = t.formulas?.some((f) => f.toLowerCase().includes(q));
      const matchesKeyPoints = t.keyPoints?.some((k) => k.toLowerCase().includes(q));
      return matchesTitle || matchesDesc || matchesFormulas || matchesKeyPoints;
    });
  }, [subject, level, searchQuery, publishedTopics]);

  const activeSubjectMeta = SCIENCE_SUBJECTS.find((s) => s.id === subject) || SCIENCE_SUBJECTS[0];
  const activeClassMeta =
    CLASS_LEVELS_SCIENCE.find((c) => c.level === level) || CLASS_LEVELS_SCIENCE[0];

  const generateDynamicNotes = async (t: any) => {
    if (isGenerating[t.id]) return;

    setIsGenerating((prev) => ({ ...prev, [t.id]: true }));
    try {
      const res = await fetch("/api/dynamic-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subjectLabels[t.subject as keyof typeof subjectLabels] || t.subject,
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
    <div className="app-container dashboard-container min-h-screen bg-background text-foreground pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start w-full max-w-[1920px] mx-auto p-4 sm:p-6">
        {/* Sleek Glassmorphism Collapsible Sidebar */}
        <div className="lg:col-span-3 lg:sticky lg:top-20">
          <GlassmorphismSubjectSidebar
            currentSubject={subject}
            currentLevel={level}
            onSelectSubject={(sId) => setSubject(sId)}
          />
        </div>

        {/* Main Content Area */}
        <main className="lg:col-span-9 space-y-6 min-w-0">
          <Link
            to="/aep"
            className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-primary/25 bg-card p-4 shadow-sm transition-colors hover:border-primary/50 hover:bg-muted/30 sm:p-5"
          >
            <span className="flex min-w-0 items-start gap-3">
              <span className="rounded-xl bg-primary/10 p-3 text-primary">
                <BookOpenText className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold">AEP Curriculum Library</span>
                <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                  Open the separate Physics and Biology index, expand one topic at a time, and read
                  the linked official syllabus without crowding the S1–S6 lesson page.
                </span>
                <span className="mt-2 block text-xs text-muted-foreground">
                  39 indexed headings · AEP Level 1 and Level 2
                </span>
              </span>
            </span>
            <span className="shrink-0 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground group-hover:opacity-90">
              Open library
            </span>
          </Link>
          {/* Page Title & Context */}
          <div>
            <SemanticHeading
              level={1}
              text="Secondary Science Curriculum Lessons"
              searchQuestion="What subjects and classes are covered under Uganda's Science Curriculum?"
              zeroClickAnswer="Uganda's Secondary Science Curriculum spans Senior 1 to Senior 6, covering core disciplines: Mathematics, Physics, Chemistry, Biology, and Agriculture. Lattys Cymatic Study delivers Socratic interactive notes, SM-2 retention proofing, and continuous assessment ledgers."
              id="curriculum-lessons-heading"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Explore curriculum notes exclusively for Senior 1–6 Sciences. Track your learning tax
              audit ledger and spaced repetition retention.
            </p>
          </div>

          {/* CLASS ARRANGEMENT BAR (S1 to S6) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-bold uppercase tracking-wider text-[11px]">
                Select Class Level:
              </span>
              <span className="text-[11px] font-mono text-primary font-semibold">
                {activeClassMeta.label} ({activeClassMeta.phase})
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {CLASS_LEVELS_SCIENCE.map((cls) => (
                <button
                  key={cls.level}
                  onClick={() => setLevel(cls.level)}
                  className={`p-3 rounded-xl border transition-all text-center flex flex-col items-center justify-center gap-0.5 ${
                    level === cls.level
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border/80 bg-card hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span
                    className={`text-sm font-black ${level === cls.level ? "text-primary" : "text-foreground"}`}
                  >
                    {cls.label}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">{cls.short}</span>
                </button>
              ))}
            </div>
          </div>

          {/* SCIENCE SUBJECTS HORIZONTAL SELECTION */}
          <div className="space-y-1.5">
            <span className="font-bold uppercase tracking-wider text-[11px] text-muted-foreground">
              Science Discipline:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {SCIENCE_SUBJECTS.map((s) => {
                const Icon = s.icon;
                const isSelected = subject === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSubject(s.id)}
                    className={`p-3 rounded-xl border transition-all text-left flex items-start gap-3 group ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border/80 bg-card hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-black truncate ${isSelected ? "text-primary" : "text-foreground"}`}
                      >
                        {s.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {s.unebCode.split("/")[0]}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MODE SELECTOR */}
          <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-muted/60 border border-border">
            <button
              onClick={() => setMode("lessons")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition min-w-[140px] ${
                mode === "lessons"
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              <BookOpenText className="h-4 w-4" />
              <span>Curriculum Notes</span>
            </button>
            <button
              onClick={() => setMode("sm2")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition min-w-[140px] ${
                mode === "sm2" ? "bg-background text-primary shadow-sm" : "text-muted-foreground"
              }`}
            >
              <Brain className="h-4 w-4" />
              <span>Spaced Repetition (SM-2)</span>
            </button>
            <button
              onClick={() => setMode("tax-diary")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition min-w-[140px] ${
                mode === "tax-diary"
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              <FileText className="h-4 w-4 text-emerald-400" />
              <span>Learning Tax Diary</span>
            </button>
            <button
              onClick={() => setMode("tactile")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition min-w-[140px] ${
                mode === "tactile"
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              <BookOpenText className="h-4 w-4" />
              <span>Tactile Reader</span>
            </button>
          </div>

          {/* ACTIVE MODE DISPLAY */}
          {mode === "sm2" ? (
            <SpacedRepetitionModule />
          ) : mode === "tax-diary" ? (
            <LearningTaxDiary defaultSubject={activeSubjectMeta.title} defaultLevel={level} />
          ) : mode === "tactile" ? (
            <PageFlipBook />
          ) : (
            /* LESSONS NOTES MODE */
            <div className="space-y-4">
              {/* SEARCH BAR */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={`Search ${activeSubjectMeta.title} S.${level} topics, formulas, or competencies...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card/60 py-2.5 pl-10 pr-4 text-sm outline-none transition-smooth focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Topics List */}
              <div className="space-y-3">
                {filtered.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-border p-8 text-center space-y-2 bg-card/30">
                    <BookOpenText className="h-8 w-8 text-muted-foreground mx-auto" />
                    <p className="text-sm font-bold text-foreground">
                      No topics matched your search for {activeSubjectMeta.title} (
                      {activeClassMeta.label}).
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Try clearing your search query or selecting another Senior class level.
                    </p>
                  </div>
                )}

                {filtered.map((t) => {
                  const note =
                    dynamicNotes[t.id] ||
                    getCombinedTopicNote(t.id) ||
                    initialTopicNotes.find((n) => n.topicId === t.id);
                  const isOpen = open === t.id;
                  const isPublishedDynamic = publishedTopics.some((p) => p.id === t.id);

                  return (
                    <div
                      key={`${t.id}-${t.level}-${t.subject}`}
                      className="overflow-hidden rounded-xl border border-border bg-card"
                    >
                      <button
                        onClick={() => setOpen(isOpen ? null : t.id)}
                        className="flex w-full items-center justify-between gap-3 p-4 text-left transition-smooth hover:bg-muted/40"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-foreground text-sm sm:text-base">
                              {t.title}
                            </h3>
                            <Badge variant="outline" className="text-[10px] uppercase font-mono">
                              S.{t.level}
                            </Badge>
                            {isPublishedDynamic && (
                              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[9px] font-bold">
                                Verified Curriculum
                              </Badge>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>
                        </div>
                        <ChevronDown
                          className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      {isOpen && (
                        <div className="border-t border-border bg-background/40 p-5 prose-paper space-y-4">
                          {/* Syllabus Subtopics if available */}
                          {note?.subtopics && note.subtopics.length > 0 && (
                            <div className="p-3 rounded-lg border border-border/80 bg-muted/20">
                              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Syllabus Subtopics &amp; Competencies
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {note.subtopics.map((sub: string, sIdx: number) => (
                                  <span
                                    key={sIdx}
                                    className="text-xs text-foreground/80 bg-card border border-border px-2.5 py-1 rounded-md"
                                  >
                                    {sub}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Key Formulas */}
                          {t.formulas && t.formulas.length > 0 && (
                            <div className="rounded-lg bg-primary/10 p-3">
                              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                                Key formulas &amp; Mathematical Laws
                              </p>
                              {t.formulas.map((f, i) => (
                                <code key={i} className="block text-sm text-foreground font-mono">
                                  {f}
                                </code>
                              ))}
                            </div>
                          )}

                          {/* Scientific Diagrams & Figures */}
                          {note?.diagrams && note.diagrams.length > 0 && (
                            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                              <div className="flex items-center gap-2">
                                <ImageIcon className="h-4 w-4 text-primary" />
                                <h5 className="text-xs font-bold uppercase tracking-wider text-primary">
                                  Curriculum Scientific Figures &amp; Diagrams (
                                  {note.diagrams.length})
                                </h5>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {note.diagrams.map((d: any, dIdx: number) => (
                                  <div
                                    key={dIdx}
                                    onClick={() => setLightboxDiagram(d)}
                                    className="rounded-xl border border-border bg-card p-3 space-y-2 cursor-pointer hover:border-primary/50 transition-all group shadow-sm"
                                  >
                                    {d.dataUrl && (
                                      <div className="bg-black/40 rounded-lg p-2 h-36 flex items-center justify-center overflow-hidden">
                                        <img
                                          src={d.dataUrl}
                                          alt={d.caption || "Scientific Diagram"}
                                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                                        />
                                      </div>
                                    )}
                                    <div className="space-y-1">
                                      <p className="text-xs font-mono text-primary font-bold truncate">
                                        {d.virtualPath}
                                      </p>
                                      {d.caption && (
                                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                                          {d.caption}
                                        </p>
                                      )}
                                      <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1 pt-1 font-semibold">
                                        <Eye className="h-3 w-3" /> Click to Inspect Full Figure
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Study Content Sections */}
                          {note?.sections ? (
                            <>
                              <div className="flex justify-end">
                                <button
                                  onClick={() => generateDynamicNotes(t)}
                                  disabled={isGenerating[t.id]}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-smooth hover:bg-primary/20 disabled:opacity-50"
                                >
                                  {isGenerating[t.id] ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <RefreshCw className="h-3 w-3" />
                                  )}
                                  Update with AI Socratic Synthesis
                                </button>
                              </div>
                              {note.sections.map((s: any, i: number) => (
                                <div key={i} className="mb-4">
                                  <h4 className="mb-1 font-semibold text-foreground text-sm">
                                    {s.heading}
                                  </h4>
                                  <p className="text-sm leading-relaxed text-foreground/85">
                                    {s.content}
                                  </p>
                                </div>
                              ))}
                            </>
                          ) : (
                            <div className="text-center py-6">
                              <p className="text-sm text-muted-foreground mb-4">
                                No static notes available for this topic.
                              </p>
                              <button
                                onClick={() => generateDynamicNotes(t)}
                                disabled={isGenerating[t.id]}
                                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-smooth hover:bg-primary/90 disabled:opacity-50"
                              >
                                {isGenerating[t.id] ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-4 w-4" />
                                )}
                                Generate Dynamic AI Notes
                              </button>
                            </div>
                          )}

                          {note?.examples && note.examples.length > 0 && (
                            <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                                Worked Classroom Examples &amp; Solutions
                              </p>
                              {note.examples.map((ex: any, i: number) => (
                                <div key={i} className="mb-3 last:mb-0 text-xs">
                                  <p className="font-semibold text-foreground">Q: {ex.problem}</p>
                                  <p className="text-muted-foreground mt-0.5">A: {ex.solution}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-border/50">
                            <Link
                              to="/tutor"
                              search={{
                                prefill: `I am studying "${t.title}" in ${subjectLabels[t.subject] || t.subject} (Senior ${t.level}). Can you guide me through this topic with Socratic questioning?`,
                              }}
                              className="rounded-lg bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/25"
                            >
                              Ask Socratic Tutor →
                            </Link>

                            <Link
                              to="/quizzes"
                              search={{ subject: t.subject, topicId: t.id }}
                              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
                            >
                              Quiz This Topic →
                            </Link>

                            <button
                              onClick={() => {
                                if (!canExportCurrentSubject) {
                                  toast.error("Access Restricted", {
                                    description:
                                      "Students can download notes for subjects they have started in the hub.",
                                  });
                                  return;
                                }

                                const pdfContent: { sectionTitle: string; body: any }[] = [
                                  {
                                    sectionTitle: "Introduction & Overview",
                                    body: t.description || "Study notes for this curriculum topic.",
                                  },
                                ];

                                if (t.formulas && t.formulas.length > 0) {
                                  pdfContent.push({
                                    sectionTitle: "Essential Academic Formulas",
                                    body: t.formulas,
                                  });
                                }

                                if (note?.sections && note.sections.length > 0) {
                                  note.sections.forEach((s: any) => {
                                    pdfContent.push({
                                      sectionTitle: s.heading,
                                      body: s.content,
                                    });
                                  });
                                }

                                if (note?.examples && note.examples.length > 0) {
                                  pdfContent.push({
                                    sectionTitle: "Worked Classroom Examples",
                                    body: note.examples.map(
                                      (ex: any) => `Q: ${ex.problem}\nA: ${ex.solution}`,
                                    ),
                                  });
                                }

                                const exs = quizQuestions.filter((qz) => qz.topicId === t.id);
                                if (exs.length > 0) {
                                  pdfContent.push({
                                    sectionTitle: "Self-Assessment Practice Exercises",
                                    body: exs.map((qz) => ({
                                      q: qz.question,
                                      options: qz.options,
                                      a: String.fromCharCode(65 + qz.correctIndex),
                                    })),
                                  });
                                }

                                setPdfModal({
                                  isOpen: true,
                                  title: t.title,
                                  subject: t.subject.toUpperCase(),
                                  docType: "lesson_notes",
                                  showAnswers: isTeacher || isAdmin,
                                  content: pdfContent,
                                });
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
                            >
                              <Download className="h-3.5 w-3.5" /> Export Branded PDF Notes
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>

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

      {/* Scientific Diagram Lightbox Inspection Modal */}
      <DiagramLightboxModal
        isOpen={!!lightboxDiagram}
        onClose={() => setLightboxDiagram(null)}
        diagram={lightboxDiagram}
      />
    </div>
  );
}
