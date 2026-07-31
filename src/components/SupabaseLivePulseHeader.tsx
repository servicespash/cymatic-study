import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Activity, RefreshCw, CheckCircle2, AlertCircle, Wifi } from "lucide-react";

interface SupabaseLivePulseProps {
  onStatusChange?: (status: "healthy" | "pending" | "error") => void;
}

export function SupabaseLivePulseHeader({ onStatusChange }: SupabaseLivePulseProps) {
  const [status, setStatus] = useState<"healthy" | "pending" | "error">("healthy");
  const [latency, setLatency] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  const checkHealth = async () => {
    setIsChecking(true);
    setStatus("pending");
    if (onStatusChange) onStatusChange("pending");

    const start = Date.now();
    try {
      // Ping Supabase auth or a lightweight table check
      const { error } = await supabase.auth.getSession();
      const duration = Date.now() - start;
      setLatency(duration);

      if (error) {
        setStatus("error");
        if (onStatusChange) onStatusChange("error");
      } else {
        setStatus("healthy");
        if (onStatusChange) onStatusChange("healthy");
      }
    } catch (err) {
      setStatus("error");
      if (onStatusChange) onStatusChange("error");
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    void checkHealth();
    const interval = setInterval(() => {
      void checkHealth();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-background/80 border border-border text-xs shadow-xs">
      <div className="relative flex items-center justify-center w-2.5 h-2.5">
        {status === "healthy" && (
          <>
            <span className="absolute w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-75"></span>
            <span className="relative w-2 h-2 rounded-full bg-emerald-600"></span>
          </>
        )}
        {status === "pending" && (
          <>
            <span className="absolute w-3 h-3 rounded-full bg-amber-500 animate-pulse opacity-90"></span>
            <span className="relative w-2 h-2 rounded-full bg-amber-600"></span>
          </>
        )}
        {status === "error" && (
          <span className="relative w-2 h-2 rounded-full bg-rose-500"></span>
        )}
      </div>

      <span className="font-medium text-muted-foreground flex items-center gap-1.5">
        <Wifi className="w-3.5 h-3.5 opacity-70" />
        {status === "healthy"
          ? `Supabase Live ${latency ? `(${latency}ms)` : ""}`
          : status === "pending"
          ? "Syncing Auth..."
          : "Connection Degraded"}
      </span>

      <button
        onClick={() => void checkHealth()}
        disabled={isChecking}
        className="ml-1 p-1 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
        title="Ping Supabase connection"
      >
        <RefreshCw className={`w-3 h-3 ${isChecking ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
}
