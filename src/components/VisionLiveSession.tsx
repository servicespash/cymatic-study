import React, { useEffect, useRef, useState, useCallback } from "react";
import { useTutor } from "@/lib/TutorService";
import { useAuth } from "@/lib/auth-context";
import { useGeminiLive } from "@/hooks/useGeminiLive";
import { cn } from "@/lib/utils";
import { X, Mic, MicOff, Camera, CameraOff, Loader2, FlipHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const VisionLiveSession: React.FC<{
  open: boolean;
  onClose: () => void;
  mode?: "overlay" | "dock";
}> = ({ open, onClose, mode = "overlay" }) => {
  const { persona, voice } = useTutor();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [transcript, setTranscript] = useState<string>("");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const liveVoice = voice === "male" ? "Charon" : "Aoede";
  const name = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "learner";
  const systemInstruction =
    voice === "male"
      ? `You are Adams, a protective and practical mentor from Uganda. Engage the student, ${name}, in natural, flowing dialogue. Focus on deep understanding rather than brief responses. Use warm, natural Ugandan English. Be proactive in asking questions based on what you see, and guide the student with brotherly, encouraging wisdom. Prioritize conversational depth.`
      : `You are Haawa, a supportive and wise mentor from Uganda. Engage the student, ${name}, in natural, flowing dialogue. Focus on deep understanding rather than brief responses. Use soft, lyrical, and warm Ugandan English. Be proactive in asking questions based on what you see, and guide the student with sisterly, encouraging wisdom. Prioritize conversational depth.`;

  const { connect, disconnect, sendFrame, connected, speaking } = useGeminiLive({
    voice: liveVoice,
    systemInstruction,
    onTranscript: (role, text) => {
      if (role === "model") {
        setTranscript((p) => (p + " " + text).trim().slice(-280));
      } else if (role === "user") {
        void handleStructuredTrigger(text);
      }
    },
    onError: (e) => toast.error(e),
  });

  const handleStructuredTrigger = async (transcript: string) => {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tutor-chat`;
    try {
      const { data: sess } = await supabase.auth.getSession();
      const accessToken = sess.session?.access_token;
      if (!accessToken) return;

      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          messages: [{ role: "user", content: transcript }],
          persona: voice,
          userName: name,
          user_id: user?.id,
          context: { route: "VisionLiveSession" },
        }),
      });
    } catch (e) {
      console.error("Structured trigger failed", e);
    }
  };

  const startStream = useCallback(
    async (mode: "user" | "environment") => {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: mode },
          audio: true,
        });
        streamRef.current = s;
        if (videoRef.current) videoRef.current.srcObject = s;
        setFacingMode(mode);
      } catch (e) {
        toast.error("Camera/Mic permission required");
        onClose();
      }
    },
    [onClose],
  );

  // Start camera + connect when opened
  useEffect(() => {
    if (!open) return;

    (async () => {
      await startStream(facingMode);
      await connect();
    })();

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, connect, disconnect]);

  // Send a JPEG frame every 1s while connected + camera on
  useEffect(() => {
    if (!open || !connected || !cameraOn) return;
    const id = setInterval(() => {
      const v = videoRef.current;
      const c = canvasRef.current;
      if (!v || !c || v.videoWidth === 0) return;
      const w = 640;
      const h = (v.videoHeight / v.videoWidth) * w;
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d");
      if (!ctx) return;

      // Do NOT flip/mirror the canvas for the AI analysis
      ctx.drawImage(v, 0, 0, w, h);
      sendFrame(c.toDataURL("image/jpeg", 0.7)); // Higher quality
    }, 1000);
    return () => clearInterval(id);
  }, [open, connected, cameraOn, sendFrame]);

  if (!open) return null;

  if (mode === "dock") {
    return (
      <div
        className="relative h-12 w-12 rounded-full overflow-hidden border border-white/20 bg-zinc-900 flex items-center justify-center cursor-pointer"
        onClick={onClose}
      >
        {cameraOn ? (
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
        ) : (
          <CameraOff className="h-4 w-4 text-zinc-500" />
        )}
        {connected && (
          <div
            className={cn(
              "absolute inset-0 border-2 rounded-full animate-pulse",
              speaking ? "border-primary" : "border-emerald-500",
            )}
          />
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[150] bg-black font-geist">
      {cameraOn ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover scale-x-100"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gray-900">
          <CameraOff className="h-20 w-20 text-gray-700" />
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />

      <div
        className={cn(
          "absolute inset-0 pointer-events-none transition-opacity duration-1000",
          voice === "male" ? "bg-blue-900/20" : "bg-purple-900/20",
          speaking && "opacity-100",
        )}
      />

      <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
        <div className="glass px-4 py-2 rounded-2xl">
          <h2 className="text-white font-bold flex items-center gap-2">
            {!connected ? (
              <Loader2 className="h-4 w-4 animate-spin text-white/70" />
            ) : (
              <div
                className={cn(
                  "h-3 w-3 rounded-full",
                  speaking
                    ? voice === "male"
                      ? "bg-blue-400 shadow-[0_0_12px_#60a5fa] animate-pulse"
                      : "bg-purple-400 shadow-[0_0_12px_#c084fc] animate-pulse"
                    : "bg-emerald-400",
                )}
              />
            )}
            {persona.name} — {connected ? "Live" : "Connecting…"}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="h-10 w-10 glass rounded-full flex items-center justify-center text-white"
          aria-label="End session"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {transcript && (
        <div className="absolute bottom-32 left-6 right-6 mx-auto max-w-xl glass rounded-2xl px-4 py-3 text-center text-sm text-white/90">
          {transcript}
        </div>
      )}

      <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-6">
        <button
          onClick={() => {
            setMicOn((v) => !v);
            streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !micOn));
          }}
          className={cn(
            "h-16 w-16 rounded-full glass flex items-center justify-center text-white",
            !micOn && "bg-red-500/50",
          )}
          aria-label={micOn ? "Mute mic" : "Unmute mic"}
        >
          {micOn ? <Mic /> : <MicOff />}
        </button>
        <button
          onClick={() => setCameraOn((v) => !v)}
          className={cn(
            "h-16 w-16 rounded-full glass flex items-center justify-center text-white",
            !cameraOn && "bg-red-500/50",
          )}
          aria-label={cameraOn ? "Turn camera off" : "Turn camera on"}
        >
          {cameraOn ? <Camera /> : <CameraOff />}
        </button>
        <button
          onClick={() => startStream(facingMode === "user" ? "environment" : "user")}
          className="h-16 w-16 rounded-full glass flex items-center justify-center text-white"
          aria-label="Switch camera"
        >
          <FlipHorizontal />
        </button>
      </div>
    </div>
  );
};
