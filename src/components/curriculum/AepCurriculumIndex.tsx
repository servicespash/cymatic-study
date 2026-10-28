import { useEffect, useMemo, useState } from "react";
import { BookOpen, ChevronDown, ExternalLink, FileText, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { jsPDF } from "jspdf";

type SourceDocument = {
  id: string;
  title: string;
  subject_label: string;
  curriculum_programme: string;
  level_labels: string[];
  source_url: string | null;
  page_count: number | null;
};

type IndexedTopic = {
  id: string;
  source_document_id: string;
  level_label: string;
  topic_number: number;
  title: string;
  source_page: number | null;
  review_status: string;
};

type IndexedNote = {
  id: string;
  source_topic_id: string | null;
  source_document_id: string;
  title: string;
  summary: string;
  study_sections: { heading: string; content: string }[];
  review_status: string;
  publication_status: string;
};

const LEVEL_ORDER = ["Level 1", "Level 2"];

export function AepCurriculumIndex() {
  const [documents, setDocuments] = useState<SourceDocument[]>([]);
  const [topics, setTopics] = useState<IndexedTopic[]>([]);
  const [notes, setNotes] = useState<IndexedNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState("All levels");
  const [offlineSnapshot, setOfflineSnapshot] = useState(false);
  const { isAdmin } = useAuth();
  const [reviewingTopicId, setReviewingTopicId] = useState<string | null>(null);

  const loadIndex = async () => {
    setLoading(true);
    setError(null);
    setOfflineSnapshot(false);

    const [documentsResult, topicsResult, notesResult] = await Promise.all([
      (supabase as any)
        .from("curriculum_documents")
        .select("id,title,subject_label,curriculum_programme,level_labels,source_url,page_count")
        .in("id", ["ncdc-aep-physics-lsc-level-1-2-2023", "ncdc-aep-biology-lsc-level-1-2-2023"]),
      (supabase as any)
        .from("curriculum_document_topics")
        .select("id,source_document_id,level_label,topic_number,title,source_page,review_status")
        .in("source_document_id", [
          "ncdc-aep-physics-lsc-level-1-2-2023",
          "ncdc-aep-biology-lsc-level-1-2-2023",
        ])
        .order("level_label", { ascending: true })
        .order("topic_number", { ascending: true }),
      (supabase as any)
        .from("curriculum_document_notes")
        .select(
          "id,source_topic_id,source_document_id,title,summary,study_sections,review_status,publication_status",
        )
        .in("source_document_id", [
          "ncdc-aep-physics-lsc-level-1-2-2023",
          "ncdc-aep-biology-lsc-level-1-2-2023",
        ]),
    ]);

    if (documentsResult.error || topicsResult.error) {
      try {
        const cached = localStorage.getItem("cymatic-aep-curriculum-index-v1");
        if (cached) {
          const snapshot = JSON.parse(cached) as {
            documents: SourceDocument[];
            topics: IndexedTopic[];
          };
          if (Array.isArray(snapshot.documents) && Array.isArray(snapshot.topics)) {
            setDocuments(snapshot.documents);
            setTopics(snapshot.topics);
            try {
              const cachedNotes = localStorage.getItem("cymatic-aep-curriculum-notes-v1");
              setNotes(cachedNotes ? (JSON.parse(cachedNotes) as IndexedNote[]) : []);
            } catch {
              setNotes([]);
            }
            setOfflineSnapshot(true);
            setError(null);
          } else {
            setError("Cached curriculum index is invalid. Reconnect and refresh.");
            setDocuments([]);
            setTopics([]);
          }
        } else {
          setError(
            documentsResult.error?.message ||
              topicsResult.error?.message ||
              "The curriculum index could not be loaded.",
          );
          setDocuments([]);
          setTopics([]);
        }
      } catch {
        setError("Could not read the offline curriculum cache. Reconnect and refresh.");
        setDocuments([]);
        setTopics([]);
      }
    } else {
      const nextDocuments = (documentsResult.data || []) as SourceDocument[];
      const nextTopics = (topicsResult.data || []) as IndexedTopic[];
      const nextNotes = notesResult.error ? [] : ((notesResult.data || []) as IndexedNote[]);
      setDocuments(nextDocuments);
      setTopics(nextTopics);
      setNotes(nextNotes);
      try {
        const publicNotes = nextNotes.filter(
          (note) => note.review_status === "approved" && note.publication_status === "published",
        );
        localStorage.setItem(
          "cymatic-aep-curriculum-index-v1",
          JSON.stringify({
            documents: nextDocuments,
            topics: nextTopics,
            cachedAt: new Date().toISOString(),
          }),
        );
        localStorage.setItem("cymatic-aep-curriculum-notes-v1", JSON.stringify(publicNotes));
      } catch (cacheError) {
        console.warn(
          "Curriculum index loaded but could not be cached for offline use.",
          cacheError,
        );
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadIndex();
  }, []);

  const downloadNotePdf = (note: IndexedNote, topic: IndexedTopic, document: SourceDocument) => {
    const pdf = new jsPDF();
    const margin = 16;
    const width = pdf.internal.pageSize.getWidth() - margin * 2;
    let y = 20;
    const addParagraph = (heading: string, body: string) => {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text(heading, margin, y);
      y += 6;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      const lines = pdf.splitTextToSize(body, width);
      for (const line of lines) {
        if (y > 275) {
          pdf.addPage();
          y = 20;
        }
        pdf.text(line, margin, y);
        y += 5;
      }
      y += 4;
    };

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    const titleLines = pdf.splitTextToSize(note.title, width);
    pdf.text(titleLines, margin, y);
    y += titleLines.length * 7 + 3;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(document.subject_label + " · " + topic.level_label + " · Uganda AEP", margin, y);
    y += 10;

    addParagraph("Core idea", note.summary);
    for (const section of note.study_sections || []) {
      addParagraph(section.heading, section.content);
    }
    addParagraph(
      "Source reference",
      document.title +
        " · printed page " +
        (topic.source_page ?? "not verified") +
        "\n" +
        (document.source_url || ""),
    );
    addParagraph(
      "Attribution",
      "Original short study aid prepared for Cymatic Study from the listed curriculum topic. This is not a reproduction of the source PDF. Check the official syllabus for the complete curriculum wording.",
    );

    pdf.save(note.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-study-note.pdf");
  };

  const markTopicReviewed = async (topic: IndexedTopic) => {
    if (!isAdmin) return;
    setReviewingTopicId(topic.id);
    const { error: updateError } = await (supabase as any)
      .from("curriculum_document_topics")
      .update({ review_status: "reviewed", updated_at: new Date().toISOString() })
      .eq("id", topic.id);
    setReviewingTopicId(null);
    if (updateError) {
      setError("Could not save review status: " + updateError.message);
      return;
    }
    await loadIndex();
  };

  const approveNote = async (note: IndexedNote) => {
    if (!isAdmin) return;
    setReviewingTopicId(note.source_topic_id || note.id);
    const { error: updateError } = await (supabase as any)
      .from("curriculum_document_notes")
      .update({
        review_status: "approved",
        publication_status: "published",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", note.id);
    setReviewingTopicId(null);
    if (updateError) {
      setError("Could not approve note: " + updateError.message);
      return;
    }
    await loadIndex();
  };

  const visibleTopics = useMemo(
    () =>
      topics.filter(
        (topic) => selectedLevel === "All levels" || topic.level_label === selectedLevel,
      ),
    [topics, selectedLevel],
  );

  const countFor = (documentId: string) =>
    visibleTopics.filter((topic) => topic.source_document_id === documentId).length;

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-primary/25 bg-card/70 shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-muted/30"
        aria-expanded={expanded}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold">NCDC AEP curriculum index</h2>
            <p className="text-xs text-muted-foreground">
              Physics and Biology · Levels 1–2 · {topics.length} indexed headings
            </p>
          </div>
        </div>
        <ChevronDown
          className={`h-5 w-5 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-border p-4">
          <p className="text-sm text-muted-foreground">
            These are Accelerated Education Programme (AEP) levels from the source syllabi. They are
            kept separate from Senior 1–6 until an official equivalence is confirmed.
          </p>
          {offlineSnapshot && (
            <p
              role="status"
              className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300"
            >
              Offline mode: showing the last cached index. Reconnect and refresh to check for
              updates.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {["All levels", ...LEVEL_ORDER].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setSelectedLevel(level)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${selectedLevel === level ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"}`}
              >
                {level}
              </button>
            ))}
            <button
              type="button"
              onClick={() => void loadIndex()}
              className="ml-auto inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>

          {loading && (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading indexed topics from Supabase…
            </div>
          )}
          {!loading && error && (
            <div
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm"
            >
              <p className="font-semibold">Curriculum index unavailable</p>
              <p className="mt-1 text-muted-foreground">{error}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Check the development database migration and read policies. No sample topics are
                substituted.
              </p>
            </div>
          )}
          {!loading && !error && topics.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              Supabase returned no indexed topics. The interface will not invent curriculum entries.
            </div>
          )}

          {!loading &&
            !error &&
            documents.map((document) => {
              const documentTopics = visibleTopics.filter(
                (topic) => topic.source_document_id === document.id,
              );
              if (documentTopics.length === 0) return null;
              return (
                <div key={document.id} className="overflow-hidden rounded-xl border border-border">
                  <div className="flex flex-wrap items-start justify-between gap-3 bg-muted/20 p-3">
                    <div>
                      <h3 className="font-semibold">{document.subject_label}</h3>
                      <p className="text-xs text-muted-foreground">{document.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {document.curriculum_programme} ·{" "}
                        {document.page_count ?? "Page count unknown"} pages ·{" "}
                        {countFor(document.id)} headings
                      </p>
                    </div>
                    {document.source_url && (
                      <a
                        href={document.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted"
                      >
                        <FileText className="h-3.5 w-3.5" /> Official source{" "}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <div className="divide-y divide-border">
                    {documentTopics.map((topic) => (
                      <div key={topic.id} className="flex items-start gap-3 px-3 py-3">
                        <span className="mt-0.5 min-w-8 rounded-md bg-primary/10 px-2 py-1 text-center text-xs font-semibold text-primary">
                          {topic.topic_number}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{topic.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {topic.level_label}
                            {topic.source_page
                              ? ` · Source page ${topic.source_page}`
                              : " · Source page needs review"}
                          </p>
                          {notes
                            .filter((note) => note.source_topic_id === topic.id)
                            .map((note) => (
                              <div
                                key={note.id}
                                className="mt-3 rounded-lg border border-border bg-background/70 p-3"
                              >
                                <p className="text-xs font-semibold">
                                  {note.review_status === "approved" &&
                                  note.publication_status === "published"
                                    ? "Published study note"
                                    : "Original study-note draft"}
                                </p>
                                <p className="mt-1 text-sm leading-relaxed">{note.summary}</p>
                                {note.study_sections?.map((section, index) => (
                                  <div key={section.heading + index} className="mt-2">
                                    <p className="text-xs font-semibold text-muted-foreground">
                                      {section.heading}
                                    </p>
                                    <p className="text-sm">{section.content}</p>
                                  </div>
                                ))}
                                <p className="mt-2 text-[10px] text-muted-foreground">
                                  {note.review_status === "approved" &&
                                  note.publication_status === "published"
                                    ? "Approved and published"
                                    : "Awaiting developer review"}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => downloadNotePdf(note, topic, document)}
                                  className="mt-2 rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
                                >
                                  Download original study-note PDF
                                </button>
                                {isAdmin &&
                                  !(
                                    note.review_status === "approved" &&
                                    note.publication_status === "published"
                                  ) && (
                                    <button
                                      type="button"
                                      disabled={
                                        reviewingTopicId === (note.source_topic_id || note.id)
                                      }
                                      onClick={() => void approveNote(note)}
                                      className="mt-2 rounded-md border border-emerald-600/40 px-2 py-1 text-xs hover:bg-emerald-500/10 disabled:opacity-50"
                                    >
                                      {reviewingTopicId === (note.source_topic_id || note.id)
                                        ? "Saving…"
                                        : "Approve & publish original note"}
                                    </button>
                                  )}
                              </div>
                            ))}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`rounded-full px-2 py-1 text-[10px] ${topic.review_status === "reviewed" || topic.review_status === "approved" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}
                          >
                            {topic.review_status === "reviewed" ||
                            topic.review_status === "approved"
                              ? "Reviewed"
                              : "Needs review"}
                          </span>
                          {isAdmin &&
                            topic.review_status !== "reviewed" &&
                            topic.review_status !== "approved" && (
                              <button
                                type="button"
                                disabled={reviewingTopicId === topic.id}
                                onClick={() => void markTopicReviewed(topic)}
                                className="rounded-md border border-border px-2 py-1 text-[10px] hover:bg-muted disabled:opacity-50"
                              >
                                {reviewingTopicId === topic.id ? "Saving…" : "Mark reviewed"}
                              </button>
                            )}
                          {document.source_url && (
                            <a
                              href={document.source_url}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`Open source for ${topic.title}`}
                              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </section>
  );
}
