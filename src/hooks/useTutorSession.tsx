import React, { createContext, useContext, useCallback, useRef, useState, ReactNode } from "react";
import { useGeminiLive } from "@/hooks/useGeminiLive";
import { toast } from "sonner";
import { TutorResponse } from "@/types/tutor-protocol";

// Define the shape of our persistent session state
interface TutorSessionState {
  connected: boolean;
  isSessionActive: boolean;
  history: any[]; // Extended history for multi-turn reasoning
  lastTutorResponse: TutorResponse | null;
}

interface TutorSessionContextType {
  state: TutorSessionState;
  connectSession: () => Promise<void>;
  disconnectSession: () => void;
  // Expose the underlying live tools for direct UI usage
  liveTools: ReturnType<typeof useGeminiLive>;
}

const TutorSessionCtx = createContext<TutorSessionContextType | null>(null);

export function TutorSessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TutorSessionState>({
    connected: false,
    isSessionActive: false,
    history: [],
    lastTutorResponse: null,
  });

  // Centralized Gemini Live hook
  const liveTools = useGeminiLive({
    onError: (e) => {
      toast.error(`Session Error: ${e}`);
      setState((p) => ({ ...p, connected: false }));
    },
    onTranscript: (role, text) => {
      if (role === "model") {
        try {
          // Try to parse structured response if model follows protocol
          const parsed = JSON.parse(text) as TutorResponse;
          setState((p) => ({ ...p, lastTutorResponse: parsed }));
        } catch (e) {
          // Fallback if not JSON
          console.log(`[TutorSession] ${role}: ${text}`);
        }
      }
    },
  });

  const connectSession = useCallback(async () => {
    if (state.isSessionActive) return;

    setState((p) => ({ ...p, isSessionActive: true }));
    try {
      await liveTools.connect();
      setState((p) => ({ ...p, connected: true }));
    } catch (e) {
      console.error("Failed to connect session", e);
      setState((p) => ({ ...p, isSessionActive: false, connected: false }));
    }
  }, [liveTools, state.isSessionActive]);

  const disconnectSession = useCallback(() => {
    liveTools.disconnect();
    setState((p) => ({ ...p, connected: false, isSessionActive: false }));
  }, [liveTools]);

  const contextValue = { state, connectSession, disconnectSession, liveTools };
  return <TutorSessionCtx.Provider value={contextValue}>{children}</TutorSessionCtx.Provider>;
}

export const useTutorSession = () => {
  const ctx = useContext(TutorSessionCtx);
  if (!ctx) throw new Error("useTutorSession must be used within a TutorSessionProvider");
  return ctx;
};
