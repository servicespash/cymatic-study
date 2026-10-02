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
  volume: number;
  speed: number;
  voiceHistory: string[];
  setVoice: (v: TutorVoice) => void;
  setPersonaVoice: (personaName: "Adams" | "Haawa", voiceName: string) => void;
  setVolume: (v: number) => void;
  setSpeed: (v: number) => void;
  addToVoiceHistory: (voiceName: string) => void;
  setMood: (m: UserMood | null) => void;
  setTtsEnabled: (b: boolean) => void;
  connectSession: () => Promise<void>;
  disconnectSession: () => void;
  speak: (text: string, options?: { force?: boolean; queue?: boolean }) => Promise<void>;
  stopSpeaking: () => Promise<void>;
  reinitializeAudio: () => Promise<void>;
}

const TutorServiceCtx = createContext<TutorServiceState | null>(null);

export function TutorServiceProvider({ children }: { children: ReactNode }) {
  const [voice, setVoiceState] = useState<TutorVoice>("male");
  const [mood, setMood] = useState<UserMood | null>(null);
  const [ttsEnabled, setTtsEnabledState] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [volume, setVolumeState] = useState(() => {
    return parseFloat(localStorage.getItem("tutor_voice_volume") || "1.0");
  });
  const [speed, setSpeedState] = useState(() => {
    return parseFloat(localStorage.getItem("tutor_voice_speed") || "1.0");
  });
  const [voiceHistory, setVoiceHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("tutor_voice_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [customVoices, setCustomVoices] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("tutor_custom_voices");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // TTS Queue to prevent overlapping
  const ttsQueue = useRef<string[]>([]);
  const isProcessingQueue = useRef(false);

  const liveTools = useGeminiLive({
    onError: (e) => toast.error(`Live Error: ${e}`),
  });

  const connectSession = useCallback(
    async (retries = 3) => {
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
    },
    [liveTools],
  );

  const disconnectSession = useCallback(() => {
    liveTools.disconnect();
  }, [liveTools]);

  const stopSpeaking = useCallback(async () => {
    setSpeaking(false);
    ttsQueue.current = []; // Clear queue
    await HardwareBridge.ttsStop();
  }, []);

  const reinitializeAudio = useCallback(async () => {
    try {
      await stopSpeaking();
      if (liveTools.connected) {
        liveTools.disconnect();
        await connectSession();
      }
      console.log("[AudioEngine] Immediate re-initialization successful");
    } catch (err) {
      console.warn("[AudioEngine] Re-init error:", err);
    }
  }, [stopSpeaking, liveTools, connectSession]);

  const setVolume = useCallback(
    (v: number) => {
      setVolumeState(v);
      localStorage.setItem("tutor_voice_volume", String(v));
      reinitializeAudio();
    },
    [reinitializeAudio],
  );

  const setSpeed = useCallback(
    (v: number) => {
      setSpeedState(v);
      localStorage.setItem("tutor_voice_speed", String(v));
      reinitializeAudio();
    },
    [reinitializeAudio],
  );

  const addToVoiceHistory = useCallback((voiceName: string) => {
    setVoiceHistory((prev) => {
      const filtered = prev.filter((v) => v !== voiceName);
      const next = [voiceName, ...filtered].slice(0, 5);
      localStorage.setItem("tutor_voice_history", JSON.stringify(next));
      return next;
    });
  }, []);

  const persona = useMemo(() => {
    const base = DEFAULT_PERSONA_CONFIGS[voice];
    return {
      ...base,
      voiceName: customVoices[base.name] || base.voiceName,
    };
  }, [voice, customVoices]);

  const setPersonaVoice = useCallback(
    (personaName: "Adams" | "Haawa", voiceName: string) => {
      setCustomVoices((prev) => {
        const next = { ...prev, [personaName]: voiceName };
        localStorage.setItem("tutor_custom_voices", JSON.stringify(next));
        return next;
      });
      addToVoiceHistory(voiceName);
    },
    [addToVoiceHistory],
  );

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

        // Auto-adjust pitch based on sentiment/tone hints
        let sentimentPitchBonus = 0;
        const encouragingWords = [
          "well done",
          "excellent",
          "great job",
          "amazing",
          "correct",
          "good",
          "perfect",
          "brilliant",
          "keep it up",
        ];
        if (encouragingWords.some((w) => textToSpeak.toLowerCase().includes(w))) {
          sentimentPitchBonus = 0.15; // Slightly higher pitch for encouragement
        }

        await HardwareBridge.ttsSpeak(textToSpeak, {
          rate: speed,
          pitch: Math.min(2.0, persona.pitch + savedPitchAdj + sentimentPitchBonus),
          lang: persona.voice === "male" ? "en-GB" : "en-US",
          voiceName: persona.voiceName,
          gender: persona.voice,
          volume: volume,
        });
      } catch (e) {
        console.error("TTS failed", e);
        toast.error("Voice output failed. Please check your audio settings.");
      }
    }

    setSpeaking(false);
    isProcessingQueue.current = false;
    processQueue(); // Process next item
  }, [persona, speed, volume]);

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

  const setVoice = useCallback(
    (v: TutorVoice) => {
      setVoiceState(v);
      reinitializeAudio();
    },
    [reinitializeAudio],
  );
  const setTtsEnabled = useCallback((b: boolean) => setTtsEnabledState(b), []);

  const value = {
    persona,
    mood,
    speaking,
    connected: liveTools.connected,
    ttsEnabled,
    volume,
    speed,
    voiceHistory,
    setVoice,
    setPersonaVoice,
    setVolume,
    setSpeed,
    addToVoiceHistory,
    setMood,
    setTtsEnabled,
    connectSession,
    disconnectSession,
    speak,
    stopSpeaking,
    reinitializeAudio,
  };

  return <TutorServiceCtx.Provider value={value}>{children}</TutorServiceCtx.Provider>;
}

export const useTutor = () => {
  const ctx = useContext(TutorServiceCtx);
  if (!ctx) throw new Error("useTutor must be used within a TutorServiceProvider");
  return ctx;
};
