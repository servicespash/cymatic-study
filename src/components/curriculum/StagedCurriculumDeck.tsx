import React, { useState } from "react";
import {
  StagedCurriculumTopic,
  getStagedTopics,
  removeStagedTopic,
  publishStagedTopic,
  PublishedCurriculumTopic,
  getPublishedTopics,
  unpublishTopic,
} from "@/lib/curriculum-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  CheckCircle2,
  Trash2,
  Eye,
  Sparkles,
  Layers,
  Lock,
  Atom,
  Clock,
  BookOpen,
  Calculator,
  ImageIcon,
  ArrowRight,
  Send,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { DiagramLightboxModal } from "./DiagramLightboxModal";

interface StagedCurriculumDeckProps {
  sessionPasscode?: string;
  onTopicPublished?: (topic: PublishedCurriculumTopic) => void;
}

export function StagedCurriculumDeck({
  sessionPasscode = "",
  onTopicPublished,
}: StagedCurriculumDeckProps) {
  const [staged, setStaged] = useState<StagedCurriculumTopic[]>(() => getStagedTopics());
  const [published, setPublished] = useState<PublishedCurriculumTopic[]>(() =>
    getPublishedTopics(),
  );

  // Preview topic state
  const [previewTopic, setPreviewTopic] = useState<StagedCurriculumTopic | null>(null);

  // Publish confirmation modal state
  const [publishTarget, setPublishTarget] = useState<StagedCurriculumTopic | null>(null);
  const [confirmPasscode, setConfirmPasscode] = useState<string>(sessionPasscode || "");
  const [publishError, setPublishError] = useState<string | null>(null);

  // Lightbox for diagram inspection
  const [lightboxDiagram, setLightboxDiagram] = useState<any | null>(null);

  const refreshData = () => {
    setStaged(getStagedTopics());
    setPublished(getPublishedTopics());
  };

  const handleDiscard = (id: string, title: string) => {
    removeStagedTopic(id);
    refreshData();
    toast.info("Staged Note Discarded", { description: title });
  };

  const handleConfirmPublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!publishTarget) return;

    setPublishError(null);
    const result = publishStagedTopic(publishTarget.id, confirmPasscode);

    if (!result.success) {
      setPublishError(result.message);
      toast.error("Publishing Failed", { description: result.message });
      return;
    }

    toast.success("Curriculum Published Live!", {
      description: result.message,
    });

    if (result.publishedTopic && onTopicPublished) {
      onTopicPublished(result.publishedTopic);
    }

    setPublishTarget(null);
    setConfirmPasscode(sessionPasscode || "");
    refreshData();
  };

  const handleUnpublish = (id: string, title: string) => {
    const result = unpublishTopic(id, sessionPasscode || "290350");
    if (result.success) {
      toast.info("Topic Unpublished", { description: `"${title}" removed from live tree.` });
      refreshData();
    } else {
      toast.error("Unpublish Failed", { description: result.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. STAGED REVIEW TABLE */}
      <Card className="border-border bg-card/90 shadow-xl overflow-hidden">
        <CardHeader className="bg-muted/20 border-b border-border/50 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg font-black uppercase tracking-wide flex items-center gap-2">
                <Layers className="h-5 w-5 text-amber-500" />
                Staged Curriculum Deck (Awaiting Verification)
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Review parsed topics, inspect attached diagrams, and verify before publishing
                directly into S1–S6 Science lessons.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-xs font-bold">
                {staged.length} Staged {staged.length === 1 ? "Topic" : "Topics"}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {staged.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <CheckCircle2 className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-bold text-foreground">Staging Deck Empty</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No notes currently staged for verification. Ingest a PDF or write notes in the
                authoring workspace to review them here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {staged.map((topic) => (
                <div
                  key={topic.id}
                  className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-sm text-foreground">{topic.title}</span>
                      <span className="text-xs text-muted-foreground">
                        Senior {topic.level} · {topic.subject.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Source: {topic.sourceType.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {topic.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                      <span>{topic.subtopics.length} Subtopics</span>
                      <span aria-hidden="true">·</span>
                      <span>{topic.formulas.length} Formulas</span>
                      <span aria-hidden="true">·</span>
                      <span>{topic.sections.length} Sections</span>
                      {topic.diagrams && topic.diagrams.length > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-primary font-semibold flex items-center gap-1">
                            <ImageIcon className="h-3 w-3" />
                            {topic.diagrams.length} Diagram{topic.diagrams.length > 1 ? "s" : ""}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPreviewTopic(topic)}
                      className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Preview Note
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDiscard(topic.id, topic.title)}
                      className="h-8 text-xs text-destructive hover:bg-destructive/10 border-destructive/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Discard
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => {
                        setPublishTarget(topic);
                        setConfirmPasscode(sessionPasscode || "");
                        setPublishError(null);
                      }}
                      className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1 shadow-sm"
                    >
                      <Send className="h-3 w-3" />
                      Verify &amp; Publish
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. CURRENTLY PUBLISHED CURRICULUM TREE */}
      {published.length > 0 && (
        <Card className="border-emerald-500/30 bg-emerald-950/5 shadow-xl">
          <CardHeader className="border-b border-emerald-500/20 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-black uppercase tracking-wide text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Active Published Notes in S1–S6 Curriculum ({published.length})
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  These notes are live, indexed, and searchable in the secondary Science Lessons
                  room.
                </CardDescription>
              </div>
              <Link
                to="/lessons"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:underline"
              >
                <span>View in Sciences Room</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>

          <CardContent className="p-0 divide-y divide-border/60">
            {published.map((pub) => (
              <div
                key={pub.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-foreground truncate">{pub.title}</span>
                    <span className="text-[10px] text-muted-foreground">
                      Senior {pub.level} · {pub.subject.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    Published on {new Date(pub.publishedAt).toLocaleDateString()} ·{" "}
                    {pub.sections.length} sections · {pub.diagrams.length} diagrams
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to="/lessons"
                    search={{ subject: pub.subject, level: pub.level }}
                    className="h-7 px-3 text-[11px] rounded-lg border border-border bg-card flex items-center gap-1 font-semibold text-muted-foreground hover:text-foreground"
                  >
                    <BookOpen className="h-3 w-3" />
                    Open Lesson
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleUnpublish(pub.id, pub.title)}
                    className="h-7 text-[11px] text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    Unpublish
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* PREVIEW NOTE MODAL */}
      {previewTopic && (
        <Dialog open={!!previewTopic} onOpenChange={(open) => !open && setPreviewTopic(null)}>
          <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto bg-card/95 border-border shadow-2xl p-6">
            <DialogHeader className="pb-4 border-b border-border space-y-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-lg font-black tracking-tight text-foreground">
                  {previewTopic.title}
                </DialogTitle>
                <Badge variant="outline" className="text-xs font-mono">
                  Senior {previewTopic.level} · {previewTopic.subject.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{previewTopic.description}</p>
            </DialogHeader>

            <div className="space-y-6 pt-2">
              {/* Formulas */}
              {previewTopic.formulas && previewTopic.formulas.length > 0 && (
                <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    Governing Formulas
                  </p>
                  <div className="space-y-1">
                    {previewTopic.formulas.map((f, i) => (
                      <code
                        key={i}
                        className="block text-xs font-mono text-foreground font-semibold"
                      >
                        {f}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              {/* Subtopics */}
              {previewTopic.subtopics && previewTopic.subtopics.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Syllabus Subtopics
                  </p>
                  <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
                    {previewTopic.subtopics.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sections */}
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Study Content Sections
                </p>
                {previewTopic.sections.map((sec, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-border bg-card/60 space-y-1.5"
                  >
                    <h5 className="text-xs font-bold text-foreground">{sec.heading}</h5>
                    <p className="text-xs text-foreground/80 leading-relaxed font-sans">
                      {sec.content}
                    </p>
                  </div>
                ))}
              </div>

              {/* Attached Diagrams */}
              {previewTopic.diagrams && previewTopic.diagrams.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Attached Scientific Diagrams ({previewTopic.diagrams.length})
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {previewTopic.diagrams.map((d, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-border bg-card p-3 space-y-2 cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => setLightboxDiagram(d)}
                      >
                        {d.dataUrl && (
                          <img
                            src={d.dataUrl}
                            alt="Diagram"
                            className="h-28 w-full object-contain bg-black/40 rounded-lg border border-border/40"
                          />
                        )}
                        <p className="text-[11px] font-mono text-primary truncate">
                          {d.virtualPath}
                        </p>
                        {d.caption && (
                          <p className="text-[10px] text-muted-foreground line-clamp-2">
                            {d.caption}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Worked Examples */}
              {previewTopic.examples && previewTopic.examples.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Worked Classroom Examples
                  </p>
                  <div className="space-y-2">
                    {previewTopic.examples.map((ex, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-950/10 space-y-1 text-xs"
                      >
                        <p className="font-semibold text-foreground">Q: {ex.problem}</p>
                        <p className="text-muted-foreground">A: {ex.solution}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* PUBLISH CONFIRMATION DIALOG */}
      {publishTarget && (
        <Dialog open={!!publishTarget} onOpenChange={(open) => !open && setPublishTarget(null)}>
          <DialogContent className="max-w-md bg-card border-border shadow-2xl p-6">
            <DialogHeader className="space-y-2">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <Send className="h-5 w-5" />
              </div>
              <DialogTitle className="text-base font-black uppercase text-foreground">
                Authorize Curriculum Publication
              </DialogTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Publishing <strong className="text-foreground">"{publishTarget.title}"</strong> will
                immediately register it into Senior {publishTarget.level}{" "}
                {publishTarget.subject.toUpperCase()} lessons and make it searchable for all
                students.
              </CardDescription>
            </DialogHeader>

            <form onSubmit={handleConfirmPublish} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Master Authorization Passcode
                  </span>
                </div>
                <Input
                  type="password"
                  placeholder="Enter security key to authorize publication"
                  value={confirmPasscode}
                  onChange={(e) => setConfirmPasscode(e.target.value)}
                  required
                  className="h-10 text-sm font-mono bg-background"
                />
                <p className="text-[10px] text-muted-foreground">
                  Developer security passcode required to publish into production curriculum.
                </p>
              </div>

              {publishError && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{publishError}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPublishTarget(null)}
                  className="h-9 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Verify &amp; Publish Live
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Diagram Lightbox */}
      <DiagramLightboxModal
        isOpen={!!lightboxDiagram}
        onClose={() => setLightboxDiagram(null)}
        diagram={lightboxDiagram}
      />
    </div>
  );
}
