/**
 * Structured Interaction Protocol for Tutor
 * Allows the AI to send structured UI/state instructions alongside audio/text responses.
 */

export type HapticType = "light" | "medium" | "heavy" | "success" | "warning" | "error";

export type WidgetType = "scorecard" | "mini-graph" | "task-list" | "resource-viewer";

export interface UiAction {
  type: "trigger_haptic" | "open_widget" | "close_widget" | "update_widget" | "show_toast";
  payload: {
    hapticType?: HapticType;
    widgetType?: WidgetType;
    widgetId?: string;
    data?: Record<string, any>;
    message?: string;
  };
}

export interface TutorResponse {
  // Verbal part for TTS
  spoken_text: string;

  // Optional instructions for front-end UI/State
  ui_actions?: UiAction[];

  // Ephemeral status update
  status?: {
    tutor_mood: string;
  };
}
