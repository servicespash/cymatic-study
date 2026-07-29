import { useState, useRef, useEffect } from "react";
import { useSubjectProgress } from "@/hooks/useSubjectProgress";
import { logRecentActivity } from "@/lib/offline-db";
import {
  Send,
  Sparkles,
  HelpCircle,
  BookOpen,
  RotateCcw,
  BrainCircuit,
  Mic,
  Settings,
  Menu,
  Download,
  Printer,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTutorStore } from "@/store/useTutorStore";
import type { Message as ChatMessage } from "@/store/useTutorStore";
import { ChatSidebar } from "./ChatSidebar";
import { ExportPdfModal } from "./ExportPdfModal";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

interface TopicConfig {
  name: string;
  subject: string;
  starter: string;
  responses: { keywords: string[]; reply: string }[];
  defaultReplies: string[];
}

export function SocraticTutorChat() {
  const { user, isTeacher, isAdmin } = useAuth();
  const [displayName, setDisplayName] = useState("Learner");

  useEffect(() => {
    async function fetchProfile() {
      if (user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", user.id)
          .maybeSingle();
        if (profile?.full_name) setDisplayName(profile.full_name);
      }
    }
    fetchProfile();
  }, [user?.id]);

  const [activeSubject, setActiveSubject] = useState("Mathematics");
  const { messages, setMessages } = useTutorStore();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { incrementProgress } = useSubjectProgress();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const subjects = [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "Geography",
    "History",
    "English",
    "Economics",
  ];

  const pdfContent = [
    {
      sectionTitle: `Socratic Dialogue: ${activeSubject}`,
      body: messages
        .map((m) => `[${m.timestamp}] ${m.sender === "student" ? "Learner" : "Tutor"}: ${m.text}`)
        .join("\n\n"),
    },
  ];

  // Fetch dynamic welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const greeting: ChatMessage = {
        id: crypto.randomUUID(),
        sender: "tutor",
        text: `Hello ${displayName}! I'm your Socratic mentor. I'm here to help you explore the NCDC curriculum with curiosity and wisdom. Which subject or topic would you like to dive into today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages([greeting]);
    }
  }, [displayName, messages.length, setMessages]);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = "en-US";
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  // Initialize with starter message
  // Messages now managed by useTutorStore and dynamic useEffect

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const studentText = input.trim();
    const studentMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "student",
      text: studentText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, studentMsg]);
    setInput("");
    setIsTyping(true);

    const tutorMsgId = crypto.randomUUID();
    const tutorMsg: ChatMessage = {
      id: tutorMsgId,
      sender: "socratic_tutor",
      text: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, tutorMsg]);

    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;

      let res;
      try {
        const url = "/api/tutor";
        res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            messages: [...messages, studentMsg].map((m) => ({
              role: m.sender === "student" ? "user" : "assistant",
              content: m.text,
            })),
            userName: displayName,
            subject: activeSubject,
          }),
        });
        if (!res.ok) {
          throw new Error("Local API failed status: " + res.status);
        }
      } catch (err) {
        console.warn("[Socratic Coach] Primary API call failed, retrying /api/tutor:", err);
        const edgeUrl = `/api/tutor`;
        res = await fetch(edgeUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            messages: [...messages, studentMsg].map((m) => ({
              role: m.sender === "student" ? "user" : "assistant",
              content: m.text,
            })),
            persona: activeSubject === "physics" || activeSubject === "mathematics" ? "male" : "female",
            userName: displayName,
            subject: activeSubject,
          }),
        });
      }

      if (!res.ok) {
        const errText = await res.text().catch(() => "Unknown error");
        throw new Error(`Tutor APIs failed (${res.status}): ${errText}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          let chunkText = "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              const j = JSON.parse(payload);
              const delta = j.choices?.[0]?.delta?.content;
              if (typeof delta === "string") chunkText += delta;
            } catch (e) {
              // Ignore payload parse errors
            }
          }

          if (chunkText) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === tutorMsgId ? { ...msg, text: msg.text + chunkText } : msg,
              ),
            );
          }
        }
      }

      await incrementProgress(
        activeSubject,
        8,
        `Engaged Socratic Tutor on ${activeSubject} topics.`,
      );
    } catch (error) {
      console.error("[Socratic Coach] API communication error:", error);

      const replyText =
        "I'm having a little trouble connecting to my thoughts right now, but let's keep thinking. What do you understand about this topic so far?";

      setMessages((prev) =>
        prev.map((msg) => (msg.id === tutorMsgId ? { ...msg, text: replyText } : msg)),
      );
    } finally {
      setIsTyping(false);
      await logRecentActivity("chat", `Submitted answers to Socratic Coach in ${activeSubject}.`);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: "starter",
        sender: "socratic_tutor",
        text: `Hello ${displayName}! I'm ready to explore ${activeSubject} with you. What part of the curriculum should we start with?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      <ChatSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col h-full relative">
        <header className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </Button>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold">Socratic Mentor</h1>
              <div className="flex gap-2 mt-1">
                {subjects.slice(0, 4).map((s) => (
                  <button
                    key={s}
                    onClick={() => setActiveSubject(s)}
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                      activeSubject === s
                        ? "bg-cyan-500/20 border-cyan-500 text-cyan-400"
                        : "border-zinc-800 text-zinc-500 hover:border-zinc-700",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="relative">
            <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(!isSettingsOpen)}>
              <Settings className="w-6 h-6" />
            </Button>
            {isSettingsOpen && (
              <div className="absolute right-0 top-12 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl p-2 z-50">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-xs"
                  onClick={() => setIsExportModalOpen(true)}
                >
                  <Download className="w-4 h-4 mr-2" /> Download Chat PDF
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-xs"
                  onClick={() => window.print()}
                >
                  <Printer className="w-4 h-4 mr-2" /> Print Chat
                </Button>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col p-4 md:p-6 lg:p-8">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl overflow-hidden flex flex-col flex-1 shadow-2xl relative">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-950/20 print-chat">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex ${msg.sender === "student" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-sm relative ${
                        msg.sender === "student"
                          ? "bg-zinc-800 text-zinc-100 rounded-tr-none"
                          : "bg-zinc-900/90 border border-zinc-800 text-zinc-200 rounded-tl-none"
                      }`}
                    >
                      {msg.sender === "socratic_tutor" && (
                        <span className="text-[9px] font-bold text-cyan-400 block mb-1 font-mono uppercase tracking-wider flex items-center gap-1">
                          <HelpCircle className="w-3 h-3" /> Socratic Guide
                        </span>
                      )}
                      <p>{msg.text}</p>
                      <span className="text-[8px] text-zinc-600 block mt-1.5 text-right font-mono">
                        {msg.timestamp}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl rounded-tl-none p-3 text-xs text-zinc-500 flex items-center gap-1">
                    <span
                      className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                    <span className="ml-1 text-[10px] font-mono text-zinc-500">
                      Tutor formulating a hint...
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-4 bg-zinc-900/90 border-t border-zinc-800">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isTyping}
                  placeholder="Type your steps, answer calculations, or questions here..."
                  className="flex-1 bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-600 text-xs rounded-2xl px-4 py-3 outline-none focus:border-cyan-500/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={toggleListening}
                  className={cn(
                    "p-3 rounded-2xl transition-all shadow-md active:scale-95 flex items-center justify-center",
                    isListening
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-zinc-800 text-zinc-400 hover:text-white",
                  )}
                  aria-label="Voice input"
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="p-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-800 text-zinc-950 disabled:text-zinc-600 rounded-2xl transition-all shadow-md active:scale-95 flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

            <ExportPdfModal
              isOpen={isExportModalOpen}
              onClose={() => setIsExportModalOpen(false)}
              title={`Chat History - ${activeSubject}`}
              subject={activeSubject}
              docType="lesson_notes"
              showAnswers={isTeacher || isAdmin}
              content={pdfContent}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
