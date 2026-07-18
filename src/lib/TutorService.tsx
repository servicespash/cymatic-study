import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
  useCallback,
  useRef,
} from "react";
import { useGeminiLive } from "@/hooks/useGeminiLive";
import { type UserMood } from "./user-mood-context";
import { toast } from "sonner";
import { HardwareBridge } from "./HardwareBridge";
import { AudioEngine } from "./audio-engine";

export type TutorVoice = "male" | "female";
export type TutorPersona = {
  voice: TutorVoice;
  name: "Adams" | "Haawa";
  pitch: number;
  rate: number;
  theme: { primary: string; secondary: string; glow: string };
};

const PERSONA_CONFIGS: Record<TutorVoice, TutorPersona> = {
  female: {
    voice: "female",
    name: "Haawa",
    pitch: 1.2,
    rate: 0.85,
    theme: { primary: "#4C1D95", secondary: "#10B981", glow: "Violet-Emerald" },
  },
  male: {
    voice: "male",
    name: "Adams",
    pitch: 0.9,
    rate: 1.0,
    theme: { primary: "#1E3A8A", secondary: "#D4AF37", glow: "Blue-Gold" },
  },
};

interface TutorServiceState {
  persona: TutorPersona;
  mood: UserMood | null;
  speaking: boolean;
  connected: boolean;
  ttsEnabled: boolean;
  setVoice: (v: TutorVoice) => void;
  setMood: (m: UserMood | null) => void;
  setTtsEnabled: (b: boolean) => void;
  connectSession: () => Promise<void>;
  disconnectSession: () => void;
  speak: (text: string) => Promise<void>;
  stopSpeaking: () => Promise<void>;
}

const TutorServiceCtx = createContext<TutorServiceState | null>(null);

export function TutorServiceProvider({ children }: { children: ReactNode }) {
  const [voice, setVoiceState] = useState<TutorVoice>("male");
  const [mood, setMood] = useState<UserMood | null>(null);
  const [ttsEnabled, setTtsEnabledState] = useState(true);
  const [speaking, setSpeaking] = useState(false);

  // TTS Queue to prevent overlapping
  const ttsQueue = useRef<string[]>([]);
  const isProcessingQueue = useRef(false);

  const liveTools = useGeminiLive({
    onError: (e) => toast.error(`Live Error: ${e}`),
  });

  const persona = useMemo(() => PERSONA_CONFIGS[voice], [voice]);

  const connectSession = useCallback(async () => {
    try {
      await liveTools.connect();
    } catch (e) {
      console.error("Failed to connect live session", e);
      toast.error("Failed to connect to tutor engine");
    }
  }, [liveTools]);

  const disconnectSession = useCallback(() => {
    liveTools.disconnect();
  }, [liveTools]);

  const stopSpeaking = useCallback(async () => {
    setSpeaking(false);
    ttsQueue.current = []; // Clear queue
    await HardwareBridge.ttsStop();
  }, []);

  const processQueue = useCallback(async () => {
    if (isProcessingQueue.current || ttsQueue.current.length === 0) return;

    isProcessingQueue.current = true;
    setSpeaking(true);

    const textToSpeak = ttsQueue.current.shift();
    if (textToSpeak) {
      try {
        const savedPitchAdj =
          typeof window !== "undefined"
            ? parseFloat(localStorage.getItem("tutor_pitch_adj") || "0")
            : 0;
        const savedRateAdj =
          typeof window !== "undefined"
            ? parseFloat(localStorage.getItem("tutor_rate_adj") || "0")
            : 0;
        await HardwareBridge.ttsSpeak(textToSpeak, {
          rate: persona.rate + savedRateAdj,
          pitch: persona.pitch + savedPitchAdj,
          lang: persona.voice === "male" ? "en-GB" : "en-US",
        });
      } catch (e) {
        console.error("TTS failed", e);
        toast.error("Voice output failed. Please check your audio settings.");
      }
    }

    setSpeaking(false);
    isProcessingQueue.current = false;
    processQueue(); // Process next item
  }, [persona]);

  const speak = useCallback(
    async (text: string) => {
      if (!ttsEnabled || !text.trim()) return;

      const cleanText = text
        .replace(/\[SYSTEM:.*?\]/g, "")
        .replace(/\[APPLAUSE\]/g, "")
        .trim();

      if (!cleanText) return;

      ttsQueue.current.push(cleanText);
      processQueue();
    },
    [ttsEnabled, processQueue],
  );

  const setVoice = useCallback((v: TutorVoice) => setVoiceState(v), []);
  const setTtsEnabled = useCallback((b: boolean) => setTtsEnabledState(b), []);

  const value = {
    persona,
    mood,
    speaking,
    connected: liveTools.connected,
    ttsEnabled,
    setVoice,
    setMood,
    setTtsEnabled,
    connectSession,
    disconnectSession,
    speak,
    stopSpeaking,
  };

  return <TutorServiceCtx.Provider value={value}>{children}</TutorServiceCtx.Provider>;
}

export const useTutor = () => {
  const ctx = useContext(TutorServiceCtx);
  if (!ctx) throw new Error("useTutor must be used within a TutorServiceProvider");
  return ctx;
};
