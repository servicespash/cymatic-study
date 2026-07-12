/**
 * 🧬 CYMATIC HUB: MOOD LOGIC ENGINE
 * Influences dynamic greetings and tutoring interaction based on mood and time.
 */

import { type UserMood } from "./user-mood-context";

export const MoodLogicEngine = {
  location: "Home Dashboard",
  buttonPosition: "Next to AI Tutor Trigger",
  behavior: "Influences dynamic greetings and tutoring interaction based on mood and time",

  getMoodModifier: (mood: UserMood | null) => {
    switch (mood) {
      case "stressed":
        return {
          ttsRate: 0.7,
          priority: "EMOTIONAL_COMFORT",
          uiOverlay: "Soft Noir",
        };
      case "focused":
        return {
          ttsRate: 1.0,
          priority: "TASK_FOCUS",
          uiOverlay: "Cyan Glow",
        };
      case "tired":
        return {
          ttsRate: 0.85,
          priority: "GENTLE_REVIEW",
          uiOverlay: "Amber Glow",
        };
      default:
        return {
          ttsRate: 1.0,
          priority: "NORMAL",
          uiOverlay: "Default",
        };
    }
  },
};
