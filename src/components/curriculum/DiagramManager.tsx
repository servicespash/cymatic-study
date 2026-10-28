import React, { useState } from "react";
import {
  DiagramAsset,
  getDiagramAssets,
  saveDiagramAsset,
  deleteDiagramAsset,
} from "@/lib/curriculum-store";
import { ScienceSubjectId } from "@/lib/curriculum-parser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ImageIcon,
  Upload,
  Copy,
  Trash2,
  Eye,
  Check,
  FolderTree,
  Plus,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { DiagramLightboxModal } from "./DiagramLightboxModal";
import { SCIENCE_SUBJECTS, CLASS_LEVELS_SCIENCE } from "@/data/scienceCurriculum";

interface DiagramManagerProps {
  onSelectDiagram?: (diagram: DiagramAsset) => void;
  selectionMode?: boolean;
}

export function DiagramManager({ onSelectDiagram, selectionMode = false }: DiagramManagerProps) {
  const [diagrams, setDiagrams] = useState<DiagramAsset[]>(() => getDiagramAssets());
  const [activeSubjectFilter, setActiveSubjectFilter] = useState<string>("all");
  const [lightboxDiagram, setLightboxDiagram] = useState<DiagramAsset | null>(null);

  // New diagram form state
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [virtualPath, setVirtualPath] = useState<string>("");
  const [subject, setSubject] = useState<ScienceSubjectId>("biology");
  const [level, setLevel] = useState<number>(3);
  const [caption, setCaption] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string>("");
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    if (!name) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
    if (!virtualPath) {
      const slug = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "_");
      setVirtualPath(`curriculum/${subject}/figures/${slug}`);
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      setPreviewDataUrl(loadEvent.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveDiagram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please provide a name for the diagram.");
      return;
    }
    if (!virtualPath.trim()) {
      toast.error("Please enter a virtual directory path.");
      return;
    }
    if (!previewDataUrl) {
      toast.error("Please select an image file for the diagram.");
      return;
    }

    const newAsset: DiagramAsset = {
      id: `diag-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      virtualPath: virtualPath.trim(),
      subject,
      level,
      caption: caption.trim() || undefined,
      dataUrl: previewDataUrl,
      createdAt: new Date().toISOString(),
    };

    saveDiagramAsset(newAsset);
    setDiagrams(getDiagramAssets());
    setIsAddingNew(false);
    setName("");
    setVirtualPath("");
    setCaption("");
    setSelectedFile(null);
    setPreviewDataUrl("");
    toast.success("Scientific Diagram Asset Saved", {
      description: `Mapped to path: ${newAsset.virtualPath}`,
    });
  };

  const handleDelete = (id: string, path: string) => {
    deleteDiagramAsset(id);
    setDiagrams(getDiagramAssets());
    toast.info("Diagram Asset Removed", { description: path });
  };

  const handleCopyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
    toast.success("Virtual Path Copied", { description: path });
    setTimeout(() => setCopiedPath(null), 2500);
  };

  const filteredDiagrams = diagrams.filter((d) => {
    if (activeSubjectFilter === "all") return true;
    return d.subject === activeSubjectFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Controls & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black uppercase tracking-wide flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-primary" />
            Curriculum Diagram &amp; Image Assets
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Organized scientific figures referenced via directory paths (e.g.,{" "}
            <code className="text-primary font-mono">
              curriculum/physics/circuits/wheatstone_bridge.svg
            </code>
            ).
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsAddingNew(!isAddingNew)}
          className="h-9 text-xs font-bold gap-1.5 self-start sm:self-center"
        >
          {isAddingNew ? (
            "Cancel Upload"
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Upload New Diagram
            </>
          )}
        </Button>
      </div>

      {/* Upload New Diagram Form */}
      {isAddingNew && (
        <Card className="border-primary/30 bg-primary/5 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <CardHeader className="pb-4 border-b border-primary/20">
            <CardTitle className="text-sm font-black uppercase text-foreground flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" />
              Add Scientific Figure to Directory
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Assign virtual folder hierarchy, level, and caption for student lessons.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSaveDiagram}>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Diagram Name / Title
                  </Label>
                  <Input
                    placeholder="e.g. Cross Section of Monocot Leaf"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-10 text-sm bg-background"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Virtual Directory Path
                  </Label>
                  <Input
                    placeholder="curriculum/biology/tissues/monocot_leaf.png"
                    value={virtualPath}
                    onChange={(e) => setVirtualPath(e.target.value)}
                    required
                    className="h-10 text-sm font-mono bg-background"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Used to reference this figure in markdown notes via{" "}
                    <code className="text-primary font-mono">![alt](path)</code>.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Science Discipline
                  </Label>
                  <select
                    value={subject}
                    onChange={(e) => {
                      const newSub = e.target.value as ScienceSubjectId;
                      setSubject(newSub);
                      if (virtualPath.startsWith("curriculum/")) {
                        const parts = virtualPath.split("/");
                        parts[1] = newSub;
                        setVirtualPath(parts.join("/"));
                      }
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-medium"
                  >
                    {SCIENCE_SUBJECTS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Target Class Level
                  </Label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-medium"
                  >
                    {CLASS_LEVELS_SCIENCE.map((c) => (
                      <option key={c.level} value={c.level}>
                        {c.label} ({c.short})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Scientific Caption / Explanation
                </Label>
                <Input
                  placeholder="e.g. Figure 2.3: Vascular bundle arrangement in monocotyledonous stem."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="h-10 text-sm bg-background"
                />
              </div>

              {/* File Picker */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Diagram Image File (PNG, JPG, SVG, WebP)
                </Label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-muted text-xs font-bold cursor-pointer transition-colors">
                    <Upload className="h-4 w-4 text-primary" />
                    <span>Select Image File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-muted-foreground truncate">
                    {selectedFile ? selectedFile.name : "No file chosen"}
                  </span>
                </div>
              </div>

              {previewDataUrl && (
                <div className="p-3 rounded-xl border border-border bg-card/80 max-w-sm">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1.5">
                    Live Asset Preview:
                  </p>
                  <img
                    src={previewDataUrl}
                    alt="Preview"
                    className="max-h-40 rounded-lg object-contain bg-black/30 border border-border/50"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddingNew(false)}
                  className="h-9 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!previewDataUrl}
                  className="h-9 text-xs font-bold bg-primary text-primary-foreground"
                >
                  Save &amp; Register Figure
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      )}

      {/* Filter Tabs by Subject */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveSubjectFilter("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubjectFilter === "all"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/60 text-muted-foreground hover:text-foreground"
          }`}
        >
          All Subjects ({diagrams.length})
        </button>
        {SCIENCE_SUBJECTS.map((s) => {
          const count = diagrams.filter((d) => d.subject === s.id).length;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSubjectFilter(s.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeSubjectFilter === s.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.shortTitle} ({count})
            </button>
          );
        })}
      </div>

      {/* Diagram Grid */}
      {filteredDiagrams.length === 0 ? (
        <div className="p-10 rounded-2xl border border-dashed border-border text-center space-y-2 bg-card/30">
          <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm font-bold text-foreground">No Scientific Diagrams in Directory</p>
          <p className="text-xs text-muted-foreground">
            Click "Upload New Diagram" above to upload laboratory apparatus, biological specimens,
            or circuit diagrams.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDiagrams.map((d) => (
            <div
              key={d.id}
              className="rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/50 transition-all flex flex-col justify-between group shadow-sm"
            >
              <div className="p-3 bg-black/40 relative aspect-video flex items-center justify-center overflow-hidden">
                <img
                  src={d.dataUrl}
                  alt={d.name}
                  className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
                <button
                  onClick={() => setLightboxDiagram(d)}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1"
                >
                  <Eye className="h-4 w-4" />
                  <span>Inspect Figure</span>
                </button>
              </div>

              <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-foreground truncate">{d.name}</h4>
                    <Badge variant="outline" className="text-[9px] uppercase font-mono shrink-0">
                      S.{d.level}
                    </Badge>
                  </div>
                  <p
                    className="text-[11px] text-muted-foreground font-mono truncate"
                    title={d.virtualPath}
                  >
                    {d.virtualPath}
                  </p>
                  {d.caption && (
                    <p className="text-[11px] text-foreground/80 line-clamp-2 leading-relaxed">
                      {d.caption}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyPath(d.virtualPath)}
                    className="h-7 text-[11px] gap-1 px-2 text-muted-foreground hover:text-foreground"
                  >
                    {copiedPath === d.virtualPath ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy Path</span>
                      </>
                    )}
                  </Button>

                  <div className="flex items-center gap-1">
                    {selectionMode && onSelectDiagram && (
                      <Button
                        size="sm"
                        onClick={() => onSelectDiagram(d)}
                        className="h-7 text-[11px] bg-primary text-primary-foreground font-bold px-2.5"
                      >
                        Attach
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(d.id, d.virtualPath)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Remove diagram"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      <DiagramLightboxModal
        isOpen={!!lightboxDiagram}
        onClose={() => setLightboxDiagram(null)}
        diagram={lightboxDiagram}
      />
    </div>
  );
}
