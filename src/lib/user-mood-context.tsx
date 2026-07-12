import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type UserMood = "happy" | "tired" | "confused" | "stressed" | "focused";

export const USER_MOODS: { key: UserMood; label: string; emoji: string; tint: string }[] = [
  {
    key: "happy",
    label: "Happy",
    emoji: "😊",
    tint: "from-yellow-300/20 via-orange-300/10 to-transparent",
  },
  {
    key: "focused",
    label: "Focused",
    emoji: "🔥",
    tint: "from-emerald-400/20 via-cyan-400/10 to-transparent",
  },
  {
    key: "tired",
    label: "Tired",
    emoji: "😴",
    tint: "from-indigo-400/20 via-slate-500/10 to-transparent",
  },
  {
    key: "confused",
    label: "Confused",
    emoji: "😕",
    tint: "from-violet-400/20 via-blue-400/10 to-transparent",
  },
  {
    key: "stressed",
    label: "Stressed",
    emoji: "😰",
    tint: "from-blue-500/20 via-indigo-500/10 to-transparent",
  },
];

type Ctx = {
  mood: UserMood | null;
  setMood: (m: UserMood | null) => void;
  meta: (typeof USER_MOODS)[number] | null;
};

const C = createContext<Ctx>({ mood: null, setMood: () => {}, meta: null });
const KEY = "lattys-user-mood";

export function UserMoodProvider({ children }: { children: ReactNode }) {
  const [mood, setMoodState] = useState<UserMood | null>(null);
  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY) as UserMood | null;
      if (v && USER_MOODS.some((m) => m.key === v)) setMoodState(v);
    } catch (err) {
      console.warn("Storage read failed", err);
    }
  }, []);
  const setMood = (m: UserMood | null) => {
    setMoodState(m);
    try {
      if (m) {
        localStorage.setItem(KEY, m);
      } else {
        localStorage.removeItem(KEY);
      }
    } catch (err) {
      console.warn("Storage write failed", err);
    }
  };
  const meta = useMemo(() => USER_MOODS.find((x) => x.key === mood) ?? null, [mood]);
  return <C.Provider value={{ mood, setMood, meta }}>{children}</C.Provider>;
}

export const useUserMood = () => useContext(C);

export function tutorReplyForMood(
  persona: "Adams" | "Haawa",
  mood: UserMood,
  name?: string,
): string {
  const who = name ? `, ${name}` : "";
  const adams: Record<UserMood, string> = {
    happy: `Aye${who}, smile looks good on you. Let's keep the wave going.`,
    focused: `Lock in${who}. Headphones on, distractions off — we cooking.`,
    tired: `Aight${who}, rest is part of the grind. One small win, then nap, fam.`,
    confused: `Hey${who}, I got you. Confused? That's just the brain growing. Let's break it down.`,
    stressed: `Breathe${who}, you are a child of God. Don't stress. We'll handle this piece by piece.`,
  };
  const hawa: Record<UserMood, string> = {
    happy: `My beloved${who}, your smile is a small sunrise. Walk with me.`,
    focused: `Steady, my dear${who}. The mind is a quiet river today — let it flow.`,
    tired: `Rest, my dear${who}. The mind is tender. One gentle page, then sleep.`,
    confused: `My dear${who}, confusion is just the beginning of wisdom. Speak your heart, I am here.`,
    stressed: `My love${who}, breathe. You are a child of God. Don't stress. Seek guidance, and I will be here.`,
  };
  return persona === "Adams" ? adams[mood] : hawa[mood];
}
