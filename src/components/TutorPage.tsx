import { useState, useEffect, useRef } from "react";
import { ChatSidebar } from "./ChatSidebar";
import { MainContainer } from "./MainContainer";
import { ChatArea } from "./ChatArea";
import { InputField } from "./InputField";
import { TutorErrorBoundary } from "./TutorErrorBoundary";
import { Menu, Settings, Download, Volume2, VolumeX, Video, VideoOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTutorStore } from "@/store/useTutorStore";
import { useTutor } from "@/lib/TutorService";
import { useSearch } from "@tanstack/react-router";
import { generateOfflineTutorResponse } from "@/lib/offline-tutor";
import { Button } from "./ui/button";
import { exportChatToPDF } from "@/lib/chat-pdf-export";

export function TutorPage() {
  return (
    <TutorErrorBoundary>
      <TutorPageContent />
    </TutorErrorBoundary>
  );
}

function TutorPageContent() {
  const {
    messages,
    isLoading,
    addMessage,
    setLoading,
    clearMessages,
    setMessages,
    sessionId,
    persona,
    setPersona,
  } = useTutorStore();
  const { speak, stopSpeaking, speaking, setVoice, ttsEnabled, setTtsEnabled } = useTutor();

  const [input, setInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [displayName, setDisplayName] = useState("Learner");
  const [offlineMode, setOfflineMode] = useState(!navigator.onLine);

  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Sync persona configuration with useTutor hook voice on load or change
  useEffect(() => {
    setVoice(persona === "Adams" ? "male" : "female");
  }, [persona, setVoice]);

  // Attendance logging
  useEffect(() => {
    const startTime = Date.now();
    return () => {
      const duration = Math.round((Date.now() - startTime) / 60000);
      if (duration > 0) {
        const data = JSON.stringify({ userId: "current-user", sessionId, duration });
        if (navigator.sendBeacon) {
          navigator.sendBeacon("/api/attendance", data);
        } else {
          fetch("/api/attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: data,
          }).catch(console.error);
        }
      }
    };
  }, [sessionId]);

  // Live Study Cam management
  useEffect(() => {
    async function startCamera() {
      if (cameraActive) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          setCameraStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Camera access failed:", err);
          setCameraActive(false);
        }
      } else {
        if (cameraStream) {
          cameraStream.getTracks().forEach((track) => track.stop());
          setCameraStream(null);
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      }
    }
    startCamera();
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraActive]);

  let prefill = "";
  try {
    const search = useSearch({ from: "/tutor" });
    prefill = search.prefill || "";
  } catch (e) {
    // Fail-safe if rendered outside the route context
  }

  // Dynamic welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const greeting: any = {
        id: crypto.randomUUID(),
        sender: "tutor" as const,
        text: `Hello ${displayName}! Ready to dive into your studies today? What would you like to explore?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages([greeting]);
    }
  }, [messages.length, setMessages, displayName]);

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

  const handlePersonaChange = (newPersona: "Adams" | "Haawa") => {
    setPersona(newPersona);
    setVoice(newPersona === "Adams" ? "male" : "female");
    stopSpeaking();
  };

  const handleSendMessage = async () => {
    if ((!input.trim() && !attachedFile) || isLoading) return;

    // Stop speaking whenever a new message is sent
    stopSpeaking();

    // Prepare message texts
    const studentPromptText = input.trim();
    const userMsgText = attachedFile
      ? `[File Attached: ${attachedFile.name}]\n\n${studentPromptText}`.trim()
      : studentPromptText;

    const userMsg = {
      id: crypto.randomUUID(),
      sender: "student" as const,
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    addMessage(userMsg);
    setInput("");
    const lastAttachedFile = attachedFile;
    setAttachedFile(null); // Clear active attachment state
    setLoading(true);

    const tutorMsgId = crypto.randomUUID();
    addMessage({
      id: tutorMsgId,
      sender: "tutor" as const,
      text: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });

    if (offlineMode) {
      setTimeout(() => {
        const reply = generateOfflineTutorResponse(
          studentPromptText,
          displayName,
          persona === "Adams" ? "male" : "female",
        );
        useTutorStore
          .getState()
          .setMessages(
            useTutorStore
              .getState()
              .messages.map((msg) => (msg.id === tutorMsgId ? { ...msg, text: reply } : msg)),
          );
        setLoading(false);
        // Read response aloud
        speak(reply);
      }, 800);
      return;
    }

    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;

      // Append study file context inside prompt
      let finalPrompt = studentPromptText;
      if (lastAttachedFile) {
        finalPrompt = `Study File Context: [${lastAttachedFile.name}]\n---\n${lastAttachedFile.content}\n---\n\nLearner Query:\n${studentPromptText}`;
      }

      // Fetch the latest updated messages directly from the store to prevent closure stale states
      const storeMessages = useTutorStore.getState().messages;
      const historyToSend = storeMessages
        .filter((m) => m.id !== tutorMsgId && m.id !== userMsg.id)
        .slice(-8)
        .map((m) => ({
          role:
            m.sender === "student" || m.sender === "user"
              ? ("user" as const)
              : ("assistant" as const),
          content: m.text,
        }));

      // Append user prompt
      historyToSend.push({
        role: "user" as const,
        content: finalPrompt,
      });

      let res;
      try {
        const url = "/api/tutor";
        res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            messages: historyToSend,
            userName: displayName,
            subject: "general",
          }),
        });
        if (!res.ok) {
          throw new Error("Local API failed status: " + res.status);
        }
      } catch (err) {
        console.warn("[Tutor Chat] Local API failed, trying Supabase Edge Function directly:", err);
        const edgeUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tutor-chat`;
        res = await fetch(edgeUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
          },
          body: JSON.stringify({
            messages: historyToSend,
            persona: persona === "Adams" ? "male" : "female",
            userName: displayName,
            subject: "general",
          }),
        });
      }

      if (!res.ok) {
        const errText = await res.text().catch(() => "Unknown error");
        throw new Error(`Tutor APIs failed (${res.status}): ${errText}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let tutorReplyText = "";

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
              if (typeof delta === "string") chunkText += delta;
            } catch (e) {
              // Ignore payload parse errors
            }
          }

          if (chunkText) {
            tutorReplyText += chunkText;
            useTutorStore
              .getState()
              .setMessages(
                useTutorStore
                  .getState()
                  .messages.map((msg) =>
                    msg.id === tutorMsgId ? { ...msg, text: tutorReplyText } : msg,
                  ),
              );
          }
        }
      }

      // Trigger automatic voice read-aloud when streamed response settles
      if (tutorReplyText) {
        speak(tutorReplyText);
      }
    } catch (e) {
      console.error("[Tutor Chat] Dynamic API communication error:", e);
      const reply = generateOfflineTutorResponse(
        studentPromptText,
        displayName,
        persona === "Adams" ? "male" : "female",
      );

      useTutorStore
        .getState()
        .setMessages(
          useTutorStore
            .getState()
            .messages.map((msg) => (msg.id === tutorMsgId ? { ...msg, text: reply } : msg)),
        );
      speak(reply);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-zinc-100 font-sans selection:bg-primary/20">
      <ChatSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 relative max-w-7xl mx-auto w-full">
        <header className="px-6 py-5 flex items-center justify-between border-b border-zinc-800/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="h-6 w-6 text-zinc-400" />
            </Button>
            <h1 className="text-xl font-semibold tracking-tight text-white/90">Cymatic Study</h1>
          </div>

          {/* Persona Switcher */}
          <div className="flex items-center gap-2 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
            <Button
              size="sm"
              variant={persona === "Adams" ? "default" : "ghost"}
              onClick={() => handlePersonaChange("Adams")}
            >
              Adams
            </Button>
            <Button
              size="sm"
              variant={persona === "Haawa" ? "default" : "ghost"}
              onClick={() => handlePersonaChange("Haawa")}
            >
              Haawa
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTtsEnabled(!ttsEnabled)}
              title={ttsEnabled ? "Mute automatic read-aloud" : "Unmute automatic read-aloud"}
              className="hover:bg-zinc-900 rounded-lg cursor-pointer transition-colors"
            >
              {ttsEnabled ? (
                <Volume2 className="h-5 w-5 text-purple-400" />
              ) : (
                <VolumeX className="h-5 w-5 text-zinc-500" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => exportChatToPDF(messages)}
              className="hover:bg-zinc-900 rounded-lg cursor-pointer transition-colors"
            >
              <Download className="h-5 w-5 text-zinc-400" />
            </Button>
            <div className="text-sm text-zinc-500 font-medium hidden sm:block">
              Welcome, {displayName}
            </div>
          </div>
        </header>

        {/* Main layout */}
        <div className="flex-1 flex gap-4 p-4 overflow-hidden z-0">
          <div className="flex-1 overflow-hidden z-0 flex flex-col">
            {messages.length === 0 ? (
              <MainContainer displayName={displayName} />
            ) : (
              <ChatArea messages={messages} isLoading={isLoading} />
            )}
          </div>

          {/* Video / Tools side panel */}
          <div className="w-80 border-l border-zinc-800/80 p-4 flex flex-col gap-4 hidden lg:flex">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-zinc-300">Live Study Cam</h3>
              <p className="text-xs text-zinc-500">
                Enable local face camera for interactive sessions and focus tracking.
              </p>
            </div>

            <div className="relative aspect-video bg-zinc-950 rounded-lg overflow-hidden flex flex-col items-center justify-center border border-zinc-800">
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
                autoPlay
                muted
                playsInline
              />
              {!cameraActive && (
                <div className="z-10 text-center p-3 space-y-2">
                  <VideoOff className="h-8 w-8 text-zinc-600 mx-auto" />
                  <span className="text-xs text-zinc-500 block">Study Cam is Offline</span>
                </div>
              )}

              <button
                onClick={() => setCameraActive(!cameraActive)}
                className={`absolute bottom-3 right-3 p-2 rounded-full shadow-md transition-all cursor-pointer ${
                  cameraActive
                    ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                    : "bg-zinc-850 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/50"
                }`}
                title={cameraActive ? "Turn off camera" : "Turn on camera"}
              >
                {cameraActive ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </button>
            </div>

            <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800/80 space-y-3">
              <div className="flex items-center gap-2">
                <div
                  className={`h-2.5 w-2.5 rounded-full ${speaking ? "bg-purple-500 animate-pulse" : "bg-zinc-600"}`}
                />
                <span className="text-xs font-semibold text-zinc-300">
                  {speaking ? `${persona} is Speaking` : `${persona} is Idle`}
                </span>
              </div>
              <div className="text-xs text-zinc-400 space-y-1">
                <p>
                  Voice pitch:{" "}
                  <span className="text-zinc-300 font-mono">
                    {persona === "Adams" ? "0.90 (Adams)" : "1.20 (Haawa)"}
                  </span>
                </p>
                <p>
                  Voice accent:{" "}
                  <span className="text-zinc-300 font-mono">
                    {persona === "Adams" ? "GB Accent" : "US Accent"}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex-1 p-4 bg-zinc-900/10 rounded-lg border border-zinc-850 text-xs text-zinc-500 flex flex-col justify-end">
              <div>
                <span className="font-semibold text-zinc-400 block mb-1">Study Guide Tip:</span>
                Upload text study notes, essay draft files or code scripts using the paperclip
                button in the chat box to have {persona} read and help you summarize, explain, or
                debug them!
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gradient-to-t from-[#0A0A0A] to-transparent">
          <InputField
            input={input}
            setInput={setInput}
            onSubmit={handleSendMessage}
            isLoading={isLoading}
            onFileSelect={(file) => setAttachedFile(file)}
            attachedFileName={attachedFile?.name}
            onRemoveAttachment={() => setAttachedFile(null)}
          />
        </div>
      </div>
    </div>
  );
}
