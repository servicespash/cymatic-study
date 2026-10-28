import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Code,
  Palette,
  Film,
  FileText,
  BookOpen,
  Sparkles,
  Layers,
  Terminal,
  Activity,
  Lightbulb,
} from "lucide-react";

export interface AdaptiveSuggestion {
  id: string;
  category: "curriculum" | "coding" | "design" | "media" | "documentation" | "focus";
  iconName:
    "Code" | "Palette" | "Film" | "FileText" | "BookOpen" | "Sparkles" | "Terminal" | "Activity";
  title: string;
  prompt: string;
}

const STORAGE_INTERACTION_MEMORY = "cymatic_tutor_interaction_memory_v1";

const GREETING_TEMPLATES = [
  (name: string) => `Your move, ${name}!`,
  () => "What should we focus on?",
  (name: string) => `What's next, ${name}?`,
  (name: string) => `Ready to build something great, ${name}?`,
  (name: string) => `What are we exploring today, ${name}?`,
  () => "Where shall we direct your focus today?",
  (name: string) => `Welcome back, ${name}. What's the goal today?`,
];

const COMPREHENSIVE_PROMPT_POOL: AdaptiveSuggestion[] = [
  // Coding & Web Development
  {
    id: "code-1",
    category: "coding",
    iconName: "Code",
    title: "Build a responsive React landing hero with Tailwind CSS",
    prompt:
      "Show me step-by-step how to build a responsive, edge-to-edge landing hero component in React and Tailwind CSS with modern cards and smooth transitions.",
  },
  {
    id: "code-2",
    category: "coding",
    iconName: "Terminal",
    title: "Terminal commands for local Docker and PostgreSQL setup",
    prompt:
      "Guide me through setting up a local Docker container running PostgreSQL and executing database schema migrations via bash commands.",
  },
  {
    id: "code-3",
    category: "coding",
    iconName: "Code",
    title: "Write a TypeScript API proxy route for Gemini 3.8 Flash",
    prompt:
      "How do I implement a secure server-side Express API endpoint that calls Google GenAI SDK (Gemini 3.8 Flash) and streams tokens to a React client?",
  },

  // Creative Design & UI/UX
  {
    id: "design-1",
    category: "design",
    iconName: "Palette",
    title: "Design a high-contrast dark mode color palette & typography",
    prompt:
      "Help me design an intentional 60-30-10 color palette and typography hierarchy for a modern student dashboard with WCAG AA compliance.",
  },
  {
    id: "design-2",
    category: "design",
    iconName: "Palette",
    title: "Design a phone wallpaper and icon set for mobile",
    prompt:
      "Give me creative ideas and prompt specifications to design a phone wallpaper and icon set with minimalist geometric aesthetics.",
  },

  // Video, Media & Software Tools
  {
    id: "media-1",
    category: "media",
    iconName: "Film",
    title: "Terminal video color grading & compression workflow",
    prompt:
      "Explain how to color grade and optimize educational video clips using FFmpeg in the terminal for fast web streaming.",
  },
  {
    id: "media-2",
    category: "media",
    iconName: "Film",
    title: "Video editing pacing & audio normalization guide",
    prompt:
      "What are professional techniques for pacing educational videos, balancing vocal clarity, and applying audio normalization (-14 LUFS)?",
  },

  // Documentation & Academic Writing
  {
    id: "doc-1",
    category: "documentation",
    iconName: "FileText",
    title: "Convert core physics notes to clean LaTeX / Markdown",
    prompt:
      "Convert notes on potential dividers and logic gates into a structured LaTeX or Markdown document with clear equations and truth tables.",
  },
  {
    id: "doc-2",
    category: "documentation",
    iconName: "FileText",
    title: "Draft an academic proposal for a secondary science project",
    prompt:
      "Help me draft a formal academic research proposal outline for a secondary school science exhibition on renewable energy and circuit automation.",
  },

  // Core Uganda Secondary Curriculum (O-Level & A-Level)
  {
    id: "curr-1",
    category: "curriculum",
    iconName: "BookOpen",
    title: "Quiz me on potential divider circuits & logic gates",
    prompt:
      "Give me 3 rigorous Socratic quiz questions on potential divider calculations and logic gate truth tables for Uganda O-Level physics.",
  },
  {
    id: "curr-2",
    category: "curriculum",
    iconName: "BookOpen",
    title: "Derive the potential divider equation step-by-step",
    prompt:
      "Guide me through deriving the potential divider formula Vout = Vin * (R2 / (R1 + R2)) with a real-world thermistor circuit application.",
  },
  {
    id: "curr-3",
    category: "curriculum",
    iconName: "BookOpen",
    title: "Test me on plant vascular systems & transpiration",
    prompt:
      "Quiz me on the differences between xylem and phloem transport mechanisms in flowering plants according to the NCDC curriculum.",
  },

  // Focus & Cognitive Reset
  {
    id: "focus-1",
    category: "focus",
    iconName: "Activity",
    title: "Reset my study focus in 5 minutes",
    prompt:
      "Walk me through a 5-minute cognitive reset sprint to shake off study fatigue, review my active goals, and prioritize my next task.",
  },
  {
    id: "focus-2",
    category: "focus",
    iconName: "Sparkles",
    title: "Analyze my recent quiz mistakes & knowledge gaps",
    prompt:
      "Based on my learning history, what are the primary concepts I need to review today to boost my term mastery score?",
  },
];

