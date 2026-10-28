import React, { useState } from "react";
import {
  saveStagedTopic,
  StagedCurriculumTopic,
  getDiagramAssets,
  DiagramAsset,
} from "@/lib/curriculum-store";
import { ScienceSubjectId } from "@/lib/curriculum-parser";
import { SCIENCE_SUBJECTS, CLASS_LEVELS_SCIENCE } from "@/data/scienceCurriculum";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  PenTool,
  Plus,
  Trash2,
  Sparkles,
  BookOpen,
  Calculator,
  ImageIcon,
  CheckCircle2,
  FolderTree,
} from "lucide-react";
import { toast } from "sonner";

interface ManualCurriculumWriterProps {
  onSavedToStaging: (topic: StagedCurriculumTopic) => void;
  authorEmail?: string;
}

export function ManualCurriculumWriter({
  onSavedToStaging,
  authorEmail,
}: ManualCurriculumWriterProps) {
  const [subject, setSubject] = useState<ScienceSubjectId>("physics");
  const [level, setLevel] = useState<number>(3);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  // Subtopics list
  const [subtopics, setSubtopics] = useState<string[]>([
    "Fundamental Physical Principles",
    "Experimental Setup & Observations",
  ]);
  const [newSubtopic, setNewSubtopic] = useState<string>("");

  // Formulas list
  const [formulas, setFormulas] = useState<string[]>([]);
  const [newFormula, setNewFormula] = useState<string>("");

  // Competencies
  const [competencies, setCompetencies] = useState<string[]>([
    "Formulate scientific hypotheses based on empirical data",
  ]);
  const [newCompetency, setNewCompetency] = useState<string>("");

  // Sections
  const [sections, setSections] = useState<{ heading: string; content: string }[]>([
    {
      heading: "Theoretical Foundations",
      content:
        "Secondary science concepts establish rigorous analytical intuition through experimental measurement.",
    },
  ]);

  // Worked Examples
  const [examples, setExamples] = useState<{ problem: string; solution: string }[]>([]);

  // Diagram linking
  const diagramsList = getDiagramAssets();
  const [selectedDiagramPaths, setSelectedDiagramPaths] = useState<string[]>([]);

  const handleAddSubtopic = () => {
    if (newSubtopic.trim()) {
      setSubtopics([...subtopics, newSubtopic.trim()]);
      setNewSubtopic("");
    }
  };

  const handleRemoveSubtopic = (index: number) => {
    setSubtopics(subtopics.filter((_, i) => i !== index));
  };

  const handleAddFormula = () => {
    if (newFormula.trim()) {
      setFormulas([...formulas, newFormula.trim()]);
      setNewFormula("");
    }
  };

  const handleRemoveFormula = (index: number) => {
    setFormulas(formulas.filter((_, i) => i !== index));
  };

  const handleAddCompetency = () => {
    if (newCompetency.trim()) {
      setCompetencies([...competencies, newCompetency.trim()]);
      setNewCompetency("");
    }
  };

  const handleRemoveCompetency = (index: number) => {
    setCompetencies(competencies.filter((_, i) => i !== index));
  };

  const handleAddSection = () => {
    setSections([...sections, { heading: "New Study Section", content: "" }]);
  };

  const handleUpdateSection = (index: number, key: "heading" | "content", value: string) => {
    const updated = [...sections];
    updated[index][key] = value;
    setSections(updated);
  };

  const handleRemoveSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const handleAddExample = () => {
    setExamples([
      ...examples,
      {
        problem: "Calculate the value given standard UNEB examination conditions.",
        solution: "Apply the governing formula and substitute standard empirical values.",
      },
    ]);
  };

  const handleUpdateExample = (index: number, key: "problem" | "solution", value: string) => {
    const updated = [...examples];
    updated[index][key] = value;
    setExamples(updated);
  };

  const handleRemoveExample = (index: number) => {
    setExamples(examples.filter((_, i) => i !== index));
  };

  const toggleDiagramPath = (path: string) => {
    if (selectedDiagramPaths.includes(path)) {
      setSelectedDiagramPaths(selectedDiagramPaths.filter((p) => p !== path));
    } else {
      setSelectedDiagramPaths([...selectedDiagramPaths, path]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please provide a topic title.");
      return;
    }

    const slug = `${subject.slice(0, 3)}-s${level}-${
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 35) || Date.now()
    }`;

    // Map selected diagrams
    const attachedDiagrams = selectedDiagramPaths.map((path) => {
      const match = diagramsList.find((d) => d.virtualPath === path);
      return {
        id: match?.id || `diag-${Date.now()}`,
        virtualPath: path,
        caption: match?.caption,
        dataUrl: match?.dataUrl,
      };
    });

    const staged: StagedCurriculumTopic = {
      id: slug,
      title: title.trim(),
      subject,
      level,
      description: description.trim() || `Structured science curriculum notes for ${title.trim()}.`,
      subtopics: subtopics.length > 0 ? subtopics : ["Fundamental Concepts"],
      competencies,
      formulas,
      sections: sections.filter((s) => s.heading.trim() && s.content.trim()),
      examples,
      diagrams: attachedDiagrams,
      sourceType: "manual",
      sourceName: "Manual Authoring Workbench",
      stagedAt: new Date().toISOString(),
      authorEmail,
    };

    saveStagedTopic(staged);
    onSavedToStaging(staged);
    toast.success("Topic Saved to Staging Deck", {
      description: `"${staged.title}" is ready for developer review & publishing.`,
    });

    // Reset fields
    setTitle("");
    setDescription("");
    setFormulas([]);
    setExamples([]);
    setSelectedDiagramPaths([]);
  };

  return (
    <Card className="border-border bg-card/90 shadow-xl overflow-hidden">
      <CardHeader className="bg-muted/20 border-b border-border/50 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg font-black uppercase tracking-wide flex items-center gap-2">
              <PenTool className="h-5 w-5 text-primary" />
              Manual Curriculum Note Authoring
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Draft comprehensive notes with formulas, diagrams, and worked examples before
              publishing.
            </CardDescription>
          </div>
          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs font-semibold">
            Architect Studio
          </Badge>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="p-6 space-y-6">
          {/* Class & Subject Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Class Level (Senior 1–6)
              </Label>
              <select
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
                className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm font-semibold"
              >
                {CLASS_LEVELS_SCIENCE.map((c) => (
                  <option key={c.level} value={c.level}>
                    {c.label} ({c.short} · {c.phase})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Science Discipline
              </Label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as ScienceSubjectId)}
                className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm font-semibold"
              >
                {SCIENCE_SUBJECTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.unebCode.split("/")[0]})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Topic Title & Description */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Topic Title
              </Label>
              <Input
                placeholder="e.g. Electromagnetic Induction & Lenz's Law"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="h-11 text-sm bg-background font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Topic Summary / Syllabus Overview
              </Label>
              <Textarea
                placeholder="Brief summary of syllabus competencies covered in this unit."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="text-sm bg-background"
              />
            </div>
          </div>

          {/* Subtopics Dynamic List */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Syllabus Subtopics
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add subtopic (e.g. Faraday's Experiments, Eddy Currents)..."
                value={newSubtopic}
                onChange={(e) => setNewSubtopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSubtopic();
                  }
                }}
                className="h-10 text-sm bg-background"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddSubtopic}
                className="h-10 px-3 text-xs font-bold shrink-0"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {subtopics.map((sub, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-border bg-muted/40 text-xs text-foreground"
                >
                  <span>{sub}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtopic(idx)}
                    className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Formulas Dynamic List */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calculator className="h-4 w-4 text-primary" />
              Governing Mathematical &amp; Chemical Formulas
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. ε = -N (dΦ / dt) or PV = nRT..."
                value={newFormula}
                onChange={(e) => setNewFormula(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddFormula();
                  }
                }}
                className="h-10 text-sm font-mono bg-background"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddFormula}
                className="h-10 px-3 text-xs font-bold shrink-0"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Formula
              </Button>
            </div>

            {formulas.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {formulas.map((f, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-primary/30 bg-primary/10 text-xs font-mono text-primary font-bold"
                  >
                    <span>{f}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFormula(idx)}
                      className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Structured Note Sections */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-primary" />
                Curriculum Study Sections
              </Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddSection}
                className="h-8 text-xs font-bold gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Section
              </Button>
            </div>

            <div className="space-y-3">
              {sections.map((sec, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-border bg-card space-y-3 relative group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Input
                      placeholder="Section Heading (e.g. Faraday's Law Formulation)"
                      value={sec.heading}
                      onChange={(e) => handleUpdateSection(idx, "heading", e.target.value)}
                      className="h-9 text-xs font-bold bg-background max-w-md"
                    />
                    {sections.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveSection(idx)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Textarea
                    placeholder="Comprehensive explanation, scientific definitions, and experimental observations..."
                    value={sec.content}
                    onChange={(e) => handleUpdateSection(idx, "content", e.target.value)}
                    rows={3}
                    className="text-xs bg-background leading-relaxed"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Worked Classroom Examples */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Worked Classroom Examples &amp; Solutions
              </Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddExample}
                className="h-8 text-xs font-bold gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Example
              </Button>
            </div>

            {examples.length > 0 && (
              <div className="space-y-3">
                {examples.map((ex, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/10 space-y-2.5 relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        Worked Example {idx + 1}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveExample(idx)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Examination Problem (Q:...)"
                      value={ex.problem}
                      onChange={(e) => handleUpdateExample(idx, "problem", e.target.value)}
                      className="h-9 text-xs font-medium bg-background"
                    />
                    <Textarea
                      placeholder="Step-by-step Solution (A:...)"
                      value={ex.solution}
                      onChange={(e) => handleUpdateExample(idx, "solution", e.target.value)}
                      rows={2}
                      className="text-xs bg-background leading-relaxed"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Diagram Directory Linker */}
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ImageIcon className="h-4 w-4 text-primary" />
              Attach Diagrams from Scientific Directory
            </Label>
            {diagramsList.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No diagrams in directory yet. Use the "Diagram Assets" tab to upload scientific
                figures.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {diagramsList.map((d) => {
                  const isAttached = selectedDiagramPaths.includes(d.virtualPath);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDiagramPath(d.virtualPath)}
                      className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                        isAttached
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border bg-card/60 hover:bg-muted/40"
                      }`}
                    >
                      {d.dataUrl && (
                        <img
                          src={d.dataUrl}
                          alt={d.name}
                          className="h-10 w-10 object-contain rounded bg-black/40 border border-border shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground truncate">{d.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono truncate">
                          {d.virtualPath}
                        </p>
                      </div>
                      {isAttached && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="bg-muted/10 border-t border-border/50 p-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            Author:{" "}
            <span className="text-foreground font-semibold">
              {authorEmail || "System Developer"}
            </span>{" "}
            · Notes stage for review before publishing.
          </div>
          <Button
            type="submit"
            className="w-full sm:w-auto h-11 px-6 font-bold text-xs uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Stage Topic for Review
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
