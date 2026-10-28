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

export function AepCurriculumIndex({ standalone = false }: { standalone?: boolean }) {
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
    <section
      className={
        standalone
          ? "mx-auto w-full max-w-7xl overflow-hidden bg-background"
          : "mb-6 overflow-hidden rounded-2xl border border-primary/25 bg-card/70 shadow-sm"
      }
    >
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
            <h2 className="font-semibold">
              {standalone ? "Accelerated Education Programme" : "NCDC AEP curriculum index"}
            </h2>
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
        <div
          className={
            standalone
              ? "space-y-6 border-t border-border px-3 py-5 sm:px-6 lg:px-8"
              : "space-y-4 border-t border-border p-4"
          }
        >
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
                    {documentTopics.map((topic) => {
                      const topicNotes = notes.filter((note) => note.source_topic_id === topic.id);
                      const publishedNote = topicNotes.find(
                        (note) =>
                          note.review_status === "approved" &&
                          note.publication_status === "published",
                      );
                      const note = publishedNote || topicNotes[0];
                      const sourcePageUrl =
                        document.source_url && topic.source_page
                          ? document.source_url + "#page=" + topic.source_page
                          : document.source_url;
                      return (
                        <details key={topic.id} className="group">
                          <summary className="flex cursor-pointer list-none items-start gap-3 px-4 py-4 hover:bg-muted/30 sm:px-5">
                            <span className="mt-0.5 min-w-9 rounded-lg bg-primary/10 px-2 py-1.5 text-center text-xs font-semibold text-primary">
                              {topic.topic_number}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold leading-6 sm:text-base">
                                {topic.title}
                              </span>
                              <span className="mt-1 block text-xs text-muted-foreground">
                                {topic.level_label}
                                {topic.source_page
                                  ? " · Source page " + topic.source_page
                                  : " · Source page needs review"}
                              </span>
                            </span>
                            <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                          </summary>
                          <div className="space-y-4 bg-muted/10 px-4 pb-5 pt-1 sm:px-16">
                            {note ? (
                              <article className="max-w-4xl space-y-4">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    {publishedNote ? "Published study aid" : "Draft study aid"}
                                  </p>
                                  <h4 className="mt-1 text-lg font-semibold">{note.title}</h4>
                                  <p className="mt-2 text-sm leading-7">{note.summary}</p>
                                </div>
                                {(note.study_sections || []).map((section, index) => (
                                  <section
                                    key={section.heading + index}
                                    className="rounded-xl border border-border bg-card p-4"
                                  >
                                    <h5 className="text-sm font-semibold">{section.heading}</h5>
                                    <p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                                      {section.content}
                                    </p>
                                  </section>
                                ))}
                                <div className="flex flex-wrap gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => downloadNotePdf(note, topic, document)}
                                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted"
                                  >
                                    <FileText className="h-4 w-4" /> Download study aid PDF
                                  </button>
                                  {sourcePageUrl && (
                                    <a
                                      href={sourcePageUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                                    >
                                      <ExternalLink className="h-4 w-4" /> Open official syllabus
                                      {topic.source_page ? " at page " + topic.source_page : ""}
                                    </a>
                                  )}
                                  {isAdmin && note.review_status !== "approved" && (
                                    <button
                                      type="button"
                                      disabled={
                                        reviewingTopicId === (note.source_topic_id || note.id)
                                      }
                                      onClick={() => void approveNote(note)}
                                      className="rounded-lg border border-emerald-600/40 px-3 py-2 text-sm hover:bg-emerald-500/10 disabled:opacity-50"
                                    >
                                      {reviewingTopicId === (note.source_topic_id || note.id)
                                        ? "Saving…"
                                        : "Approve & publish study aid"}
                                    </button>
                                  )}
                                </div>
                              </article>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No study aid is linked to this topic yet. Open the official syllabus
                                to study the source material.
                              </p>
                            )}
                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                              <span className="text-xs text-muted-foreground">
                                Source: {document.title}
                                {topic.source_page ? " · printed page " + topic.source_page : ""}
                              </span>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`rounded-full px-2 py-1 text-xs ${topic.review_status === "reviewed" || topic.review_status === "approved" ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-700"}`}
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
                                      className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-50"
                                    >
                                      {reviewingTopicId === topic.id ? "Saving…" : "Mark reviewed"}
                                    </button>
                                  )}
                              </div>
                            </div>
                          </div>
                        </details>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </section>
  );
}
