// Updated Gemini Live API client — now acts as a listener to backend-orchestrated events.
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { TutorEvent } from "@/types/tutor-events";

type GeminiLiveOptions = {
  voice?: string;
  onError?: (err: string) => void;
};

export function useGeminiLive(opts: GeminiLiveOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const micStreamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) wsRef.current.close();
    wsRef.current = null;
    setConnected(false);
    setSpeaking(false);
  }, []);

  const connect = useCallback(async () => {
    cleanup();

    const { data: sess } = await supabase.auth.getSession();
    const access = sess.session?.access_token;
    if (!access) {
      opts.onError?.("Not signed in");
      return;
    }

    // Connect to our new backend orchestrator
    const orchestratorUrl = `${import.meta.env.VITE_SUPABASE_URL.replace("https", "wss")}/functions/v1/tutor-orchestrator`;
    const ws = new WebSocket(orchestratorUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onmessage = async (ev) => {
      try {
        const event = JSON.parse(ev.data) as TutorEvent;
        console.log("RECEIVED EVENT:", event);

        switch (event.type) {
          case "audio_chunk":
            // ... handle audio
            break;
          case "text_content":
            // ... update UI with dynamic text
            break;
          case "ui_command":
            // ... handle command
            break;
          case "ack":
            // ... handle ACK
            break;
        }
      } catch (e) {
        console.warn("ws event parse", e);
      }
    };
  }, [opts, cleanup]);

  // Sync muted state to tracks
  useEffect(() => {
    if (micStreamRef.current) {
      micStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = !muted));
    }
  }, [muted]);

  const disconnect = useCallback(() => cleanup(), [cleanup]);

  useEffect(() => () => cleanup(), [cleanup]);

  return {
    connect,
    disconnect,
    connected,
    speaking,
    muted,
    setMuted,
    cameraOn,
    setCameraOn,
  };
}
