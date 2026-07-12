// Request all runtime permissions needed by the app on Capacitor.
// On web this is a no-op (browser prompts on use).
import { Capacitor } from "@capacitor/core";

export type PermissionStatus = {
  camera: "granted" | "denied" | "prompt" | "unavailable";
  microphone: "granted" | "denied" | "prompt" | "unavailable";
  notifications: "granted" | "denied" | "prompt" | "unavailable";
  geolocation: "granted" | "denied" | "prompt" | "unavailable";
  storage: "granted" | "denied" | "prompt" | "unavailable";
};

export async function requestAllPermissions(): Promise<PermissionStatus> {
  const status: PermissionStatus = {
    camera: "prompt",
    microphone: "prompt",
    notifications: "prompt",
    geolocation: "prompt",
    storage: "prompt",
  };

  if (!Capacitor.isNativePlatform()) {
    // Web: browser handles per-API. Probe permissions API best-effort.
    try {
      const nav = navigator as Navigator & {
        permissions?: {
          query: (d: {
            name: PermissionName;
          }) => Promise<PermissionState extends never ? never : { state: PermissionState }>;
        };
      };
      const probe = async (name: string) => {
        try {
          const r = await nav.permissions?.query({ name: name as PermissionName });
          return (r?.state as "granted" | "denied" | "prompt") ?? "prompt";
        } catch (err) {
          console.warn("Probe failed", err);
          return "prompt";
        }
      };
      status.camera = await probe("camera");
      status.microphone = await probe("microphone");
      status.geolocation = await probe("geolocation");
      status.notifications =
        typeof Notification !== "undefined"
          ? (Notification.permission as "granted" | "denied" | "default") === "default"
            ? "prompt"
            : (Notification.permission as "granted" | "denied")
          : "unavailable";
      status.storage = "granted";
    } catch (err) {
      console.warn("Permissions API probe failed", err);
    }
    return status;
  }

  // Native
  try {
    const { Camera } = await import("@capacitor/camera");
    const c = await Camera.requestPermissions({ permissions: ["camera", "photos"] });
    status.camera = c.camera === "granted" ? "granted" : "denied";
  } catch (err) {
    console.warn("Camera permission request failed", err);
    status.camera = "unavailable";
  }

  try {
    const { SpeechRecognition } = await import("@capacitor-community/speech-recognition");
    const av = await SpeechRecognition.available();
    if (av.available) {
      const p = await SpeechRecognition.requestPermissions();
      status.microphone = p.speechRecognition === "granted" ? "granted" : "denied";
    } else status.microphone = "unavailable";
  } catch (err) {
    console.warn("Microphone permission request failed", err);
    status.microphone = "unavailable";
  }

  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const p = await LocalNotifications.requestPermissions();
    status.notifications = p.display === "granted" ? "granted" : "denied";
  } catch (err) {
    console.warn("Notification permission request failed", err);
    status.notifications = "unavailable";
  }

  try {
    const { Geolocation } = await import("@capacitor/geolocation");
    const p = await Geolocation.requestPermissions();
    status.geolocation = p.location === "granted" ? "granted" : "denied";
  } catch (err) {
    console.warn("Geolocation permission request failed", err);
    status.geolocation = "unavailable";
  }

  try {
    const { Filesystem } = await import("@capacitor/filesystem");
    const p = await Filesystem.requestPermissions();
    status.storage = p.publicStorage === "granted" ? "granted" : "denied";
  } catch (err) {
    console.warn("Storage permission request failed", err);
    status.storage = "unavailable";
  }

  return status;
}
