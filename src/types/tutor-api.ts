export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface TutorRequest {
  messages: ChatMessage[];
  userName?: string;
  subject?: string;
}
