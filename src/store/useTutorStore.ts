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

      // Persist to Dexie safely
      try {
        if (db?.chatSessions) {
          if (state.sessionId) {
            db.chatSessions.update(state.sessionId, { messages: newMessages }).catch(console.error);
          } else {
            db.chatSessions
              .add({ messages: newMessages, timestamp: Date.now() })
              .then((id: number) => set({ sessionId: id }))
              .catch(console.error);
          }
        }
      } catch (err) {
        console.warn("Failed to persist chat session:", err);
      }

      return { messages: newMessages };
    });
    void get().loadSessions();
  },
  setLoading: (isLoading) => set({ isLoading }),
  setPersona: (persona) => set({ persona }),
  clearMessages: () => set({ messages: [], sessionId: null }),
  loadSessions: async () => {
    try {
      if (db?.chatSessions) {
        const sessions = await db.chatSessions.toArray();
        set({ sessions });
      }
    } catch (e) {
      console.warn("Failed to load chat sessions:", e);
    }
  },

  createNewSession: async () => {
    try {
      if (db?.chatSessions) {
        const count = await db.chatSessions.count();
        if (count >= 20) {
          toast.error("Max chat sessions reached (20). Please delete an old session.");
          return;
        }
      }
    } catch (e) {
      console.warn("Failed counting chat sessions:", e);
    }
    set({ messages: [], sessionId: null });
  },
  deleteSession: async (id: number) => {
    try {
      if (db?.chatSessions) {
        await db.chatSessions.delete(id);
        await get().loadSessions();
        const lastSession = await db.chatSessions.orderBy("timestamp").last();
        if (lastSession) {
          set({ messages: lastSession.messages, sessionId: lastSession.id });
          return;
        }
      }
    } catch (e) {
      console.warn("Failed deleting chat session:", e);
    }
    set({ messages: [], sessionId: null });
  },

  loadSession: async (id: number) => {
    try {
      if (db?.chatSessions) {
        const session = await db.chatSessions.get(id);
        if (session) {
          set({ messages: session.messages, sessionId: session.id });
        }
      }
    } catch (e) {
      console.warn("Failed loading chat session:", e);
    }
  },
}));
