import { useState, useRef, useEffect } from "react";
import { useSubjectProgress } from "@/hooks/useSubjectProgress";
import { logRecentActivity } from "@/lib/offline-db";
import { Send, Sparkles, HelpCircle, BookOpen, RotateCcw, BrainCircuit } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  id: string;
  sender: "student" | "socratic_tutor";
  text: string;
  timestamp: string;
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
  const [activeTopicKey, setActiveTopicKey] = useState<"unresolved_forces" | "quadratic_equations">(
    "unresolved_forces",
  );
  const config = TOPICS_CONFIG[activeTopicKey];

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const { incrementProgress } = useSubjectProgress();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with starter message
  useEffect(() => {
    setMessages([
      {
        id: "starter",
        sender: "socratic_tutor",
        text: config.starter,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }, [activeTopicKey]);

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

    // Simulated thought delay
    setTimeout(async () => {
      const lowerText = studentText.toLowerCase();
      let replyText = "";

      // Match custom keywords
      const matched = config.responses.find((res) =>
        res.keywords.some((kw) => lowerText.includes(kw)),
      );

      if (matched) {
        replyText = matched.reply;
        // Award progress on Dexie database!
        await incrementProgress(
          config.subject,
          8, // 8% increment for correct Socratic steps
          `Engaged Socratic Tutor on ${config.name}.`,
        );
      } else {
        // Pick random default reply
        const randIdx = Math.floor(Math.random() * config.defaultReplies.length);
        replyText = config.defaultReplies[randIdx];
      }

      const tutorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        sender: "socratic_tutor",
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, tutorMsg]);
      setIsTyping(false);

      // Log interaction to Dexie
      await logRecentActivity(
        "chat",
        `Submitted answers to offline Socratic Coach in ${config.subject}.`,
      );
    }, 1200);
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
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl overflow-hidden flex flex-col h-[520px] shadow-2xl relative">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />

      {/* Header */}
      <div className="p-4 bg-zinc-900/95 border-b border-zinc-800 flex flex-wrap gap-3 items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-cyan-500/15 text-cyan-400 rounded-xl flex items-center justify-center border border-cyan-500/20">
            <BrainCircuit className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1">
              Offline Socratic Coach
              <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                Interactive
              </span>
            </h3>
            <p className="text-[10px] text-zinc-500 font-medium">
              Providing hints & questions, never direct answers
            </p>
          </div>
        </div>

        {/* Topic select */}
        <div className="flex items-center gap-1.5">
          <select
            value={activeTopicKey}
            onChange={(e) => setActiveTopicKey(e.target.value as any)}
            className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-xl px-2.5 py-1.5 outline-none hover:border-zinc-700 transition-colors"
          >
            {Object.entries(TOPICS_CONFIG).map(([key, value]) => (
              <option key={key} value={key}>
                {value.name}
              </option>
            ))}
          </select>
          <button
            onClick={resetChat}
            className="p-1.5 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-zinc-800 transition-colors"
            title="Reset Conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-950/20">
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
            type="submit"
            disabled={!input.trim() || isTyping}
            className="p-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-800 text-zinc-950 disabled:text-zinc-600 rounded-2xl transition-all shadow-md active:scale-95 flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
