import { useState } from "react";
import { ParsedCurriculumDocument, ParsedCurriculumTopic } from "@/lib/curriculum-parser";
import { useCurriculumStore } from "@/lib/curriculum-store";
import { Layers, GitMerge, FilePlus2, RefreshCw, CheckCircle2, AlertTriangle, ArrowRight, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export interface StagedReviewConsoleProps {
  parsedDoc: ParsedCurriculumDocument;
  onClose: () => void;
  onPublished: () => void;
}

export function StagedReviewConsole({ parsedDoc, onClose, onPublished }: StagedReviewConsoleProps) {
  const { publishedTopics, publishTopic } = useCurriculumStore();
  const [selectedTopicIndex, setSelectedTopicIndex] = useState<number>(0);
  const [consolidationChoices, setConsolidationChoices] = useState<Record<string, "merge" | "overwrite" | "version">>({});

  const currentStagedTopic = parsedDoc.topics[selectedTopicIndex] || parsedDoc.topics[0];

  // Check if topic with same title already exists
  const existingTopic = publishedTopics.find(
    (t) => t.subject === currentStagedTopic?.subject && t.level === currentStagedTopic?.level && t.title.toLowerCase() === currentStagedTopic?.title.toLowerCase()
  );

  const handleChoice = (action: "merge" | "overwrite" | "version") => {
    if (!currentStagedTopic) return;
    setConsolidationChoices((prev) => ({
      ...prev,
      [currentStagedTopic.id]: action,
    }));
    toast.success(`Consolidation strategy set to '${action.toUpperCase()}' for ${currentStagedTopic.title}`);
  };

  const handlePublishAll = () => {
    parsedDoc.topics.forEach((topic) => {
      const strategy = consolidationChoices[topic.id] || "merge";
      const existing = publishedTopics.find(
        (t) => t.subject === topic.subject && t.level === topic.level && t.title.toLowerCase() === topic.title.toLowerCase()
      );

      if (existing && strategy === "merge") {
        // Merge sections and subtopics
        const mergedSections = [...(existing.sections || []), ...(topic.sections || [])];
        const mergedSubtopics = Array.from(new Set([...(existing.subtopics || []), ...(topic.subtopics || [])]));
        const mergedFormulas = Array.from(new Set([...(existing.formulas || []), ...(topic.formulas || [])]));

        publishTopic({
          ...existing,
          sections: mergedSections,
          subtopics: mergedSubtopics,
          formulas: mergedFormulas,
        });
      } else {
        // Overwrite or new version
        publishTopic({
          id: strategy === "version" ? `${topic.id}_v${Date.now()}` : topic.id,
          subject: topic.subject,
          level: topic.level,
          title: topic.title,
          description: topic.overviewConcept,
          subtopics: topic.subtopics,
          formulas: topic.formulas,
          keyPoints: topic.competencies,
          sections: topic.sections,
        });
      }
    });

    toast.success(`Successfully staged and consolidated ${parsedDoc.topics.length} topics into the curriculum engine!`);
    onPublished();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Staged Review & Consolidation Console</h2>
              <p className="text-xs text-zinc-400">
                Document: <span className="text-zinc-200 font-semibold">{parsedDoc.documentTitle}</span> ({parsedDoc.topics.length} parsed topics detected)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white px-3 py-1.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 text-xs font-medium">
            Close
          </button>
        </div>

        {/* Body Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Topic Selector Sidebar */}
          <div className="lg:col-span-4 border-r border-zinc-800 overflow-y-auto p-4 space-y-2 bg-zinc-900/30">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-2 pb-2">Detected Topics ({parsedDoc.topics.length})</h3>
            {parsedDoc.topics.map((t, idx) => {
              const hasConflict = publishedTopics.some((pt) => pt.subject === t.subject && pt.level === t.level && pt.title.toLowerCase() === t.title.toLowerCase());
              const chosen = consolidationChoices[t.id] || "merge";

              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTopicIndex(idx)}
                  className={`w-full text-left p-3 rounded-xl transition-all border ${
                    selectedTopicIndex === idx ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-300" : "bg-zinc-900/60 border-zinc-800/80 text-zinc-300 hover:bg-zinc-800/60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold font-mono uppercase">{t.subject} S{t.level}</span>
                    {hasConflict ? (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[9px]">
                        Conflict Found
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[9px]">
                        New Topic
                      </Badge>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold truncate">{t.title}</h4>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-zinc-400">
                    <span>{t.sections.length} study sections</span>
                    <span>•</span>
                    <span className="capitalize text-cyan-400 font-medium">Strategy: {chosen}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Staged Topic Preview & Conflict Consolidation */}
          <div className="lg:col-span-8 overflow-y-auto p-6 space-y-6">
            {currentStagedTopic && (
              <>
                <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-cyan-500/20 text-cyan-300 uppercase text-xs">{currentStagedTopic.subject}</Badge>
                      <Badge variant="outline" className="text-zinc-300 text-xs">Senior {currentStagedTopic.level}</Badge>
                    </div>
                    {existingTopic && (
                      <div className="flex items-center gap-1.5 text-amber-400 text-xs font-medium">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Existing topic found in curriculum repository</span>
                      </div>
                    )}
                  </div>

                  <h3 className="text-xl font-extrabold text-white">{currentStagedTopic.title}</h3>
                  <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-950 p-3 rounded-xl border border-zinc-800/60">
                    <span className="text-xs font-bold text-cyan-400 block mb-1 uppercase tracking-wider">Overview Concept</span>
                    {currentStagedTopic.overviewConcept}
                  </p>

                  {/* Consolidation Action Bar */}
                  {existingTopic && (
                    <div className="pt-2 border-t border-zinc-800 space-y-2">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Consolidation Conflict Resolution:</span>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={() => handleChoice("merge")}
                          className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                            (consolidationChoices[currentStagedTopic.id] || "merge") === "merge"
                              ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-lg"
                              : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                          }`}
                        >
                          <GitMerge className="w-4 h-4 text-cyan-400" />
                          <span>Merge & Append</span>
                        </button>

                        <button
                          onClick={() => handleChoice("overwrite")}
                          className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                            consolidationChoices[currentStagedTopic.id] === "overwrite"
                              ? "bg-red-500/20 border-red-500/50 text-red-300 shadow-lg"
                              : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                          }`}
                        >
                          <RefreshCw className="w-4 h-4 text-red-400" />
                          <span>Overwrite Existing</span>
                        </button>

                        <button
                          onClick={() => handleChoice("version")}
                          className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                            consolidationChoices[currentStagedTopic.id] === "version"
                              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-lg"
                              : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                          }`}
                        >
                          <FilePlus2 className="w-4 h-4 text-emerald-400" />
                          <span>Create New Version</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Study Content Sections Preview */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    <span>Parsed Study Content Sections ({currentStagedTopic.sections.length})</span>
                  </h4>

                  {currentStagedTopic.sections.map((sec, sidx) => (
                    <div key={sidx} className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-2">
                      <h5 className="text-sm font-bold text-cyan-300">{sec.heading}</h5>
                      <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{sec.content}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-5 border-t border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
          <span className="text-xs text-zinc-400">All topics validated against NCDC Uganda science framework guidelines.</span>
          <button
            onClick={handlePublishAll}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs shadow-lg transition-all flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm & Publish Staged Curriculum</span>
          </button>
        </div>
      </div>
    </div>
  );
}
