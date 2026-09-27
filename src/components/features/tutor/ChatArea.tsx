import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { Message, useTutorStore } from "@/store/useTutorStore";
import { Download, Volume2, VolumeX, Sparkles } from "lucide-react";
import { useState } from "react";
import { ExportPdfModal } from "./ExportPdfModal";
import { useTutor } from "@/lib/TutorService";
import { Button } from "./ui/button";

import { LinkifiedText } from "./LinkifiedText";

export function ChatArea({ messages, isLoading }: { messages: Message[]; isLoading: boolean }) {
  const { isTeacher, isAdmin } = useAuth();
  const { persona, sessionId, sessions, updateSessionMeta } = useTutorStore();
  const currentSession = sessions.find(s => s.id === sessionId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { speak, stopSpeaking, speaking } = useTutor();
  const [activeSpeakingId, setActiveSpeakingId] = useState<string | null>(null);

  const handleManualSummarize = async () => {
    if (!sessionId) return;
    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "generate_meta",
          messages: messages.slice(-10).map(m => ({
            role: m.sender === "student" ? "user" : "assistant",
            content: m.text
          }))
        })
      });
      if (res.ok) {
        const meta = await res.json();
        await updateSessionMeta(sessionId, meta);
      }
    } catch (e) {
      console.error("Manual summarize failed:", e);
    }
  };

  const formattedChatContent = messages
    .map((msg) => {
      const isStudent = msg.sender === "student" || msg.sender === "user";
      const roleLabel = isStudent ? "Learner" : persona;
      return `[${msg.timestamp || ""}] ${roleLabel}: ${msg.text}`;
    })
    .join("\n\n");

  const pdfContent = [
    {
      sectionTitle: "Tutor Interaction History",
      body: formattedChatContent || "No messages in this chat session yet.",
    },
  ];

  const handleSpeak = async (msgId: string, text: string) => {
    if (speaking && activeSpeakingId === msgId) {
      await stopSpeaking();
      setActiveSpeakingId(null);
    } else {
      await stopSpeaking();
      setActiveSpeakingId(msgId);
      await speak(text);
    }
  };

  return (
    <div
      className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 max-w-full overflow-x-hidden"
      role="log"
      aria-live="polite"
      aria-relevant="additions"
    >
      <div className="flex justify-end mb-4 no-print">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition-colors cursor-pointer"
          aria-label="Export chat to PDF"
        >
          <Download className="h-4 w-4" />
          Export PDF
        </button>
      </div>
      {messages.map((msg) => {
        const isStudent = msg.sender === "student" || msg.sender === "user";
        return (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`w-full max-w-full md:max-w-3xl mx-auto px-1 overflow-hidden ${isStudent ? "text-right" : "text-left"}`}
          >
            <div
              className={`flex items-end gap-2 group w-full ${isStudent ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`inline-block p-4 rounded-2xl text-sm text-left max-w-[85%] md:max-w-[80%] lg:max-w-[70%] overflow-hidden shadow-sm [overflow-wrap:break-word] [word-break:break-word] ${
                  isStudent
                    ? "bg-zinc-800 text-white shadow-lg"
                    : "bg-zinc-900/50 text-zinc-100 border border-zinc-800/80 shadow-sm"
                }`}
              >
                <LinkifiedText text={msg.text} isOwn={isStudent} className="whitespace-pre-wrap leading-relaxed" />
              </div>
              {!isStudent && msg.text && (
                <button
                  onClick={() => handleSpeak(msg.id, msg.text)}
                  className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-850 rounded-lg transition-all shrink-0 cursor-pointer"
                  aria-label={speaking && activeSpeakingId === msg.id ? "Stop voice" : "Read aloud"}
                  title={speaking && activeSpeakingId === msg.id ? "Stop reading" : "Read aloud"}
                >
                  {speaking && activeSpeakingId === msg.id ? (
                    <VolumeX className="h-4 w-4 text-purple-400 animate-pulse" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          </motion.div>
        );
      })}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-3xl mx-auto text-left p-4"
          role="status"
          aria-live="assertive"
        >
          <div className="inline-block p-4 rounded-2xl bg-zinc-900/50 text-zinc-500 text-sm">
            {persona} is typing...
          </div>
        </motion.div>
      )}

      {messages.length >= 6 && !currentSession?.summary && !isLoading && (
        <div className="flex justify-center pt-8 pb-4">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900 text-cyan-400 gap-2 h-9 px-4"
            onClick={handleManualSummarize}
          >
            <Sparkles className="w-4 h-4" />
            <span>Summarize & Save to Library</span>
          </Button>
        </div>
      )}

      {isModalOpen && (
        <ExportPdfModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Tutor Session Export"
          subject="Physics & Mathematics"
          docType="lesson_notes"
          showAnswers={isTeacher || isAdmin}
          content={pdfContent}
        />
      )}
    </div>
  );
}
