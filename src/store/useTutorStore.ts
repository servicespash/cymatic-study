import { create } from "zustand";
import { db, ChatSession } from "@/lib/db";
import { toast } from "sonner";

export type Message = {
  id: string;
  sender: "student" | "tutor" | "socratic_tutor";
  text: string;
  timestamp: string;
};

interface TutorState {
  messages: Message[];
  isLoading: boolean;
  persona: "Adams" | "Haawa";
  sessionId: number | null;
  sessions: ChatSession[];

  // Actions
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  setLoading: (isLoading: boolean) => void;
  setPersona: (persona: "Adams" | "Haawa") => void;
  clearMessages: () => void;
  loadSessions: () => Promise<void>;
  createNewSession: () => Promise<void>;
  deleteSession: (id: number) => Promise<void>;
  loadSession: (id: number) => Promise<void>;
}

export const useTutorStore = create<TutorState>((set, get) => ({
  messages: [],
  isLoading: false,
  persona: "Adams",
  sessionId: null,
  sessions: [],

  setMessages: (messages: Message[]) => set({ messages }),
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
    get().loadSessions();
  },
  setLoading: (isLoading) => set({ isLoading }),
  setPersona: (persona) => set({ persona }),
  clearMessages: () => set({ messages: [], sessionId: null }),
  loadSessions: async () => {
    const sessions = await db.chatSessions.toArray();
    set({ sessions });
  },

  createNewSession: async () => {
    const count = await db.chatSessions.count();
    if (count >= 20) {
      toast.error("Max chat sessions reached (20). Please delete an old session.");
      return;
    }
    set({ messages: [], sessionId: null });
  },
  deleteSession: async (id: number) => {
    await db.chatSessions.delete(id);
    await get().loadSessions();
    const lastSession = await db.chatSessions.orderBy("timestamp").last();
    if (lastSession) {
      set({ messages: lastSession.messages, sessionId: lastSession.id });
    } else {
      set({ messages: [], sessionId: null });
    }
  },

  loadSession: async (id) => {
    const session = await db.chatSessions.get(id);
    if (session) {
      set({ messages: session.messages, sessionId: session.id });
    }
  },
}));
