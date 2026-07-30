import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { TutorEvent } from "@/types/tutor-events";

export function useTutorEventBus(onEvent?: (event: TutorEvent) => void) {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const connect = useCallback(async () => {
    if (connecting || (ws.current && ws.current.readyState === WebSocket.OPEN)) return;

    setConnecting(true);
    setError(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setError("Unauthorized");
      setConnecting(false);
      return;
    }

    const orchestratorUrl = `${import.meta.env.VITE_SUPABASE_URL.replace("https", "wss")}/functions/v1/tutor-orchestrator`;
    const socket = new WebSocket(orchestratorUrl);

    socket.onopen = () => {
      console.log("[TutorEventBus] Connected");
      setConnected(true);
      setConnecting(false);
      reconnectAttempts.current = 0;
    };

    socket.onmessage = (ev) => {
      try {
        const event = JSON.parse(ev.data) as TutorEvent;
        console.log("[TutorEventBus] Event received:", event);
        if (onEventRef.current) onEventRef.current(event);
      } catch (e) {
        console.error("[TutorEventBus] Error parsing event:", e);
      }
    };

    socket.onclose = () => {
      setConnected(false);
      setConnecting(false);
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
      console.log(`[TutorEventBus] Reconnecting in ${delay}ms...`);
      setTimeout(connect, delay);
      reconnectAttempts.current++;
    };

    socket.onerror = (err) => {
      console.error("[TutorEventBus] Socket error:", err);
      setError("Connection failed");
    };

    ws.current = socket;
  }, [connecting]);

  const sendMessage = useCallback((type: string, payload: any) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      console.error("[TutorEventBus] Cannot send message: Not connected");
      return;
    }
    const message = {
      event_id: crypto.randomUUID(),
      type,
      payload,
      timestamp: Date.now(),
    };
    ws.current.send(JSON.stringify(message));
  }, []);

  useEffect(() => {
    return () => {
      ws.current?.close();
    };
  }, []);

  return { connected, connecting, error, connect, sendMessage };
}
