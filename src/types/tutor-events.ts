/**
 * Structured Event Protocol for Backend-Orchestrated Tutor System
 * Defines the contract between Supabase Edge Function (Orchestrator) and Client.
 */

export type EventType = "audio_chunk" | "text_content" | "ui_command" | "ack";

export interface BaseEvent {
  event_id: string; // Unique ID for sequencing
  timestamp: number;
}

export interface AudioEvent extends BaseEvent {
  type: "audio_chunk";
  payload: {
    mimeType: "audio/opus"; // Optimized for fidelity/latency
    data: string; // Base64 encoded Opus
  };
}

export interface TextEvent extends BaseEvent {
  type: "text_content";
  payload: {
    content_key: string; // Key to look up in tutor_content table
    text: string; // Fallback or computed text
  };
}

export interface UICommandEvent extends BaseEvent {
  type: "ui_command";
  payload: {
    action: "open_widget" | "trigger_haptic" | "show_notification";
    data: any;
  };
}

export interface AckEvent extends BaseEvent {
  type: "ack";
  payload: {
    message_id: string; // The ID being acknowledged
  };
}

export type TutorEvent = AudioEvent | TextEvent | UICommandEvent | AckEvent;
