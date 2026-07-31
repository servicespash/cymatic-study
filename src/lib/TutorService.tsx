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

import { type TutorVoice, type TutorPersona, DEFAULT_PERSONA_CONFIGS } from "./persona-config";

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
  speak: (text: string, options?: { force?: boolean; queue?: boolean }) => Promise<void>;
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

  const persona = useMemo(() => DEFAULT_PERSONA_CONFIGS[voice], [voice]);

  const connectSession = useCallback(async (retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        await liveTools.connect();
        return; // Success!
      } catch (e) {
        console.error(`Connection attempt ${i + 1} failed`, e);
        if (i === retries - 1) {
          toast.error("Failed to connect to tutor engine after multiple attempts.");
        } else {
          await new Promise((r) => setTimeout(r, 1000 * (i + 1))); // Exponential backoff
        }
      }
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
          voiceName: persona.voiceName,
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
    async (text: string, options?: { force?: boolean; queue?: boolean }) => {
      if (!ttsEnabled || !text.trim()) return;

      const cleanText = text
        .replace(/\[SYSTEM:.*?\]/g, "")
        .replace(/\[APPLAUSE\]/g, "")
        .trim();

      if (!cleanText) return;

      if (options?.force) {
        await stopSpeaking();
      }

      ttsQueue.current.push(cleanText);
      processQueue();
    },
    [ttsEnabled, processQueue, stopSpeaking],
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
