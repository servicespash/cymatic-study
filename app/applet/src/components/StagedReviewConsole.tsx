import React, { useState } from "react";
import { ParsedTopic, CurriculumParser } from "@/lib/curriculum-parser";
import { assetManager, CurriculumAsset } from "@/lib/asset-manager";
import { Upload, FileText, Image as ImageIcon, AlertTriangle, CheckCircle, RefreshCw, Layers, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { topics as initialTopics } from "@/data/topics";

export function StagedReviewConsole() {
  const [stagedTopics, setStagedTopics] = useState<ParsedTopic[]>([]);
  const [selectedTopicIndex, setSelectedTopicIndex] = useState<number | null>(null);
  const [conflictModal, setConflictModal] = useState<{
    isOpen: boolean;
    existingTopic: any;
    newTopic: ParsedTopic;
  } | null>(null);
  const [assets, setAssets] = useState<CurriculumAsset[]>(assetManager.getAllAssets());
  const [isParsing, setIsParsing] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsParsing(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith("image/") || file.name.match(/\.(png|jpg|jpeg|webp)$/i)) {
          const asset = await assetManager.registerAsset(file);
          setAssets(assetManager.getAllAssets());
          toast.success(`Registered asset: ${asset.name} (${asset.id})`);
        } else if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
          const text = await file.text();
          const parsed = CurriculumParser.parseText(text);
          setStagedTopics((prev) => [...prev, ...parsed]);
          toast.success(`Parsed ${parsed.length} topics from ${file.name}`);
        } else {
          // For PDFs or other docs, read as text fallback or simulated parse
          const text = await file.text().catch(() => `Document: ${file.name}\n\n[Uploaded PDF Document Content]`);
          const parsed = CurriculumParser.parseText(text);
          setStagedTopics((prev) => [...prev, ...parsed]);
          toast.success(`Parsed ${parsed.length} topics from PDF ${file.name}`);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to parse uploaded document.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleStageTopicCommit = (topic: ParsedTopic) => {
    // Check if topic ID or title already exists in initialTopics or saved curriculum
    const existing = initialTopics.find(
      (t) => t.subject === topic.subject && t.level === topic.level && t.title.toLowerCase() === topic.title.toLowerCase()
    );

    if (existing) {
      setConflictModal({
        isOpen: true,
        existingTopic: existing,
        newTopic: topic,
      });
    } else {
      commitTopicDirectly(topic);
    }
  };

  const commitTopicDirectly = (topic: ParsedTopic, strategy: "add" | "overwrite" | "merge" | "version" = "add") => {
    // Save to local storage staged curriculum
    try {
      const saved = localStorage.getItem("lattys_custom_curriculum") || "[]";
      const list: ParsedTopic[] = JSON.parse(saved);
      if (strategy === "overwrite") {
        const filtered = list.filter((t) => t.id !== topic.id);
        localStorage.setItem("lattys_custom_curriculum", JSON.stringify([...filtered, topic]));
        toast.success(`Overwrote topic: ${topic.title}`);
      } else if (strategy === "merge") {
        const idx = list.findIndex((t) => t.id === topic.id);
        if (idx >= 0) {
          list[idx].subtopics = [...list[idx].subtopics, ...topic.subtopics];
          localStorage.setItem("lattys_custom_curriculum", JSON.stringify(list));
          toast.success(`Merged new subtopics into ${topic.title}`);
        } else {
          localStorage.setItem("lattys_custom_curriculum", JSON.stringify([...list, topic]));
          toast.success(`Added merged topic: ${topic.title}`);
        }
      } else if (strategy === "version") {
        const versionedTopic = { ...topic, id: `${topic.id}-v${Date.now()}`, title: `${topic.title} (v2)` };
        localStorage.setItem("lattys_custom_curriculum", JSON.stringify([...list, versionedTopic]));
        toast.success(`Created new version for: ${topic.title}`);
      } else {
        localStorage.setItem("lattys_custom_curriculum", JSON.stringify([...list, topic]));
        toast.success(`Staged & published topic: ${topic.title}`);
      }
      setStagedTopics((prev) => prev.filter((t) => t.id !== topic.id));
      setConflictModal(null);
    } catch (e) {
      console.error(e);
      toast.error("Failed to commit topic.");
    }
  };

  return (
    <div className="space-y-8 p-6 rounded-2xl bg-card border border-border shadow-sm">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" />
            Developer Console & Staged Review Console
          </h2>
          <p className="text-sm text-muted-foreground">
            Upload textbooks, PDF notes, or curriculum diagrams. The heuristic parser extracts structured study content, while Asset Manager handles inline image references.
          </p>
        </div>
        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold shadow hover:opacity-90 transition">
          {isParsing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          <span>Upload Files (PDF, TXT, Images)</span>
          <input type="file" multiple accept=".txt,.md,.pdf,image/*" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {/* ASSET MANAGER SECTION */}
      <div className="p-5 rounded-xl bg-muted/40 border border-border space-y-4">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-primary" />
          Centralized Asset Management ({assets.length} assets registered)
        </h3>
        {assets.length === 0 ? (
          <p className="text-xs text-muted-foreground">No diagrams or image assets uploaded yet. Upload images to automatically obtain asset IDs (e.g. <code>![diagram](img_123)</code>) for inline lessons rendering.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {assets.map((asset) => (
              <div key={asset.id} className="p-3 rounded-xl bg-card border border-border flex flex-col gap-2">
                <img src={asset.url} alt={asset.name} className="h-24 w-full object-cover rounded-lg border border-border" />
                <div className="text-xs truncate font-mono text-muted-foreground">{asset.id}</div>
                <div className="text-xs font-bold truncate">{asset.name}</div>
                <button
                  onClick={() => {
                    assetManager.deleteAsset(asset.id);
                    setAssets(assetManager.getAllAssets());
                    toast.success("Asset deleted");
                  }}
                  className="text-destructive text-xs flex items-center gap-1 hover:underline"
                >
                  <Trash2 className="h-3 w-3" /> Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* STAGED TOPICS */}
      <div className="space-y-4">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Staged Topics for Review ({stagedTopics.length})
        </h3>
        {stagedTopics.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-dashed border-border text-muted-foreground text-sm">
            No documents staged yet. Upload a curriculum text or PDF file above to begin heuristic extraction.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stagedTopics.map((topic, idx) => (
              <div key={topic.id + idx} className="p-5 rounded-xl bg-card border border-border space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-primary mb-1">
                    <span>{topic.subject.toUpperCase()} • S{topic.level}</span>
                    <span>{topic.subtopics.length} subtopics</span>
                  </div>
                  <h4 className="font-bold text-base">{topic.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{topic.description || "Structured curriculum topic with multi-paragraph explanations."}</p>
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-border">
                  <button
                    onClick={() => setSelectedTopicIndex(idx)}
                    className="flex-1 py-2 rounded-lg bg-muted text-foreground text-xs font-bold hover:bg-muted/80 transition"
                  >
                    Preview Content
                  </button>
                  <button
                    onClick={() => handleStageTopicCommit(topic)}
                    className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition flex items-center justify-center gap-1"
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Stage & Publish
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PREVIEW MODAL */}
      {selectedTopicIndex !== null && stagedTopics[selectedTopicIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-card w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl p-6 space-y-6 border border-border shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-primary">{stagedTopics[selectedTopicIndex].subject.toUpperCase()} • S{stagedTopics[selectedTopicIndex].level}</span>
                <h3 className="text-xl font-bold">{stagedTopics[selectedTopicIndex].title}</h3>
              </div>
              <button
                onClick={() => setSelectedTopicIndex(null)}
                className="px-3 py-1.5 rounded-lg bg-muted text-xs font-bold"
              >
                Close
              </button>
            </div>
            <div className="space-y-4">
              {stagedTopics[selectedTopicIndex].subtopics.map((sub, sIdx) => (
                <div key={sub.id + sIdx} className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
                  <h4 className="font-bold text-sm text-primary">{sub.title}</h4>
                  {sub.sections.map((sec, secIdx) => (
                    <div key={secIdx} className="space-y-1 text-xs">
                      <div className="font-semibold text-foreground/80 uppercase tracking-wide">{sec.sectionTitle} ({sec.type})</div>
                      <div className="whitespace-pre-wrap text-muted-foreground">{sec.content}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CONFLICT CONSOLIDATION MODAL */}
      {conflictModal && conflictModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-card w-full max-w-md rounded-2xl p-6 space-y-4 border border-border shadow-xl">
            <div className="flex items-center gap-3 text-amber-500">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="font-bold text-base text-foreground">Topic Overlap Detected</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              The topic <strong>&quot;{conflictModal.newTopic.title}&quot;</strong> already exists in S{conflictModal.newTopic.level} {conflictModal.newTopic.subject}. Choose how to consolidate:
            </p>
            <div className="space-y-2 pt-2">
              <button
                onClick={() => commitTopicDirectly(conflictModal.newTopic, "merge")}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90"
              >
                <Sparkles className="h-4 w-4" /> Merge Content (Combine Subtopics)
              </button>
              <button
                onClick={() => commitTopicDirectly(conflictModal.newTopic, "version")}
                className="w-full py-2.5 rounded-xl bg-secondary text-secondary-foreground text-xs font-bold hover:opacity-90"
              >
                Create New Version (v2)
              </button>
              <button
                onClick={() => commitTopicDirectly(conflictModal.newTopic, "overwrite")}
                className="w-full py-2.5 rounded-xl bg-destructive/10 text-destructive text-xs font-bold hover:bg-destructive/20"
              >
                Overwrite Existing Topic
              </button>
              <button
                onClick={() => setConflictModal(null)}
                className="w-full py-2 rounded-xl bg-muted text-muted-foreground text-xs font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
