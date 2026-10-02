import { create } from "zustand";
import { db, ChatSession } from "@/lib/db";
import { supabase } from "@/lib/supabase";
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
  updateSessionMeta: (id: number, meta: { title?: string; summary?: string }) => Promise<void>;
  deleteSession: (id: number) => Promise<void>;
  loadSession: (id: number) => Promise<void>;
  syncToSupabase: () => Promise<void>;
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
              .then((id: number) => {
                set({ sessionId: id });
                get().syncToSupabase();
              })
              .catch(console.error);
          }
        }
      } catch (err) {
        console.warn("Failed to persist chat session:", err);
      }

      return { messages: newMessages };
    });
    void get().loadSessions();
    void get().syncToSupabase();
  },
  setLoading: (isLoading) => set({ isLoading }),
  setPersona: (persona) => set({ persona }),
  clearMessages: () => set({ messages: [], sessionId: null }),
  loadSessions: async () => {
    try {
      if (db?.chatSessions) {
        const sessions = await db.chatSessions.toArray();
        set({ sessions: sessions.sort((a, b) => b.timestamp - a.timestamp) });
      }
    } catch (e) {
      console.warn("Failed to load chat sessions:", e);
    }
  },

  createNewSession: async () => {
    set({ messages: [], sessionId: null });
  },

  updateSessionMeta: async (id: number, meta: { title?: string; summary?: string }) => {
    try {
      if (db?.chatSessions) {
        await db.chatSessions.update(id, meta);
        await get().loadSessions();
        await get().syncToSupabase();
      }
    } catch (e) {
      console.warn("Failed updating session meta:", e);
    }
  },

  deleteSession: async (id: number) => {
    try {
      if (db?.chatSessions) {
        await db.chatSessions.delete(id);
        await get().loadSessions();

        // Also delete from Supabase if possible
        const { data: user } = await supabase.auth.getUser();
        if (user.user) {
          await supabase
            .from("tutor_sessions")
            .delete()
            .eq("local_id", id)
            .eq("user_id", user.user.id);
        }

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

  syncToSupabase: async () => {
    // Only sync if online
    if (!navigator.onLine) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      if (db?.chatSessions) {
        const sessions = await db.chatSessions.toArray();
        if (sessions.length === 0) return;

        const syncData = sessions.map((s) => ({
          session_id: String(s.id),
          user_id: user.id,
          history: s.messages as any,
          current_state: {
            title: s.title || `Study Session #${s.id}`,
            summary: s.summary || "",
          } as any,
          last_updated: new Date(s.timestamp).toISOString(),
        }));

        const { error } = await supabase.from("tutor_sessions").upsert(syncData, {
          onConflict: "session_id,user_id",
          ignoreDuplicates: false,
        });

        if (error) {
          console.warn("Supabase sync error:", error.message);
        } else {
          console.log("[Sync] History successfully pushed to Supabase");
        }
      }
    } catch (e) {
      console.warn("Sync failed:", e);
    }
  },
}));

// Setup background sync interval (every 5 minutes)
if (typeof window !== "undefined") {
  setInterval(
    () => {
      useTutorStore.getState().syncToSupabase();
    },
    1000 * 60 * 5,
  );
}
