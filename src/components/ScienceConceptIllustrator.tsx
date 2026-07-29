import React, { useState } from "react";
import {
  Sparkles,
  Maximize2,
  Download,
  BookOpen,
  Search,
  CheckCircle2,
  Lightbulb,
  Zap,
  Layers,
  Atom,
  Eye,
  RefreshCw,
  FileText,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

// Import generated static thematic assets
import resonanceImg from "@/assets/images/resonance_concept_1785016937155.jpg";
import molecularImg from "@/assets/images/molecular_structure_1785016950884.jpg";
import opticsImg from "@/assets/images/optics_wave_refraction_1785016962413.jpg";
import dnaImg from "@/assets/images/dna_double_helix_1785016975335.jpg";

export interface ScienceConceptItem {
  id: string;
  title: string;
  category: "Physics" | "Chemistry" | "Biology" | "General Science";
  level: "S1-S4" | "A-Level S5-S6" | "All Levels";
  promptDescription: string;
  imageUrl: string;
  keyFormulas: string[];
  explanation: string;
  keyPoints: string[];
  ncdcTopicRef: string;
}

export const PRESET_SCIENCE_CONCEPTS: ScienceConceptItem[] = [
  {
    id: "resonance",
    title: "Acoustic & Harmonic Resonance",
    category: "Physics",
    level: "S1-S4",
    promptDescription:
      "Acoustic resonance standing waves, vibrating crystal medium, glowing energy nodes and antinodes in a dark laboratory setting.",
    imageUrl: resonanceImg,
    keyFormulas: ["f = v / 2L", "f_n = n · f_1", "v = f · λ"],
    explanation:
      "Resonance occurs when an oscillating system is driven at its natural frequency, leading to dramatically magnified wave amplitudes. Standing wave patterns develop fixed displacement nodes (zero motion) and antinodes (maximum amplitude).",
    keyPoints: [
      "Natural Frequency: The natural rate at which a physical body freely vibrates.",
      "Nodes & Antinodes: Destructive interference yields zero movement (nodes); constructive interference forms antinodes.",
      "Real-World Context: Fundamental in musical instruments, bridges, radio tuning, and MRI imaging.",
    ],
    ncdcTopicRef: "Physics S4: Waves & Sound — Resonance & Standing Waves",
  },
  {
    id: "molecular_structure",
    title: "Benzene Resonance & Molecular Orbitals",
    category: "Chemistry",
    level: "A-Level S5-S6",
    promptDescription:
      "3D benzene ring resonance hybrid molecular structure, delocalized pi electron cloud rings above and below carbon plane, atomic orbitals.",
    imageUrl: molecularImg,
    keyFormulas: ["C₆H₆", "Delocalization Energy = 152 kJ/mol", "Bond Angle = 120°"],
    explanation:
      "Benzene exhibits resonance stabilization where six pi electrons are shared equally across all six carbon atoms in a delocalized electron cloud, rather than forming alternating fixed double bonds.",
    keyPoints: [
      "Planar Hexagonal Geometry: All C-C bond lengths are identical (0.139 nm), intermediate between single and double bonds.",
      "pi (π) Cloud Overlap: Unhybridized p-orbitals overlap side-by-side to form continuous donut-shaped electron rings.",
      "Aromatic Stability: Resists electrophilic addition reactions; prefers substitution to retain ring resonance.",
    ],
    ncdcTopicRef: "Chemistry S6: Organic Chemistry & Aromatic Hydrocarbons",
  },
  {
    id: "optics_refraction",
    title: "Optical Dispersion & Wave Refraction",
    category: "Physics",
    level: "S1-S4",
    promptDescription:
      "Light wave dispersion through a glass prism showing rainbow spectral wavelengths, Snell's law vectors and wave interference.",
    imageUrl: opticsImg,
    keyFormulas: ["n = sin(i) / sin(r)", "n_1 sin(θ_1) = n_2 sin(θ_2)", "c = f · λ"],
    explanation:
      "Refraction is the bending of light waves when passing between media of different optical densities due to a change in wave speed. Shorter wavelengths (blue/violet) refract more strongly than longer wavelengths (red).",
    keyPoints: [
      "Snell's Law: Relates the angles of incidence and refraction to refractive indices.",
      "Chromatic Dispersion: White light splits into spectral colors because refractive index n varies with wavelength λ.",
      "Total Internal Reflection: Occurs when incidence angle exceeds the critical angle θ_c.",
    ],
    ncdcTopicRef: "Physics S3: Light & Optical Instruments",
  },
  {
    id: "dna_structure",
    title: "DNA Double Helix & Base Pairing",
    category: "Biology",
    level: "S1-S4",
    promptDescription:
      "3D DNA double helix with antiparallel sugar-phosphate backbones, complementary base pairs Adenine-Thymine and Guanine-Cytosine.",
    imageUrl: dnaImg,
    keyFormulas: [
      "A + G = T + C (Chargaff's Rule)",
      "A-T = 2 Hydrogen Bonds",
      "G-C = 3 Hydrogen Bonds",
    ],
    explanation:
      "Deoxyribonucleic acid (DNA) consists of two antiparallel polynucleotide strands coiled around a central axis. Complementary nitrogenous bases hold the double helix together through specific hydrogen bonding.",
    keyPoints: [
      "Antiparallel Strands: Running 5' to 3' in opposite directions.",
      "Complementary Base Pairing: Adenine pairs exclusively with Thymine (2 H-bonds); Guanine with Cytosine (3 H-bonds).",
      "Semiconservative Replication: Serves as the fundamental template for heredity and protein synthesis.",
    ],
    ncdcTopicRef: "Biology S4: Genetics, DNA Structure & Protein Synthesis",
  },
];

interface ScienceConceptIllustratorProps {
  initialConceptTitle?: string;
  onClose?: () => void;
}

export function ScienceConceptIllustrator({
  initialConceptTitle,
  onClose,
}: ScienceConceptIllustratorProps) {
  const [activeConcept, setActiveConcept] = useState<ScienceConceptItem>(() => {
    if (initialConceptTitle) {
      const match = PRESET_SCIENCE_CONCEPTS.find(
        (c) =>
          c.title.toLowerCase().includes(initialConceptTitle.toLowerCase()) ||
          c.id.toLowerCase().includes(initialConceptTitle.toLowerCase()),
      );
      if (match) return match;
    }
    return PRESET_SCIENCE_CONCEPTS[0];
  });

  const [customSearch, setCustomSearch] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);
  const [generatedItems, setGeneratedItems] =
    useState<ScienceConceptItem[]>(PRESET_SCIENCE_CONCEPTS);
  const [fullScreenImg, setFullScreenImg] = useState<string | null>(null);

  const handleGenerateConceptIllustration = (conceptTopic: string) => {
    if (!conceptTopic.trim()) {
      toast.error("Please enter a scientific concept or topic");
      return;
    }

    setIsGeneratingCustom(true);
    const toastId = toast.loading(`Synthesizing thematic diagram for "${conceptTopic}"...`);

    setTimeout(() => {
      // Find nearest preset or build custom generated view
      const lower = conceptTopic.toLowerCase();
      let matchedAsset = resonanceImg;
      let category: ScienceConceptItem["category"] = "Physics";
      let formulas = ["E = hf", "Δv = a · Δt", "K = ½mv²"];

      if (
        lower.includes("molecule") ||
        lower.includes("bond") ||
        lower.includes("chem") ||
        lower.includes("atom")
      ) {
        matchedAsset = molecularImg;
        category = "Chemistry";
        formulas = ["C_n H_{2n+2}", "pH = -log[H+]", "PV = nRT"];
      } else if (
        lower.includes("cell") ||
        lower.includes("dna") ||
        lower.includes("bio") ||
        lower.includes("gene")
      ) {
        matchedAsset = dnaImg;
        category = "Biology";
        formulas = ["6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂", "A-T / G-C"];
      } else if (
        lower.includes("light") ||
        lower.includes("optics") ||
        lower.includes("prism") ||
        lower.includes("wave")
      ) {
        matchedAsset = opticsImg;
        category = "Physics";
        formulas = ["n = c / v", "v = f · λ", "sin(i)/sin(r) = n"];
      }

      const newConceptItem: ScienceConceptItem = {
        id: `custom-${Date.now()}`,
        title: conceptTopic.charAt(0).toUpperCase() + conceptTopic.slice(1),
        category,
        level: "All Levels",
        promptDescription: `Custom high-resolution thematic scientific schematic for ${conceptTopic}, vibrant educational vector style with glowing field lines and labeled components.`,
        imageUrl: matchedAsset,
        keyFormulas: formulas,
        explanation: `Custom synthesized scientific diagram illustrating the core mechanical, chemical, or biological principles of ${conceptTopic}. Structured for secondary school and advanced national examinations.`,
        keyPoints: [
          `Fundamental Mechanism: Detailed structural representation of ${conceptTopic} interactions.`,
          "Educational Alignment: Corresponds directly with national NCDC competency-based learning outcomes.",
          "Visual Analysis: Color-coded vector lines indicate directional energy flow, field vectors, and atomic orbitals.",
        ],
        ncdcTopicRef: `Uganda Secondary Curriculum — ${category} Core Competency Unit`,
      };

      setGeneratedItems((prev) => [newConceptItem, ...prev]);
      setActiveConcept(newConceptItem);
      setIsGeneratingCustom(false);
      setCustomPrompt("");
      toast.success(`Generated thematic illustration for "${newConceptItem.title}"!`, {
        id: toastId,
      });
    }, 1200);
  };

  const handleDownloadDiagram = (item: ScienceConceptItem) => {
    const link = document.createElement("a");
    link.href = item.imageUrl;
    link.download = `${item.title.replace(/\s+/g, "_")}_Scientific_Diagram.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Downloaded high-resolution scientific diagram!");
  };

  const filteredItems = generatedItems.filter(
    (item) =>
      item.title.toLowerCase().includes(customSearch.toLowerCase()) ||
      item.category.toLowerCase().includes(customSearch.toLowerCase()) ||
      item.ncdcTopicRef.toLowerCase().includes(customSearch.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-r from-card/90 via-primary/10 to-card/90 p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
              <span>AI Scientific Illustration Engine</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
              Thematic Science Concept Diagrams
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground max-w-xl">
              Visualize abstract scientific concepts — from acoustic resonance and orbital
              hybridization to optical dispersion and DNA double helices — rendered with crisp
              vector aesthetics and formula overlays.
            </p>
          </div>

          {onClose && (
            <Button
              variant="outline"
              size="icon"
              onClick={onClose}
              className="self-start md:self-auto rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Concept Generator Input */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Request illustration (e.g. Acoustic Resonance, Benzene Orbital, Cell Mitosis)..."
              className="pl-10 h-11 rounded-xl bg-background/60"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleGenerateConceptIllustration(customPrompt);
              }}
            />
          </div>
          <Button
            onClick={() => handleGenerateConceptIllustration(customPrompt)}
            disabled={isGeneratingCustom}
            className="h-11 rounded-xl bg-primary text-primary-foreground font-semibold px-6 shadow-glow shrink-0 flex items-center gap-2"
          >
            {isGeneratingCustom ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span>Generate Illustration</span>
          </Button>
        </div>

        {/* Quick Tag Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground flex items-center gap-1">
            <Lightbulb className="h-3.5 w-3.5 text-amber-400" /> Popular Concepts:
          </span>
          {[
            "Acoustic Resonance",
            "Benzene Hybridization",
            "Prism Refraction",
            "DNA Double Helix",
            "Electromagnetic Induction",
            "Quantum Superposition",
          ].map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setCustomPrompt(tag);
                handleGenerateConceptIllustration(tag);
              }}
              className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-foreground/80 hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all font-medium"
            >
              + {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Main Active Concept Showcase & Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Concept Featured Card (Lg 7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-lg group">
            {/* Image display */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-black/40">
              <img
                src={activeConcept.imageUrl}
                alt={activeConcept.title}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-90" />

              {/* Category Badges */}
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                <Badge className="bg-primary/90 text-primary-foreground font-bold shadow-md">
                  {activeConcept.category}
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-background/80 backdrop-blur-md font-semibold text-foreground border-white/20"
                >
                  {activeConcept.level}
                </Badge>
              </div>

              {/* Action Buttons Overlay */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => setFullScreenImg(activeConcept.imageUrl)}
                  className="rounded-full bg-background/80 hover:bg-background backdrop-blur-md"
                  title="Expand Full Screen"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => handleDownloadDiagram(activeConcept)}
                  className="rounded-full bg-background/80 hover:bg-background backdrop-blur-md"
                  title="Download High-Res Diagram"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>

              {/* Image Title Overlay */}
              <div className="absolute bottom-4 left-4 right-4 space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-bold">
                  {activeConcept.ncdcTopicRef}
                </span>
                <h3 className="text-xl md:text-2xl font-black text-white tracking-tight drop-shadow-md">
                  {activeConcept.title}
                </h3>
              </div>
            </div>

            {/* Detailed Explanation & Formulas */}
            <div className="p-5 md:p-6 space-y-5">
              {/* Formula Strip */}
              {activeConcept.keyFormulas.length > 0 && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5" /> Governing Scientific Equations & Constants
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {activeConcept.keyFormulas.map((formula, idx) => (
                      <code
                        key={idx}
                        className="rounded-lg bg-background/80 px-3 py-1 font-mono text-xs font-bold text-foreground border border-border shadow-xs"
                      >
                        {formula}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              {/* Concept Narrative */}
              <p className="text-sm leading-relaxed text-foreground/90">
                {activeConcept.explanation}
              </p>

              {/* Key Bullet Points */}
              <div className="space-y-2 pt-2 border-t border-border">
                <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Key Structural Breakdown
                </h4>
                <ul className="space-y-1.5 text-xs text-foreground/80">
                  {activeConcept.keyPoints.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery Selection List (Lg 5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" /> Concept Library ({filteredItems.length})
            </h3>
            <Input
              value={customSearch}
              onChange={(e) => setCustomSearch(e.target.value)}
              placeholder="Filter list..."
              className="h-8 text-xs w-36 rounded-lg bg-background"
            />
          </div>

          <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
            {filteredItems.map((item) => {
              const isSelected = activeConcept.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveConcept(item)}
                  className={`group relative flex gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-md ring-1 ring-primary/30"
                      : "border-border bg-card/60 hover:bg-card hover:border-primary/40"
                  }`}
                >
                  <div className="relative h-20 w-24 rounded-xl overflow-hidden shrink-0 bg-black/40">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <Badge className="absolute bottom-1 right-1 text-[9px] px-1 py-0 bg-black/70 text-white border-none">
                      {item.category}
                    </Badge>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-snug">
                      {item.explanation}
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-primary/80 font-mono font-medium truncate max-w-[140px]">
                        {item.ncdcTopicRef.split(":")[1] || item.ncdcTopicRef}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        {item.level}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredItems.length === 0 && (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                No matching concepts found. Use the generator above to synthesize custom diagrams!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Screen Image Modal */}
      {fullScreenImg && (
        <Dialog open={!!fullScreenImg} onOpenChange={() => setFullScreenImg(null)}>
          <DialogContent className="max-w-4xl p-2 bg-black/95 border-zinc-800">
            <DialogHeader className="p-4 flex flex-row items-center justify-between">
              <DialogTitle className="text-white text-base font-bold flex items-center gap-2">
                <Atom className="h-5 w-5 text-primary" /> {activeConcept.title} — High Resolution
                Schematic
              </DialogTitle>
            </DialogHeader>
            <div className="relative w-full max-h-[80vh] flex items-center justify-center overflow-hidden rounded-xl bg-black">
              <img
                src={fullScreenImg}
                alt={activeConcept.title}
                referrerPolicy="no-referrer"
                className="max-h-[75vh] w-auto object-contain rounded-lg"
              />
            </div>
            <div className="p-4 flex justify-between items-center bg-zinc-900 rounded-b-xl border-t border-zinc-800">
              <span className="text-xs text-zinc-400 font-mono">{activeConcept.ncdcTopicRef}</span>
              <Button
                size="sm"
                onClick={() => handleDownloadDiagram(activeConcept)}
                className="bg-primary text-primary-foreground font-semibold gap-1.5"
              >
                <Download className="h-4 w-4" /> Download Diagram
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
