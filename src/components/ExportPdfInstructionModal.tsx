import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Info, Printer, Sparkles, Check, Chrome, Compass, Monitor } from "lucide-react";
import { useState } from "react";

interface ExportPdfInstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportPdfInstructionModal({ isOpen, onClose }: ExportPdfInstructionModalProps) {
  const [activeTab, setActiveTab] = useState<"chrome" | "safari" | "firefox">("chrome");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-2xl shadow-2xl overflow-hidden p-0">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-500" />

        <div className="p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-white">
              <Printer className="w-5 h-5 text-indigo-400" />
              Browser PDF Print Instructions
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs mt-1">
              Follow these simple browser configuration steps to save highly readable, perfectly
              formatted offline study sheets.
            </DialogDescription>
          </DialogHeader>

          {/* Tips block */}
          <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl space-y-2 text-xs">
            <span className="flex items-center gap-1.5 font-bold text-indigo-300">
              <Sparkles className="w-4 h-4 animate-spin-slow" />
              Pro Tips for High-Contrast Printouts
            </span>
            <ul className="space-y-1 text-zinc-300 list-disc list-inside">
              <li>
                Set <strong className="text-white">Destination</strong> as{" "}
                <strong className="text-white">"Save as PDF"</strong> or "Microsoft Print to PDF".
              </li>
              <li>
                Toggle <strong className="text-white">"Background Graphics"</strong> on to retain
                colored highlights, or turn off for pure Black & White text.
              </li>
              <li>
                Set <strong className="text-white">Margins</strong> to{" "}
                <strong className="text-white">"None"</strong> or "Default" for optimum page fit.
              </li>
            </ul>
          </div>

          {/* Browser Selection Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-950 rounded-lg">
            <button
              onClick={() => setActiveTab("chrome")}
              className={`flex items-center justify-center gap-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === "chrome"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Chrome className="w-3.5 h-3.5 text-amber-500" />
              Chrome / Edge
            </button>
            <button
              onClick={() => setActiveTab("safari")}
              className={`flex items-center justify-center gap-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === "safari"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-blue-400" />
              Safari
            </button>
            <button
              onClick={() => setActiveTab("firefox")}
              className={`flex items-center justify-center gap-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === "firefox"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Monitor className="w-3.5 h-3.5 text-orange-500" />
              Firefox
            </button>
          </div>

          {/* Steps based on tab */}
          <div className="space-y-3.5 min-h-[140px] py-1">
            {activeTab === "chrome" && (
              <div className="space-y-2 text-xs text-zinc-300">
                <div className="flex gap-2.5">
                  <span className="w-5 h-5 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 font-mono text-[10px] shrink-0">
                    1
                  </span>
                  <p>
                    Press{" "}
                    <kbd className="px-1.5 py-0.5 bg-zinc-950 text-white rounded border border-zinc-800">
                      Ctrl + P
                    </kbd>{" "}
                    (Windows) or{" "}
                    <kbd className="px-1.5 py-0.5 bg-zinc-950 text-white rounded border border-zinc-800">
                      Cmd + P
                    </kbd>{" "}
                    (Mac) to open Print menu.
                  </p>
                </div>
                <div className="flex gap-2.5">
                  <span className="w-5 h-5 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 font-mono text-[10px] shrink-0">
                    2
                  </span>
                  <p>
                    Click <strong className="text-white">"More Settings"</strong> to expand advanced
                    configurations.
                  </p>
                </div>
                <div className="flex gap-2.5">
                  <span className="w-5 h-5 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 font-mono text-[10px] shrink-0">
                    3
                  </span>
                  <p>
                    Enable <strong className="text-white">"Background Graphics"</strong> to print
                    colored titles and badge grids correctly.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "safari" && (
              <div className="space-y-2 text-xs text-zinc-300">
                <div className="flex gap-2.5">
                  <span className="w-5 h-5 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 font-mono text-[10px] shrink-0">
                    1
                  </span>
                  <p>
                    Press{" "}
                    <kbd className="px-1.5 py-0.5 bg-zinc-950 text-white rounded border border-zinc-800">
                      Cmd + P
                    </kbd>{" "}
                    to prompt Safari's native print screen.
                  </p>
                </div>
                <div className="flex gap-2.5">
                  <span className="w-5 h-5 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 font-mono text-[10px] shrink-0">
                    2
                  </span>
                  <p>
                    Ensure <strong className="text-white">"Print background images"</strong> is
                    checked inside the main dialog overlay.
                  </p>
                </div>
                <div className="flex gap-2.5">
                  <span className="w-5 h-5 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 font-mono text-[10px] shrink-0">
                    3
                  </span>
                  <p>
                    Under margins, select <strong className="text-white">"None"</strong> to prevent
                    any text wrapping overflow.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "firefox" && (
              <div className="space-y-2 text-xs text-zinc-300">
                <div className="flex gap-2.5">
                  <span className="w-5 h-5 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 font-mono text-[10px] shrink-0">
                    1
                  </span>
                  <p>
                    Press{" "}
                    <kbd className="px-1.5 py-0.5 bg-zinc-950 text-white rounded border border-zinc-800">
                      Ctrl + P
                    </kbd>{" "}
                    or{" "}
                    <kbd className="px-1.5 py-0.5 bg-zinc-950 text-white rounded border border-zinc-800">
                      Cmd + P
                    </kbd>{" "}
                    to open Firefox Print manager.
                  </p>
                </div>
                <div className="flex gap-2.5">
                  <span className="w-5 h-5 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 font-mono text-[10px] shrink-0">
                    2
                  </span>
                  <p>
                    In the options checklist, select{" "}
                    <strong className="text-white">"Print Backgrounds"</strong>.
                  </p>
                </div>
                <div className="flex gap-2.5">
                  <span className="w-5 h-5 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 font-mono text-[10px] shrink-0">
                    3
                  </span>
                  <p>
                    Select <strong className="text-white">"Save to PDF"</strong> as the printer
                    output destination.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Got It, Thanks!
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
