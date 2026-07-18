import React, { useEffect, useState } from "react";
import { Camera, Mic, Bell, HardDrive, MapPin, Monitor, CheckCircle2 } from "lucide-react";
import { requestAllPermissions, type PermissionStatus } from "@/lib/permissions";
import { Capacitor } from "@capacitor/core";

export const PermissionsPanel: React.FC = () => {
  const [status, setStatus] = useState<PermissionStatus | null>(null);

  const check = async () => {
    const s = await requestAllPermissions();
    setStatus(s);
  };

  useEffect(() => {
    check();
  }, []);

  const request = async (key: keyof PermissionStatus) => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      if (key === "camera") {
        const { Camera } = await import("@capacitor/camera");
        await Camera.requestPermissions();
      }
      if (key === "microphone") {
        const { SpeechRecognition } = await import("@capacitor-community/speech-recognition");
        await SpeechRecognition.requestPermissions();
      }
      if (key === "notifications") {
        const { LocalNotifications } = await import("@capacitor/local-notifications");
        await LocalNotifications.requestPermissions();
      }
      if (key === "geolocation") {
        const { Geolocation } = await import("@capacitor/geolocation");
        await Geolocation.requestPermissions();
      }
      if (key === "storage") {
        const { Filesystem } = await import("@capacitor/filesystem");
        await Filesystem.requestPermissions();
      }
    } catch (e) {
      console.warn("Permission request failed", e);
    }
    check();
  };

  if (!status) return null;

  const items = [
    { key: "camera", label: "Camera", icon: Camera, desc: "For Vision and Live Sessions" },
    {
      key: "microphone",
      label: "Microphone",
      icon: Mic,
      desc: "For voice chat with Adams & Haawa",
    },
    {
      key: "notifications",
      label: "Notifications",
      icon: Bell,
      desc: "For daily discipline nudges",
    },
    { key: "geolocation", label: "Location", icon: MapPin, desc: "For weather-aware greetings" },
    { key: "storage", label: "Storage", icon: HardDrive, desc: "For offline notes and assets" },
  ];

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const Icon = item.icon;
        const val = status[item.key as keyof PermissionStatus];
        const isGranted = val === "granted";
        const isUnavailable = val === "unavailable";

        return (
          <div
            key={item.key}
            className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/50"
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${isGranted ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{item.label}</p>
                <p className="text-[10px] text-muted-foreground">{item.desc}</p>
              </div>
            </div>

            <button
              onClick={() => request(item.key as keyof PermissionStatus)}
              disabled={isGranted || isUnavailable}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                isGranted
                  ? "bg-success/20 text-success border border-success/30"
                  : isUnavailable
                    ? "bg-muted text-muted-foreground/50"
                    : "bg-primary text-primary-foreground shadow-glow hover:scale-105 active:scale-95"
              }`}
            >
              {isGranted ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Granted
                </span>
              ) : isUnavailable ? (
                "N/A"
              ) : (
                "Grant"
              )}
            </button>
          </div>
        );
      })}

      {Capacitor.getPlatform() === "android" && (
        <div className="mt-6 p-4 rounded-2xl border border-dashed border-primary/30 bg-primary/5">
          <div className="flex gap-3">
            <Monitor className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-bold text-foreground">Advanced Android Controls</p>
              <p className="text-xs text-muted-foreground mb-3">
                To enable "Display over other apps" (Mira Overlay) or "Screen overview", please open
                system settings.
              </p>
              <button
                className="text-[10px] font-black uppercase text-primary hover:underline"
                onClick={() => {
                  // Intent logic would go here via a native plugin
                  console.info("Opening Android Settings...");
                }}
              >
                Open Android System Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
