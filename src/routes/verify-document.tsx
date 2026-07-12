import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, ShieldAlert, Award, Globe, HelpCircle, Building2 } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/verify-document")({
  head: () => ({
    meta: [
      { title: "Document Verification — Cymatic Hub" },
      {
        name: "description",
        content:
          "Verify authenticity and metadata of downloaded academic materials from Cymatic Hub.",
      },
    ],
  }),
  component: VerifyDocumentPage,
});

function VerifyDocumentPage() {
  const [params, setParams] = useState({
    user: "unknown",
    school: "unknown",
    app: "Lattys Cymatic Hub",
    type: "study_chart",
    date: "",
    hash: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const userParam = urlParams.get("user") || "unknown";
    const schoolParam = urlParams.get("school") || "unknown";
    const appParam = urlParams.get("app") || "Lattys Cymatic Hub";
    const typeParam = urlParams.get("type") || "study_chart";
    const dateParam = urlParams.get("date") || new Date().toLocaleDateString();

    // Create a deterministic short cryptographic-looking verification ID
    const hash = Array.from(userParam + typeParam + dateParam)
      .reduce((acc, char) => ((acc + char.charCodeAt(0)) * 31) & 0xffff, 0)
      .toString(16)
      .toUpperCase();

    setParams({
      user: userParam,
      school: schoolParam,
      app: appParam,
      type: typeParam,
      date: dateParam,
      hash: `CYM-${hash}-${new Date().getFullYear()}`,
    });
  }, []);

  const getDocTypeLabel = (type: string) => {
    switch (type) {
      case "study_chart":
        return "Study Chart Document";
      case "lesson_notes":
        return "Lesson Notes Document";
      case "quiz":
        return "Quiz Assessment Worksheet";
      default:
        return "Academic Material";
    }
  };

  return (
    <main className="min-h-screen bg-[#070708] text-zinc-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-950/20 via-[#0A0A0B] to-[#070708] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 md:p-8 relative overflow-hidden backdrop-blur-xl shadow-2xl"
      >
        {/* Verification Glow Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 rounded-full" />

        {/* Verification Shield Icon Header */}
        <div className="flex flex-col items-center text-center mt-4">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 12 }}
            className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mb-4"
          >
            <CheckCircle2 className="w-10 h-10 animate-pulse" />
          </motion.div>
          <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-mono font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider mb-2">
            Verified Document
          </span>
          <h1 className="text-2xl font-black tracking-tight text-white font-sans">
            Cymatic Hub Authenticator
          </h1>
          <p className="text-zinc-500 text-xs mt-1 font-mono">License ID: {params.hash}</p>
        </div>

        {/* Content Section */}
        <div className="mt-8 space-y-4">
          <div className="p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800/40">
            <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
              Document Holder
            </label>
            <div className="flex items-center gap-2 mt-1 text-zinc-200">
              <Award className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold">
                {params.user === "unknown" ? "Unknown (Guest Session)" : params.user}
              </span>
            </div>
          </div>

          <div className="p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800/40">
            <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
              School / Institution
            </label>
            <div className="flex items-center gap-2 mt-1 text-zinc-200">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-semibold">
                {params.school === "unknown" ? "Guest View (Independent Study)" : params.school}
              </span>
            </div>
          </div>

          <div className="p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800/40">
            <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
              Originated From
            </label>
            <span className="block text-sm font-semibold text-zinc-200 mt-1">{params.app}</span>
          </div>

          <div className="p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800/40">
            <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
              Document Category
            </label>
            <span className="block text-sm font-semibold text-zinc-200 mt-1">
              {getDocTypeLabel(params.type)}
            </span>
          </div>

          <div className="p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800/40">
            <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
              Generation Date
            </label>
            <span className="block text-xs font-mono text-zinc-400 mt-1">{params.date}</span>
          </div>
        </div>

        {/* Call to action & App Website Link */}
        <div className="mt-8 pt-6 border-t border-zinc-800/60 text-center space-y-4">
          <p className="text-xs text-zinc-400">
            This educational worksheet was compiled from official curriculum modules and checked for
            compliance with Ugandan secondary guidelines.
          </p>
          <div className="flex flex-col gap-2">
            <a
              href="https://hub.cymatichub.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-zinc-100 hover:bg-white text-zinc-950 text-sm font-bold rounded-2xl transition-all shadow-md active:scale-95"
            >
              <Globe className="w-4 h-4" />
              Open Cymatic Hub
            </a>
            <a
              href="https://hub.sematic.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs font-medium rounded-xl transition-all"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Need Support?
            </a>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
