import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, X, ShieldCheck, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (schoolId: string) => void;
}

export function QRScannerModal({ isOpen, onClose, onScanSuccess }: QRScannerModalProps) {
  const [permissionState, setPermissionState] = useState<
    "prompt" | "granted" | "denied" | "loading"
  >("loading");
  const [devices, setDevices] = useState<any[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string>("");
  const [scannerError, setScannerError] = useState<string | null>(null);
  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const elementId = "html5qr-scanner-view";

  const triggerHapticAndDing = () => {
    // 1. Trigger Capacitor Native Haptic feedback
    try {
      Haptics.impact({ style: ImpactStyle.Medium });
    } catch (err) {
      console.log("Capacitor haptics not available in this environment.");
    }

    // 2. Play beautiful synthesized ding sound (dual-frequency resonant chime)
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();

        const playTone = (freq: number, startOffset: number, duration: number, volume: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset);

          gain.gain.setValueAtTime(0, ctx.currentTime + startOffset);
          gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + startOffset + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + startOffset + duration);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(ctx.currentTime + startOffset);
          osc.stop(ctx.currentTime + startOffset + duration);
        };

        playTone(987.77, 0, 0.35, 0.12); // B5 note
        playTone(1318.51, 0.05, 0.5, 0.12); // E6 note
      }
    } catch (err) {
      console.warn("Native audio generation was blocked or failed:", err);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const startScanner = async () => {
      setPermissionState("loading");
      setScannerError(null);

      try {
        // First check permissions and retrieve cameras
        const cameras = await Html5Qrcode.getCameras();
        setDevices(cameras);

        if (cameras.length === 0) {
          setPermissionState("denied");
          setScannerError("No video capture devices/cameras found on this system.");
          return;
        }

        setPermissionState("granted");

        // Select back camera if available, otherwise first camera
        const backCam = cameras.find(
          (c) =>
            c.label.toLowerCase().includes("back") || c.label.toLowerCase().includes("environment"),
        );
        const targetCamId = backCam ? backCam.id : cameras[0].id;
        setActiveCameraId(targetCamId);

        // Initialize the scanner
        const scanner = new Html5Qrcode(elementId);
        qrScannerRef.current = scanner;

        await scanner.start(
          targetCamId,
          {
            fps: 15,
            qrbox: (width, height) => {
              const size = Math.min(width, height) * 0.7;
              return { width: size, height: size };
            },
          },
          (decodedText) => {
            // Success
            handleDecodedText(decodedText);
          },
          () => {
            // Quietly parse frames without spamming logs
          },
        );
      } catch (err: any) {
        console.error("Camera access failed:", err);
        setPermissionState("denied");
        setScannerError(err?.message || "Failed to access system video input stream.");
      }
    };

    // Delay initialization slightly to let the modal fully mount the elementId div
    const timer = setTimeout(() => {
      startScanner();
    }, 250);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen]);

  const stopScanner = async () => {
    if (qrScannerRef.current && qrScannerRef.current.isScanning) {
      try {
        await qrScannerRef.current.stop();
      } catch (err) {
        console.warn("Error stopping scanner:", err);
      }
    }
    qrScannerRef.current = null;
  };

  const handleSwitchCamera = async () => {
    if (devices.length <= 1 || !qrScannerRef.current) return;

    const currentIndex = devices.findIndex((d) => d.id === activeCameraId);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextCamId = devices[nextIndex].id;

    const toastId = toast.loading("Switching active camera...");
    try {
      await stopScanner();
      setActiveCameraId(nextCamId);

      const scanner = new Html5Qrcode(elementId);
      qrScannerRef.current = scanner;

      await scanner.start(
        nextCamId,
        {
          fps: 15,
          qrbox: (width, height) => {
            const size = Math.min(width, height) * 0.7;
            return { width: size, height: size };
          },
        },
        (decodedText) => {
          handleDecodedText(decodedText);
        },
        () => {},
      );
      toast.success("Active camera updated!", { id: toastId });
    } catch (err) {
      toast.error("Failed to switch camera feed", { id: toastId });
    }
  };

  const handleDecodedText = (text: string) => {
    let finalSchoolId = text.trim();

    // Parse URL payload if applicable
    try {
      if (text.includes("verify-document") || text.startsWith("http")) {
        const url = new URL(text.startsWith("http") ? text : `https://${text}`);
        const schoolParam =
          url.searchParams.get("school") ||
          url.searchParams.get("school_id") ||
          url.searchParams.get("schoolId") ||
          url.searchParams.get("id");
        if (schoolParam) {
          finalSchoolId = schoolParam;
        }
      }
    } catch (e) {
      // Ignore parsing errors and treat it as raw ID
    }

    finalSchoolId = finalSchoolId.toUpperCase();
    triggerHapticAndDing();
    onScanSuccess(finalSchoolId);
    stopScanner();
    onClose();
    toast.success(`Successfully scanned school ID: ${finalSchoolId}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title */}
        <div className="mb-4 text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
            <Camera className="h-6 w-6 text-blue-400" />
          </div>
          <h3 className="text-lg font-black uppercase tracking-tight text-white flex items-center justify-center gap-1.5">
            Scan QR Code to Join
          </h3>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto mt-0.5">
            Hold your school's official QR Identity Badge up to the camera to link your account.
          </p>
        </div>

        {/* Scanner Viewport */}
        <div className="relative flex-1 bg-black rounded-2xl border border-white/5 overflow-hidden aspect-video flex flex-col items-center justify-center min-h-[250px]">
          {permissionState === "loading" && (
            <div className="text-center p-6 space-y-3 z-10">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mx-auto" />
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider animate-pulse">
                Accessing Device Camera...
              </p>
            </div>
          )}

          {permissionState === "denied" && (
            <div className="text-center p-6 space-y-3 max-w-sm z-10">
              <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
              <p className="text-sm font-bold text-white uppercase tracking-wide">
                Camera Access Failed
              </p>
              <p className="text-xs text-zinc-500 leading-relaxed">
                {scannerError ||
                  "Please grant camera permissions in your browser or device settings to scan school ID codes."}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.location.reload()}
                className="mt-2 border-white/10 bg-white/5 text-zinc-300 rounded-xl"
              >
                Retry Permission
              </Button>
            </div>
          )}

          {/* Active Reader Div */}
          <div
            id={elementId}
            className={`w-full h-full ${permissionState === "granted" ? "block" : "hidden"}`}
          />

          {/* Laser guideline overlay */}
          {permissionState === "granted" && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-dashed border-blue-500/50 rounded-2xl relative">
                {/* Horizontal scanning line */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-[bounce_3s_infinite]" />
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        {permissionState === "granted" && (
          <div className="mt-4 flex items-center justify-between gap-3 pt-3 border-t border-white/5">
            <span className="flex items-center gap-1.5 text-[10px] uppercase font-black tracking-wider text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
              Scanner Secure
            </span>
            {devices.length > 1 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleSwitchCamera}
                className="rounded-xl text-xs border-white/10 bg-white/5 text-zinc-300 hover:text-white"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Switch Camera
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
