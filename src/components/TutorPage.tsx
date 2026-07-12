import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { MainContainer } from "./MainContainer";
import { ChatArea } from "./ChatArea";
import { InputField } from "./InputField";
import { TutorErrorBoundary } from "./TutorErrorBoundary";
import { Menu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTutorStore } from "@/store/useTutorStore";
import { useTutor } from "@/lib/TutorService";
import { useSearch } from "@tanstack/react-router";
import { generateOfflineTutorResponse } from "@/lib/offline-tutor";

export function TutorPage() {
  return (
    <TutorErrorBoundary>
      <TutorPageContent />
    </TutorErrorBoundary>
  );
}

function TutorPageContent() {
  const { messages, isLoading, addMessage, setLoading, clearMessages } = useTutorStore();
  const { persona } = useTutor();
  const [input, setInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [displayName, setDisplayName] = useState("Learner");
  const [offlineMode, setOfflineMode] = useState(!navigator.onLine);

  let prefill = "";
  try {
    const search = useSearch({ from: "/tutor" });
    prefill = search.prefill || "";
  } catch (e) {
    // Fail-safe if rendered outside the route context
  }

  useEffect(() => {
    const handleOnline = () => setOfflineMode(false);
    const handleOffline = () => setOfflineMode(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    async function fetchProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", user.id)
          .single();
        if (profile?.full_name) setDisplayName(profile.full_name);
      }
    }
    fetchProfile();
  }, []);

  // Prefill the input when navigated with a prompt
  useEffect(() => {
    if (prefill) {
      setInput(prefill);
    }
  }, [prefill]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = {
      id: crypto.randomUUID(),
      sender: "user" as const,
      text: input,
      timestamp: new Date().toLocaleTimeString(),
    };
    addMessage(userMsg);
    setInput("");
    setLoading(true);

    const tutorMsgId = crypto.randomUUID();
    addMessage({
      id: tutorMsgId,
      sender: "tutor" as const,
      text: "",
      timestamp: new Date().toLocaleTimeString(),
    });

    if (offlineMode) {
      // Simulate natural typing delay for offline mode
      setTimeout(() => {
        const reply = generateOfflineTutorResponse(
          userMsg.text,
          displayName,
          persona.voice || "female",
        );
        useTutorStore.getState().messages = useTutorStore
          .getState()
          .messages.map((msg) => (msg.id === tutorMsgId ? { ...msg, text: reply } : msg));
        setLoading(false);
      }, 800);
      return;
    }

    const currentMessages = useTutorStore.getState().messages;
    const history = currentMessages
      .filter((m) => m.text && m.id !== tutorMsgId)
      .slice(-10)
      .map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      }));

    try {
      console.log("Invoking tutor-chat with history:", {
        messages: history,
        userName: displayName,
        persona: persona.voice,
      });

      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tutor-chat`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
        },
        body: JSON.stringify({
          messages: history,
          userName: displayName,
          persona: persona.voice,
        }),
      });

      if (!res.ok) {
        throw new Error(`Tutor error: ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          let chunkText = "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              const j = JSON.parse(payload);
              const delta = j.choices?.[0]?.delta?.content;
              if (typeof delta === "string") {
                chunkText += delta;
              }
            } catch {
              // ignore
            }
          }

          if (chunkText) {
            useTutorStore.getState().messages = useTutorStore
              .getState()
              .messages.map((msg) =>
                msg.id === tutorMsgId ? { ...msg, text: msg.text + chunkText } : msg,
              );
          }
        }
      }
    } catch (e) {
      console.warn("Failed to reach live tutor. Activating offline Socratic fallback helper...", e);
      // Beautiful automatic fallback response
      const reply = generateOfflineTutorResponse(
        userMsg.text,
        displayName,
        persona.voice || "female",
      );
      useTutorStore.getState().messages = useTutorStore.getState().messages.map((msg) =>
        msg.id === tutorMsgId
          ? {
              ...msg,
              text: reply,
            }
          : msg,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    clearMessages();
    setIsSidebarOpen(false);
  };

  const handleSettingsClick = () => alert("Settings coming soon!");
  const handleFileClick = () => alert("Upload coming soon!");
  const handleMicClick = () => alert("Voice coming soon!");
  const handleToggleCall = () => alert("Toggle Live Call");
  const handleSetMood = () => alert("Set Mood");

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-zinc-100 font-sans selection:bg-primary/20">
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onNewChat={handleNewChat}
        onSettingsClick={handleSettingsClick}
        onToggleCall={handleToggleCall}
        onSetMood={handleSetMood}
      />

      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />

        <header className="px-6 py-5 flex items-center justify-between border-b border-zinc-800/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden">
              <Menu className="h-6 w-6 text-zinc-400" />
            </button>
            <h1 className="text-xl font-semibold tracking-tight text-white/90">Cymatic Tutor</h1>
          </div>
          <div className="text-sm text-zinc-500 font-medium">Welcome, {displayName}</div>
        </header>

        <div className="flex-1 overflow-hidden z-0">
          {messages.length === 0 ? (
            <MainContainer displayName={displayName} />
          ) : (
            <ChatArea messages={messages} isLoading={isLoading} />
          )}
        </div>

        <div className="p-6 bg-gradient-to-t from-[#0A0A0A] to-transparent">
          <InputField
            input={input}
            setInput={setInput}
            onSubmit={handleSendMessage}
            isLoading={isLoading}
            onFileClick={handleFileClick}
            onMicClick={handleMicClick}
          />
        </div>
      </div>
    </div>
  );
}
