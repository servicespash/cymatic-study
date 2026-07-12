import { useEffect, useRef, useState, useCallback } from "react";

export function useLiveHardware(
  open: boolean,
  connected: boolean,
  cameraOn: boolean,
  sendFrame: (frame: string) => void,
  onClose: () => void,
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Init Hardware
  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;

        // Setup visualizer
        const AudioContextClass =
          (window as any).AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;
      } catch (e) {
        console.error("Permissions required for Live Session", e);
        onClose();
      }
    };

    init();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, [open, onClose]);

  // 1fps Frame Capture
  useEffect(() => {
    if (!connected || !cameraOn) return;
    const id = setInterval(() => {
      const v = videoRef.current;
      const c = canvasRef.current;
      if (!v || !c || v.videoWidth === 0) return;
      c.width = 320;
      c.height = (v.videoHeight / v.videoWidth) * c.width;
      const ctx = c.getContext("2d");
      if (ctx) {
        ctx.drawImage(v, 0, 0, c.width, c.height);
        sendFrame(c.toDataURL("image/jpeg", 0.6));
      }
    }, 1000);
    return () => clearInterval(id);
  }, [connected, cameraOn, sendFrame]);

  return { videoRef, canvasRef, analyserRef };
}
