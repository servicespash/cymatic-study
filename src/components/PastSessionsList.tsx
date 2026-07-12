import { useState, useEffect } from "react";
import { db, ChatSession } from "@/lib/db";
import { useTutorStore } from "@/store/useTutorStore";
import { useNavigate } from "@tanstack/react-router";
import { History, BookOpen, ChevronRight, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

export function PastSessionsList() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const loadSession = useTutorStore((s) => s.loadSession);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadSessions() {
      const allSessions = await db.chatSessions.orderBy("timestamp").reverse().toArray();
      setSessions(allSessions);
    }
    loadSessions();
  }, []);

  // Utility to match keywords to subjects
  const getSubjectAndColor = (text: string) => {
    const t = text.toLowerCase();
    if (
      /math|algebra|quadratic|equation|calculus|geometry|fraction|divide|multiply|subtract|add|sum|sigma|theorem|numeric|number/.test(
        t,
      )
    ) {
      return { name: "Math", color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" };
    }
    if (
      /physics|force|gravity|velocity|speed|kinematics|motion|mechanics|wave|optics|light|laser|electricity|magnet|ampere|volt|joule|newton/.test(
        t,
      )
    ) {
      return { name: "Physics", color: "text-violet-400 bg-violet-400/10 border-violet-500/20" };
    }
    if (
      /chemistry|chemical|acid|base|ph|molecule|atom|bond|compound|periodic|reaction|catalyst|element|flask|beaker|alkali/.test(
        t,
      )
    ) {
      return { name: "Chemistry", color: "text-orange-400 bg-orange-400/10 border-orange-500/20" };
    }
    if (
      /biology|cell|dna|organism|gene|evolution|plant|photosynthesis|mitochondria|bacteria|virus|anatomy|heart|lung|species/.test(
        t,
      )
    ) {
      return { name: "Biology", color: "text-emerald-400 bg-emerald-400/10 border-emerald-500/20" };
    }
    return { name: "General Science", color: "text-zinc-400 bg-zinc-400/10 border-zinc-500/20" };
  };

  const getSessionDetails = (session: ChatSession) => {
    if (!session.messages || session.messages.length === 0) {
      return {
        subject: { name: "General", color: "text-zinc-400 bg-zinc-400/10 border-zinc-500/20" },
        summary: "Empty session started.",
      };
    }

    // Try to find subject in all messages
    let subjectDetail = {
      name: "General Science",
      color: "text-zinc-400 bg-zinc-400/10 border-zinc-500/20",
    };
    for (const msg of session.messages) {
      const sub = getSubjectAndColor(msg.text);
      if (sub.name !== "General Science") {
        subjectDetail = sub;
        break;
      }
    }

    // Get a summary from first user message
    const firstUserMsg = session.messages.find((m) => m.sender === "user");
    const summaryText = firstUserMsg
      ? firstUserMsg.text.length > 70
        ? firstUserMsg.text.substring(0, 70) + "..."
        : firstUserMsg.text
      : "No user input provided.";

    return {
      subject: subjectDetail,
      summary: summaryText,
    };
  };

  const handleResume = async (sessionId: number) => {
    await loadSession(sessionId);
    navigate({ to: "/tutor" });
  };

  if (sessions.length === 0) {
    return (
      <div className="bg-zinc-900/80 backdrop-blur-md rounded-2xl p-6 border border-zinc-800/80 shadow-xl flex flex-col items-center justify-center text-center py-10">
        <History className="h-8 w-8 text-zinc-600 mb-3" />
        <p className="text-sm font-medium text-zinc-400">No past tutoring sessions found</p>
        <p className="text-xs text-zinc-500 mt-1">
          Start chatting with Cymatic Tutor to save your history offline!
        </p>
      </div>
    );
  }

  return (
    <div
      id="past-sessions-panel"
      className="bg-zinc-900/80 backdrop-blur-md rounded-2xl p-6 border border-zinc-800/80 shadow-xl space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
          <History className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-lg tracking-tight">Study History</h3>
          <p className="text-zinc-500 text-xs">A chronological log of your tutoring interactions</p>
        </div>
      </div>

      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
        {sessions.map((session) => {
          const { subject, summary } = getSessionDetails(session);
          const dateStr = new Date(session.timestamp).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div
              key={session.id}
              className="group flex items-center justify-between p-4 bg-zinc-950/40 hover:bg-zinc-850/50 rounded-xl border border-zinc-800/50 hover:border-zinc-700/50 transition-all duration-200"
            >
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md border ${subject.color}`}
                  >
                    {subject.name}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">{dateStr}</span>
                </div>
                <p className="text-xs text-zinc-300 font-medium line-clamp-1 group-hover:text-white transition-colors">
                  {summary}
                </p>
              </div>

              {session.id !== undefined && (
                <button
                  onClick={() => handleResume(session.id!)}
                  className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-zinc-800 hover:border-zinc-700 transition-all flex items-center gap-1 text-[11px] font-medium shrink-0 shadow-sm"
                  aria-label={`Resume session from ${dateStr}`}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>Resume</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
