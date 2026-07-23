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

const TOPICS_CONFIG = {
  unresolved_forces: {
    name: "Newton's Laws & Forces (Physics)",
    subject: "Physics",
    starter:
      "Hello! I am your Socratic Physics Guide. Let's explore forces together. Imagine a block of mass 5kg resting on a flat table. If we push it horizontally with a force of 20N, and there is no friction, how do we find its acceleration? What formula connects these three values?",
    responses: [
      {
        keywords: [
          "f=ma",
          "f = ma",
          "force equals mass",
          "f equals ma",
          "newton's second",
          "second law",
        ],
        reply:
          "Excellent! F = ma is the exact mathematical relation. Now, what does each letter stand for in our specific scenario? Try substituting the numbers we have into that equation.",
      },
      {
        keywords: ["20", "5", "divide", "20/5", "20 / 5", "four", "4"],
        reply:
          "You've got the correct arithmetic! 4 m/s² is indeed the acceleration. But why are the units m/s²? What physical quantity changes by 4 meters per second every single second?",
      },
      {
        keywords: ["velocity", "speed", "acceleration", "change in velocity", "movement"],
        reply:
          "Exactly! Velocity increases by 4 m/s every second. Now, what if we suddenly add friction of 5N opposing the push? What is the *net* force acting on the block now?",
      },
      {
        keywords: ["15", "15n", "subtract", "20-5", "20 - 5"],
        reply:
          "Perfect. Net force is 15N. So, using our relation F = ma, what will the new acceleration be with friction opposing the push?",
      },
    ],
    defaultReplies: [
      "That is an interesting perspective! Let's think back: what is the total horizontal force acting on the object?",
      "To help you see the connection, can you state Newton's Second Law of Motion for me?",
      "Let's break it down. What mass are we dealing with, and what forces are pushing or pulling on it?",
    ],
  },
  quadratic_equations: {
    name: "Solving Quadratics (Mathematics)",
    subject: "Math",
    starter:
      "Welcome to Socratic Math! Let's look at the quadratic equation: x² - 5x + 6 = 0. Instead of jumping straight to the quadratic formula, can we find two numbers that multiply to positive 6, and add up to negative 5? What numbers come to mind?",
    responses: [
      {
        keywords: ["-2", "-3", "minus 2", "minus 3", "-2 and -3", "-3 and -2", "2 and 3"],
        reply:
          "Spot on! -2 and -3 multiply to +6, and sum to -5. So how can we write the equation in factored form, using these two numbers?",
      },
      {
        keywords: ["(x-2)", "(x-3)", "(x-2)(x-3)", "factor", "factored"],
        reply:
          "Superb! (x - 2)(x - 3) = 0 is the factored expression. Now, if the product of two factors is zero, what must be true about the individual factors themselves?",
      },
      {
        keywords: ["zero", "equals zero", "either is zero", "x=2", "x=3", "2 and 3", "x equals"],
        reply:
          "Correct! If either factor is zero, the whole product is zero. So we solve x - 2 = 0 and x - 3 = 0. What are our final values for x?",
      },
    ],
    defaultReplies: [
      "Let's reflect on that. If we need numbers that multiply to 6, what are all the factor pairs of 6? Let's write them down.",
      "How would you factor this quadratic expression? Think about brackets: (x + a)(x + b).",
      "Let's look at the coefficients. The constant is +6 and the x-coefficient is -5. What does that tell us about the signs of our factors?",
    ],
  },
};

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

  const [activeTopicKey, setActiveTopicKey] = useState<"unresolved_forces" | "quadratic_equations">(
    "unresolved_forces",
  );
  const config = TOPICS_CONFIG[activeTopicKey];
  const { messages, setMessages, addMessage } = useTutorStore();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { incrementProgress } = useSubjectProgress();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const pdfContent = [
    {
      sectionTitle: `Socratic Dialogue: ${config.name}`,
      body: messages
        .map((m) => `[${m.timestamp}] ${m.sender === "student" ? "Learner" : "Tutor"}: ${m.text}`)
        .join("\n\n"),
    },
  ];

  // Fetch dynamic welcome message
  useEffect(() => {
    if (messages.length === 0) {
      // Fetch from backend in a real app.
      const greeting: ChatMessage = {
        id: crypto.randomUUID(),
        sender: "tutor",
        text: `Hello! Ready to dive into ${config.name}? What do you want to explore today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages([greeting]);
    }
  }, [config.name, messages.length, setMessages]);

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

      const url = "/api/tutor";
      const res = await fetch(url, {
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
          subject: config.subject,
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "Unknown error");
        throw new Error(`Local Socratic API failed (${res.status}): ${errText}`);
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

      await incrementProgress(config.subject, 8, `Engaged Socratic Tutor on ${config.name}.`);
    } catch (error) {
      console.error("[Socratic Coach] API communication error:", error);

      // Fallback to hardcoded/logic-based replies if offline/AI fails
      const lowerText = studentText.toLowerCase();
      const matched = config.responses.find((res) =>
        res.keywords.some((kw) => lowerText.includes(kw)),
      );

      const replyText = matched
        ? matched.reply
        : config.defaultReplies[Math.floor(Math.random() * config.defaultReplies.length)];

      setMessages((prev) =>
        prev.map((msg) => (msg.id === tutorMsgId ? { ...msg, text: replyText } : msg)),
      );
    } finally {
      setIsTyping(false);
      await logRecentActivity("chat", `Submitted answers to Socratic Coach in ${config.subject}.`);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: "starter",
        sender: "socratic_tutor",
        text: config.starter,
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
            <h1 className="text-xl font-bold">{config.name}</h1>
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
              title={`Chat History - ${config.name}`}
              subject={config.subject}
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
