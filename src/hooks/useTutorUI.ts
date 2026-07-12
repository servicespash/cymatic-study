import { useEffect } from "react";
import { useTutorSession } from "./useTutorSession";
import { toast } from "sonner";

/**
 * Middleware hook that listens for structured TutorResponses
 * and triggers proactive UI actions (haptics, widgets, etc.)
 */
export function useTutorUI() {
  const { state } = useTutorSession();
  const lastAction = state.lastTutorResponse?.ui_actions?.[0]; // Get the first action for now

  useEffect(() => {
    if (!lastAction) return;

    console.log("[TutorUI] Processing action:", lastAction);

    switch (lastAction.type) {
      case "trigger_haptic":
        // Placeholder: Implement Capacitor haptics integration here
        console.log("Triggering Haptic:", lastAction.payload.hapticType);
        // Example: Haptics.vibrate({ duration: 100 });
        break;

      case "open_widget":
        console.log("Proactively Opening Widget:", lastAction.payload.widgetType);
        // Logic to trigger widget display
        break;

      case "show_toast":
        toast(lastAction.payload.message || "New Tutor Update");
        break;

      default:
        console.warn("Unknown UI Action type:", lastAction.type);
    }
  }, [lastAction]);
}
