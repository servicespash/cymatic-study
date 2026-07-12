import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { ChevronDown, Download, Search, RefreshCw, Loader2 } from "lucide-react";
import { topics } from "@/data/topics";
import { topicNotes as initialTopicNotes } from "@/data/notes";
import { quizQuestions } from "@/data/quizzes";
import { subjectLabels, classLevels } from "@/lib/constants";
import { downloadText } from "@/lib/download";
import { ExportPdfModal } from "@/components/ExportPdfModal";
import { toast } from "sonner";

export const Route = createFileRoute("/lessons")({
  head: () => ({ meta: [{ title: "Lessons — Lattys Cymatic Hub" }] }),
  component: LessonsPage,
});

function LessonsPage() {
  const [subject, setSubject] = useState("math");
  const [level, setLevel] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const [dynamicNotes, setDynamicNotes] = useState<Record<string, any>>({});
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});

  const [pdfModal, setPdfModal] = useState<{
    isOpen: boolean;
    title: string;
    subject: string;
    docType: "lesson_notes" | "study_chart" | "quiz";
    content: { sectionTitle: string; body: any }[];
  }>({
    isOpen: false,
    title: "",
    subject: "",
    docType: "lesson_notes",
    content: [],
  });

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
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-extrabold">Explore Lessons</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Pick a subject and class to read your notes. Tap a topic to expand.
      </p>

      {/* SEARCH BAR */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search topics, formulas, or keywords..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-border bg-card/50 py-2.5 pl-10 pr-4 text-sm outline-none transition-smooth focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {Object.entries(subjectLabels).map(([k, l]) => (
          <button
            key={k}
            onClick={() => {
              setSubject(k);
              setOpen(null);
            }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-smooth ${
              subject === k
                ? "bg-primary text-primary-foreground shadow-glow"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {l}
          </button>
        ))}
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {classLevels.map((c) => (
          <button
            key={c.level}
            onClick={() => {
              setLevel(c.level);
              setOpen(null);
            }}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-smooth ${
              level === c.level
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No topics yet for this selection.
          </p>
        )}
        {filtered.map((t) => {
          const note = dynamicNotes[t.id] || initialTopicNotes.find((n) => n.topicId === t.id);
          const isOpen = open === t.id;
          return (
            <div key={t.id} className="overflow-hidden rounded-xl border border-border bg-card">
              <button
                onClick={() => setOpen(isOpen ? null : t.id)}
                className="flex w-full items-center justify-between gap-3 p-4 text-left transition-smooth hover:bg-muted/40"
              >
                <div>
                  <h3 className="font-bold text-foreground">{t.title}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>
                </div>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isOpen && (
                <div className="border-t border-border bg-background/40 p-5 prose-paper">
                  {t.formulas && t.formulas.length > 0 && (
                    <div className="mb-4 rounded-lg bg-primary/10 p-3">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                        Key formulas
                      </p>
                      {t.formulas.map((f, i) => (
                        <code key={i} className="block text-sm text-foreground">
                          {f}
                        </code>
                      ))}
                    </div>
                  )}
                  {note?.sections ? (
                    <>
                      <div className="flex justify-end mb-4">
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
                          Update with Latest Research
                        </button>
                      </div>
                      {note.sections.map((s: any, i: number) => (
                        <div key={i} className="mb-4">
                          <h4 className="mb-1 font-semibold text-foreground">{s.heading}</h4>
                          <p className="text-sm leading-relaxed text-foreground/85">{s.content}</p>
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
                    <div className="mt-4 rounded-lg border border-success/30 bg-success/5 p-3">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-success">
                        Worked examples
                      </p>
                      {note.examples.map((ex, i) => (
                        <div key={i} className="mb-3 last:mb-0">
                          <p className="text-sm font-semibold">Q: {ex.problem}</p>
                          <p className="text-sm text-muted-foreground">A: {ex.solution}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      to="/tutor"
                      search={{
                        prefill: `I am studying "${t.title}" in ${subjectLabels[t.subject]}. Specifically, I have a question about this part: ${t.description}. Can you guide me through it Socratic-style?`,
                      }}
                      className="rounded-lg bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/25"
                    >
                      Ask the tutor →
                    </Link>
                    <Link
                      to="/quizzes"
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
                    >
                      Quiz this topic →
                    </Link>
                    <button
                      onClick={() => {
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
                          note.sections.forEach((s) => {
                            pdfContent.push({
                              sectionTitle: s.heading,
                              body: s.content,
                            });
                          });
                        }

                        if (note?.examples && note.examples.length > 0) {
                          pdfContent.push({
                            sectionTitle: "Worked Classroom Examples",
                            body: note.examples.map((ex) => `Q: ${ex.problem}\nA: ${ex.solution}`),
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
                          content: pdfContent,
                        });
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
                    >
                      <Download className="h-3.5 w-3.5" /> Export branded PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {pdfModal.isOpen && (
        <ExportPdfModal
          isOpen={pdfModal.isOpen}
          onClose={() => setPdfModal((prev) => ({ ...prev, isOpen: false }))}
          title={pdfModal.title}
          subject={pdfModal.subject}
          docType={pdfModal.docType}
          content={pdfModal.content}
        />
      )}
    </div>
  );
}
