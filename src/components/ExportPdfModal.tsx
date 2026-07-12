import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { exportToBrandedPdf, type BrandedPdfOptions } from "@/lib/branded-pdf-export";
import { ExportPdfInstructionModal } from "./ExportPdfInstructionModal";
import { supabase } from "@/integrations/supabase/client";
import { logRecentActivity, updateSubjectProgress } from "@/lib/offline-db";
import {
  Check,
  Download,
  Palette,
  FileText,
  Globe,
  Info,
  AlertCircle,
  User,
  Building2,
} from "lucide-react";
import { toast } from "sonner";

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subject?: string;
  docType: "study_chart" | "lesson_notes" | "quiz";
  content: {
    sectionTitle: string;
    body:
      | string
      | string[]
      | { key: string; value: string }[]
      | { q: string; options?: string[]; a: string }[];
  }[];
}

export function ExportPdfModal({
  isOpen,
  onClose,
  title,
  subject = "General",
  docType,
  content,
}: ExportPdfModalProps) {
  const [isBW, setIsBW] = useState(false);
  const [paperSize, setPaperSize] = useState<"a4" | "letter">("a4");
  const [language, setLanguage] = useState<"en" | "lg" | "sw">("en");
  const [userName, setUserName] = useState("Guest");
  const [schoolName, setSchoolName] = useState("Independent Study");
  const [showInstructions, setShowInstructions] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch current signed-in user profile info
  useEffect(() => {
    async function getUserName() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", user.id)
            .single();
          if (profile?.full_name) {
            setUserName(profile.full_name);
          } else if (user.email) {
            setUserName(user.email.split("@")[0]);
          }

          const schoolMeta = user.user_metadata?.school_name;
          if (schoolMeta) {
            setSchoolName(schoolMeta);
          }
        }
      } catch (err) {
        console.warn("Could not fetch user profile for PDF:", err);
      }
    }
    getUserName();
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportToBrandedPdf({
        title,
        subject,
        docType,
        content,
        userName,
        schoolName,
        isBlackAndWhite: isBW,
        paperSize,
        language,
      });

      // Log successful export in Dexie activity store
      const categoryLabel =
        docType === "study_chart"
          ? "Study Chart"
          : docType === "lesson_notes"
            ? "Lesson Notes"
            : "Quiz Assessment";
      await logRecentActivity("project", `Exported ${categoryLabel} (${title}) as branded PDF.`);

      // Award progress increment for studying offline documents
      await updateSubjectProgress(subject, 40); // Offline study progress set to 40% threshold

      toast.success("Branded PDF Generated Successfully", {
        description: `Verified document compiled and saved as PDF format.`,
      });
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Failed to compile branded PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-3xl shadow-2xl overflow-hidden p-0">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-indigo-500" />

          <div className="p-6 md:p-8 space-y-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2.5 text-xl font-bold text-white">
                <Download className="w-5.5 h-5.5 text-emerald-400" />
                Export Branded PDF Document
              </DialogTitle>
              <DialogDescription className="text-zinc-400 text-xs mt-1">
                Download a secure, compliance-branded PDF sheet, fitted with validation QR codes,
                layout structures, and Ugandan S1-S4 reference labels.
              </DialogDescription>
            </DialogHeader>

            {/* Customization Grid */}
            <div className="space-y-4">
              {/* Personalization Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-zinc-400" />
                    Student / Holder Name
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full text-xs font-semibold bg-zinc-950 border border-zinc-800 text-white rounded-xl p-3 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                    School / Center
                  </label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="Enter school name"
                    className="w-full text-xs font-semibold bg-zinc-950 border border-zinc-800 text-white rounded-xl p-3 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              {/* Theme Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-zinc-400" />
                  Color Palettes
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setIsBW(false)}
                    className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-semibold transition-all ${
                      !isBW
                        ? "bg-emerald-500/10 border-emerald-500/40 text-white"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <span>Vibrant Color Mode</span>
                    {!isBW && <Check className="w-4 h-4 text-emerald-400" />}
                  </button>
                  <button
                    onClick={() => setIsBW(true)}
                    className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-semibold transition-all ${
                      isBW
                        ? "bg-zinc-800 border-zinc-700 text-white"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <span>Grayscale (Eco B&W)</span>
                    {isBW && <Check className="w-4 h-4 text-zinc-400" />}
                  </button>
                </div>
              </div>

              {/* Format / Paper Size */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-zinc-400" />
                  Paper Page Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaperSize("a4")}
                    className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-semibold transition-all ${
                      paperSize === "a4"
                        ? "bg-indigo-500/10 border-indigo-500/40 text-white"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <span>Standard A4 Size</span>
                    {paperSize === "a4" && <Check className="w-4 h-4 text-indigo-400" />}
                  </button>
                  <button
                    onClick={() => setPaperSize("letter")}
                    className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-semibold transition-all ${
                      paperSize === "letter"
                        ? "bg-indigo-500/10 border-indigo-500/40 text-white"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <span>US Letter Size</span>
                    {paperSize === "letter" && <Check className="w-4 h-4 text-indigo-400" />}
                  </button>
                </div>
              </div>

              {/* Document Language */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-zinc-400" />
                  Document Language Structure
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { code: "en" as const, name: "English" },
                    { code: "lg" as const, name: "Luganda" },
                    { code: "sw" as const, name: "Swahili" },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-xs font-semibold transition-all ${
                        language === lang.code
                          ? "bg-teal-500/10 border-teal-500/40 text-white"
                          : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Instruction Trigger */}
            <div className="flex items-start gap-2 p-3 bg-zinc-950 border border-zinc-800 rounded-2xl">
              <AlertCircle className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-medium text-zinc-300">Prefer direct browser printing?</p>
                <button
                  onClick={() => setShowInstructions(true)}
                  className="text-[11px] text-teal-400 hover:text-teal-300 font-bold underline transition-colors block text-left"
                >
                  View browser print instructions
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-xs font-bold rounded-2xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex-1 py-3 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold rounded-2xl transition-all shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/15 flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                {isExporting ? "Compiling..." : "Download PDF"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ExportPdfInstructionModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
      />
    </>
  );
}
