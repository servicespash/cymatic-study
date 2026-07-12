import { create } from "zustand";
import { db, ChatSession } from "@/lib/db";

export type Message = {
  id: string;
  sender: "user" | "tutor";
  text: string;
  timestamp: string;
};

interface TutorState {
  messages: Message[];
  isLoading: boolean;
  persona: "Adams" | "Haawa";
  sessionId: number | null;

  // Actions
  addMessage: (message: Message) => void;
  setLoading: (isLoading: boolean) => void;
  setPersona: (persona: "Adams" | "Haawa") => void;
  clearMessages: () => void;
  loadLastSession: () => Promise<void>;
  loadSession: (id: number) => Promise<void>;
}

export const useTutorStore = create<TutorState>((set, get) => ({
  messages: [],
  isLoading: false,
  persona: "Adams",
  sessionId: null,

  addMessage: async (message) => {
    set((state) => {
      const newMessages = [...state.messages, message];

      // Persist to Dexie
      if (state.sessionId) {
        db.chatSessions.update(state.sessionId, { messages: newMessages });
      } else {
        db.chatSessions
          .add({ messages: newMessages, timestamp: Date.now() })
          .then((id) => set({ sessionId: id }));
      }

      return { messages: newMessages };
    });
  },
  setLoading: (isLoading) => set({ isLoading }),
  setPersona: (persona) => set({ persona }),
  clearMessages: () => set({ messages: [], sessionId: null }),

  loadLastSession: async () => {
    const lastSession = await db.chatSessions.orderBy("timestamp").last();
    if (lastSession) {
      set({ messages: lastSession.messages, sessionId: lastSession.id });
    }
  },

  loadSession: async (id) => {
    const session = await db.chatSessions.get(id);
    if (session) {
      set({ messages: session.messages, sessionId: session.id });
    }
  },
}));