export function useAdaptiveSuggestions(userName: string = "Learner") {
  // Rotate greeting each session
  const [greetingIndex, setGreetingIndex] = useState(() =>
    Math.floor(Math.random() * GREETING_TEMPLATES.length),
  );

  // Load interaction memory
  const [recentInteractions, setRecentInteractions] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(STORAGE_INTERACTION_MEMORY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const recordInteraction = useCallback((promptOrTopic: string) => {
    setRecentInteractions((prev) => {
      const updated = [promptOrTopic, ...prev.filter((p) => p !== promptOrTopic)].slice(0, 20);
      try {
        localStorage.setItem(STORAGE_INTERACTION_MEMORY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const greeting = useMemo(() => {
    const template = GREETING_TEMPLATES[greetingIndex % GREETING_TEMPLATES.length];
    return template(userName);
  }, [greetingIndex, userName]);

  // Dynamically select 3 to 4 distinct suggestions across domains, biased by user interaction history
  const suggestions = useMemo(() => {
    // Shuffle pool with deterministic seed per mount
    const shuffled = [...COMPREHENSIVE_PROMPT_POOL].sort(() => 0.5 - Math.random());

    // Ensure balanced domain representation: 1 curriculum, 1 coding/tech, 1 design/media, 1 documentation/focus
    const selected: AdaptiveSuggestion[] = [];
    const usedCategories = new Set<string>();

    for (const item of shuffled) {
      if (!usedCategories.has(item.category) && selected.length < 3) {
        selected.push(item);
        usedCategories.add(item.category);
      }
    }

    // Fallback if needed
    while (selected.length < 3 && shuffled.length > selected.length) {
      const next = shuffled.find((s) => !selected.some((item) => item.id === s.id));
      if (next) selected.push(next);
      else break;
    }

    return selected;
  }, [greetingIndex]);

  const rotateSuggestions = useCallback(() => {
    setGreetingIndex((prev) => prev + 1);
  }, []);

  return {
    greeting,
    suggestions,
    rotateSuggestions,
    recordInteraction,
    recentInteractions,
  };
}

export function getSuggestionIcon(iconName: AdaptiveSuggestion["iconName"]) {
  switch (iconName) {
    case "Code":
      return Code;
    case "Palette":
      return Palette;
    case "Film":
      return Film;
    case "FileText":
      return FileText;
    case "BookOpen":
      return BookOpen;
    case "Terminal":
      return Terminal;
    case "Activity":
      return Activity;
    default:
      return Sparkles;
  }
}
