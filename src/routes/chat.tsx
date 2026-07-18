import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef, useMemo } from "react";
import {
  Send,
  Users,
  Share2,
  MessageSquare,
  Clock,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  Paperclip,
  Camera,
  FileText,
  Download,
  Building2,
  User,
  Globe,
  Plus,
  Mic,
  Video,
  Layout,
  Settings,
  X,
  Sparkles,
  Search,
} from "lucide-react";
import { VisionLiveSession } from "@/components/VisionLiveSession";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useTutorSession, TutorSessionProvider } from "@/hooks/useTutorSession";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Share } from "@capacitor/share";
import { Capacitor } from "@capacitor/core";
import { Camera as CapCamera, CameraResultType } from "@capacitor/camera";

const AI_TUTOR_MARKER = "__AI_TUTOR__";

export interface ChatMessage {
  id: string;
  sender: "user" | "tutor";
  text: string;
  created_at: string;
}

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Tutor Chat | Latty's Cymatic Study" },
      {
        name: "description",
        content: "Live chat with your AI tutor. Designed by Isabirye Latif.",
      },
    ],
  }),
  component: ChatPageWrapper,
});

function ChatPageWrapper() {
  return (
    <TutorSessionProvider>
      <ChatRoomPage />
    </TutorSessionProvider>
  );
}

function ChatRoomPage() {
  const { user, loading: authLoading, profile, isInstitutional } = useAuth();
  const { liveTools, state, connectSession, disconnectSession } = useTutorSession();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [showSetup, setShowSetup] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tutorOn, setTutorOn] = useState(false);
  const [tutorThinking, setTutorThinking] = useState(false);
  const [showVisionSession, setShowVisionSession] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine chat context - institutional uses org_id + level, independent uses global
  const chatContext = useMemo(() => {
    if (isInstitutional && profile?.org_id && profile?.level) {
      return {
        type: "institutional" as const,
        orgId: profile.org_id,
        level: profile.level,
        label: `${profile.level} - ${profile.school_name || "School Network"}`,
      };
    }
    return {
      type: "independent" as const,
      orgId: "independent",
      level: profile?.level || "general",
      label: "Independent Learning Space",
    };
  }, [isInstitutional, profile]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/login" });
      return;
    }

    if (user && profile) {
      loadMessages();
      const cleanup = subscribeToMessages();
      return cleanup;
    }
  }, [user, authLoading, profile, chatContext]);

  const loadMessages = async () => {
    setLoadingMessages(true);

    let query = supabase
      .from("chat_messages")
      .select("*, profiles(display_name, avatar_url)")
      .order("created_at", { ascending: true })
      .limit(50);

    // Filter by context
    if (chatContext.type === "institutional") {
      query = query.eq("org_id", chatContext.orgId).eq("level", chatContext.level);
    } else {
      // For independent users, show messages from independent channel or global
      query = query.or(`org_id.eq.independent,org_id.is.null`);
    }

    const { data, error } = await query;

    if (!error) {
      setMessages(data || []);
    }
    setLoadingMessages(false);
    setTimeout(scrollToBottom, 100);
  };

  const subscribeToMessages = () => {
    const channelName =
      chatContext.type === "institutional"
        ? `chat_${chatContext.orgId}_${chatContext.level}`
        : `chat_independent_${chatContext.level}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        async (payload) => {
          const newMsg = payload.new as any;

          // Check if message belongs to our context
          const belongsToContext =
            chatContext.type === "institutional"
              ? newMsg.org_id === chatContext.orgId && newMsg.level === chatContext.level
              : newMsg.org_id === "independent" || !newMsg.org_id;

          if (belongsToContext) {
            const { data: p } = await supabase
              .from("profiles")
              .select("display_name, avatar_url")
              .eq("user_id", newMsg.user_id)
              .single();

            const fullMsg = { ...newMsg, profiles: p };
            setMessages((prev) => [...prev, fullMsg]);
            setTimeout(scrollToBottom, 100);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, attachment?: any) => {
    if (e) e.preventDefault();
    const text = newMessage.trim();
    if (!text && !attachment) return;

    setSending(true);
    if (!user?.id) {
      setSending(false);
      return;
    }
    const { error } = await supabase.from("chat_messages").insert({
      user_id: user.id,
      org_id: chatContext.orgId,
      level: chatContext.level,
      content: text,
      file_url: attachment?.url,
      file_type: attachment?.type,
      file_name: attachment?.name,
    });

    if (error) {
      toast.error("Failed to send message");
      setSending(false);
      return;
    }
    setNewMessage("");
    setSending(false);

    // If AI Tutor toggle is ON, fetch a tutor reply and post it to the room
    if (tutorOn && text) {
      void invokeTutor(text);
    }
  };

  const invokeTutor = async (prompt: string) => {
    if (!user?.id) return;
    setTutorThinking(true);
    try {
      const recent = messages
        .slice(-6)
        .map((m: any) => ({
          role: m.user_id === user.id ? "user" : "assistant",
          content: String(m.content || "")
            .replace(AI_TUTOR_MARKER, "")
            .trim(),
        }))
        .filter((m) => m.content);
      recent.push({ role: "user", content: prompt });

      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Not signed in");

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tutor-chat`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
        },
        body: JSON.stringify({
          messages: recent,
          persona: "female",
          mood: "focused",
          userMood: "neutral",
          userName: profile?.display_name || "learner",
          context: { route: "/chat", profile },
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`Tutor ${res.status}: ${errText.slice(0, 200) || res.statusText}`);
      }

      // Stream SSE
      let fullJsonString = "";
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
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              const j = JSON.parse(payload);
              const delta = j.choices?.[0]?.delta?.content;
              if (typeof delta === "string") fullJsonString += delta;
            } catch {
              /* ignore */
            }
          }
        }
      }

      let replyText = "";
      let parsed: any = null;
      try {
        parsed = JSON.parse(fullJsonString);
        replyText = parsed.spoken_text || fullJsonString;
      } catch (e) {
        // Fall back gracefully if the API returns raw plain text instead of JSON
        replyText = fullJsonString || "I'm here, but couldn't form a response right now.";
      }

      // Trigger UI Actions
      if (parsed && parsed.ui_actions) {
        for (const action of parsed.ui_actions) {
          console.log("Triggering Tutor Action:", action);
          if (action.type === "trigger_haptic") {
            // Placeholder: Implement Capacitor haptics integration here
            console.log("Haptic triggered:", action.payload.hapticType);
          } else if (action.type === "open_widget") {
            console.log("Opening widget:", action.payload.widgetType);
          }
          // ... handle other actions
        }
      }

      const { error: insertErr } = await supabase.from("chat_messages").insert({
        user_id: user.id,
        org_id: chatContext.orgId,
        level: chatContext.level,
        content: `${AI_TUTOR_MARKER}${replyText}`,
      });
      if (insertErr) throw insertErr;
    } catch (e: any) {
      console.error("Tutor error:", e);
      toast.error("Tutor unavailable: " + (e?.message || "try again"));
    } finally {
      setTutorThinking(false);
    }
  };

  const uploadFile = async (file: File | Blob, name: string, type: string) => {
    setUploading(true);

    const fileExt = name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${chatContext.orgId}/${chatContext.level}/${user?.id}/${fileName}`;

    const { error } = await supabase.storage.from("chat_attachments").upload(filePath, file);

    if (error) {
      toast.error("Upload failed: " + error.message);
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("chat_attachments").getPublicUrl(filePath);

    await handleSendMessage(undefined, { url: publicUrl, type, name });
    setUploading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const type = file.type.startsWith("image/")
      ? "image"
      : file.type === "application/pdf"
        ? "pdf"
        : "doc";
    uploadFile(file, file.name, type);
  };

  const handleCameraCapture = async () => {
    try {
      const image = await CapCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
      });

      if (image.base64String) {
        const byteCharacters = atob(image.base64String);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: `image/${image.format}` });

        uploadFile(blob, `camera_capture.${image.format}`, "image");
      }
    } catch (e) {
      console.warn("Camera cancelled or failed", e);
    }
  };

  const handleInvite = async () => {
    const inviteMsg = isInstitutional
      ? `Hey! Join our official [${chatContext.level}] study network on Cymatic Study Evolution. Tap here to connect: https://lattyscymatic.com/join`
      : `Join the Independent Learning Space on Cymatic Study! https://lattyscymatic.com/join`;

    if (Capacitor.isNativePlatform()) {
      try {
        await Share.share({
          title: `Join ${chatContext.label}`,
          text: inviteMsg,
          url: "https://lattyscymatic.com",
          dialogTitle: "Invite fellow learners",
        });
      } catch (e) {
        console.error("Native share failed", e);
      }
    } else {
      const waUrl = `https://wa.me/?text=${encodeURIComponent(inviteMsg)}`;
      window.open(waUrl, "_blank");
    }
  };

  if (authLoading || loadingMessages) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative flex h-[calc(100vh-4rem)] flex-col bg-zinc-950 selection:bg-primary/30 overflow-hidden">
      {/* Setup Modal Layer */}
      {showSetup && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 p-6 animate-in fade-in duration-500">
          <div className="absolute top-6 right-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSetup(false)}
              className="text-zinc-500 hover:text-white"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          <div className="text-center space-y-6 max-w-md w-full">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 shadow-2xl shadow-primary/20 border border-primary/20 animate-pulse">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-black text-white tracking-tight">
                What should we focus on?
              </h1>
              <p className="text-zinc-500 text-sm font-medium">
                Select your learning context or dive straight into the peer network.
              </p>
            </div>

            <div className="grid gap-3 pt-4">
              <Button
                onClick={() => setShowSetup(false)}
                className="h-14 rounded-2xl bg-primary text-lg font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
              >
                Start Peer Discussion
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSidebarOpen(true);
                  setShowSetup(false);
                }}
                className="h-14 rounded-2xl border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
              >
                Manage Context
              </Button>
            </div>
          </div>

          {/* Bottom Utility Dock in Setup */}
          <div className="absolute bottom-10 flex items-center gap-4 px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-2xl">
            <button className="h-10 w-10 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
              <Mic className="h-5 w-5" />
            </button>
            <div className="w-[1px] h-6 bg-white/10" />
            <button className="h-10 w-10 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
              <Video className="h-5 w-5" />
            </button>
            <div className="w-[1px] h-6 bg-white/10" />
            <button className="h-10 w-10 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
              <Layout className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Sidebar Drawer Context Manager */}
      <div
        className={`fixed inset-y-0 left-0 z-[110] w-72 bg-zinc-900 border-r border-white/10 shadow-2xl transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-white uppercase tracking-tighter">
              Chat Context
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="h-8 w-8 text-zinc-500"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 space-y-6">
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">
                Active Space
              </p>
              <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 space-y-1">
                <p className="font-bold text-primary text-sm">{chatContext.label}</p>
                <p className="text-[10px] text-primary/70 uppercase font-black">
                  {chatContext.type}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">
                Channels
              </p>
              <div className="space-y-1">
                {["General Discussion", "Physics Lab", "Math Solutions", "Biology Study"].map(
                  (channel) => (
                    <button
                      key={channel}
                      className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-3"
                    >
                      <MessageSquare className="h-4 w-4" />
                      {channel}
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-zinc-500 hover:text-white"
            >
              <Settings className="h-5 w-5" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay when sidebar open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[105] bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Chat Header */}
      <header className="flex items-center justify-between border-b border-white/5 bg-black/40 p-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="h-9 w-9 text-zinc-400"
          >
            <Layout className="h-5 w-5" />
          </Button>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black uppercase tracking-tight text-white">
                {isInstitutional ? `${chatContext.level} Peer Network` : "Learning Space"}
              </h2>
              {/* Context Badge */}
              <Badge
                variant="outline"
                className={`text-[9px] ${
                  isInstitutional
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-500"
                }`}
              >
                {isInstitutional ? (
                  <Building2 className="mr-1 h-3 w-3" />
                ) : (
                  <Globe className="mr-1 h-3 w-3" />
                )}
                {isInstitutional ? "School" : "Independent"}
              </Badge>
            </div>
            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-blue-500" />
              {chatContext.label}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 cursor-pointer">
            <Sparkles className={`h-3.5 w-3.5 ${tutorOn ? "text-primary" : "text-zinc-500"}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">
              Tutor
            </span>
            <Switch checked={tutorOn} onCheckedChange={setTutorOn} aria-label="Toggle AI Tutor" />
          </label>
          <Button
            variant="outline"
            size="sm"
            onClick={handleInvite}
            className="border-primary/20 bg-primary/5 text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/10"
          >
            <Share2 className="mr-2 h-3.5 w-3.5" />
            Invite
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: "/dashboard" })}
            className="h-9 w-9 text-zinc-400"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Message Stream */}
      <ScrollArea className="flex-1 p-4">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex justify-center">
            <Badge
              variant="outline"
              className="border-white/5 bg-white/5 text-[9px] uppercase tracking-widest text-zinc-500 px-3"
            >
              {isInstitutional ? "Encrypted Institutional Terminal" : "Independent Learning Space"}{" "}
              Active
            </Badge>
          </div>

          {messages.length === 0 && (
            <div className="py-12 text-center">
              <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-zinc-900 border border-white/5 mb-4">
                <MessageSquare className="h-10 w-10 text-zinc-700" />
              </div>
              <h3 className="font-bold text-zinc-400">Secure Network Initiated</h3>
              <p className="text-xs text-zinc-600 uppercase tracking-widest mt-1">
                Waiting for data packets...
              </p>
            </div>
          )}

          {messages.map((msg) => {
            const rawContent: string = msg.content || "";
            const isAI = rawContent.startsWith(AI_TUTOR_MARKER);
            const displayContent = isAI
              ? rawContent.slice(AI_TUTOR_MARKER.length).trim()
              : rawContent;
            const isOwn = !isAI && msg.user_id === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
              >
                <Avatar className="h-8 w-8 border border-white/10 shadow-sm">
                  {isAI ? (
                    <AvatarFallback className="bg-gradient-to-br from-primary/40 to-purple-500/40 text-white">
                      <Sparkles className="h-4 w-4" />
                    </AvatarFallback>
                  ) : (
                    <>
                      <AvatarImage src={msg.profiles?.avatar_url} />
                      <AvatarFallback className="bg-zinc-800 text-[10px] font-bold text-zinc-400 uppercase">
                        {(msg.profiles?.display_name || "??").substring(0, 2)}
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>
                <div className={`flex max-w-[80%] flex-col ${isOwn ? "items-end" : ""}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider ${isAI ? "text-primary" : "text-zinc-500"}`}
                    >
                      {isAI ? "AI Tutor" : msg.profiles?.display_name || "Scholar"}
                    </span>
                    <span className="text-[9px] text-zinc-600 font-medium">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div
                    className={`rounded-2xl px-4 py-2 text-sm shadow-sm space-y-3 ${
                      isAI
                        ? "bg-gradient-to-br from-primary/15 to-purple-500/10 border border-primary/20 text-zinc-100 rounded-tl-none"
                        : isOwn
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-white/5 border border-white/5 text-zinc-200 rounded-tl-none"
                    }`}
                  >
                    {msg.file_url && (
                      <div className="mt-1">
                        {msg.file_type === "image" ? (
                          <div className="relative group rounded-xl overflow-hidden border border-white/10">
                            <img
                              src={msg.file_url}
                              alt="Shared study asset"
                              className="max-w-full h-auto max-h-[300px] object-contain"
                            />
                            <a
                              href={msg.file_url}
                              target="_blank"
                              rel="noopener"
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                            >
                              <Download className="h-6 w-6 text-white" />
                            </a>
                          </div>
                        ) : (
                          <a
                            href={msg.file_url}
                            target="_blank"
                            rel="noopener"
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                              isOwn
                                ? "bg-white/10 border-white/20 hover:bg-white/20"
                                : "bg-zinc-900 border-white/10 hover:bg-zinc-800"
                            }`}
                          >
                            <div
                              className={`h-10 w-10 rounded-lg flex items-center justify-center ${msg.file_type === "pdf" ? "bg-rose-500/20 text-rose-500" : "bg-blue-500/20 text-blue-500"}`}
                            >
                              <FileText className="h-6 w-6" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="text-xs font-bold truncate">
                                {msg.file_name || "Study Document"}
                              </p>
                              <p className="text-[10px] uppercase opacity-60 font-black">
                                {msg.file_type}
                              </p>
                            </div>
                            <Download className="h-4 w-4 opacity-40" />
                          </a>
                        )}
                      </div>
                    )}
                    {displayContent && (
                      <p className="whitespace-pre-wrap leading-relaxed">{displayContent}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {tutorThinking && (
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8 border border-white/10 shadow-sm">
                <AvatarFallback className="bg-gradient-to-br from-primary/40 to-purple-500/40 text-white">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                </AvatarFallback>
              </Avatar>
              <div className="rounded-2xl rounded-tl-none px-4 py-3 bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20">
                <span className="text-xs text-primary/80 font-medium animate-pulse">
                  Tutor is thinking…
                </span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Bottom Media Utility Dock */}
      <div className="mx-auto flex items-center gap-2 px-4 py-2 mb-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-500">
        <Button
          variant="ghost"
          size="icon"
          onClick={state.connected ? disconnectSession : connectSession}
          className={`h-9 w-9 text-zinc-400 hover:text-primary ${state.connected ? "bg-white/10 text-primary" : ""}`}
        >
          <Mic className="h-4 w-4" />
        </Button>
        {/* Media Dock - Render the VisionLiveSession in dock mode and overlay mode */}
        <VisionLiveSession
          open={showVisionSession}
          onClose={() => setShowVisionSession(false)}
          mode="dock"
        />
        <VisionLiveSession
          open={showVisionSession}
          onClose={() => setShowVisionSession(false)}
          mode="overlay"
        />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowVisionSession(!showVisionSession)}
          className={`h-9 w-9 text-zinc-400 hover:text-primary ${showVisionSession ? "bg-white/10 text-primary" : ""}`}
        >
          <Video className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          className="h-9 w-9 text-zinc-400 hover:text-primary"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <div className="w-[1px] h-4 bg-white/10 mx-1" />
        <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-primary">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Message Input */}
      <footer className="border-t border-white/5 bg-black/40 p-4 backdrop-blur-xl">
        <form
          onSubmit={(e) => handleSendMessage(e)}
          className="mx-auto flex max-w-3xl items-center gap-2"
        >
          <div className="flex items-center gap-1 mr-1">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,application/pdf,.doc,.docx"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleCameraCapture}
              disabled={uploading}
              className="h-10 w-10 text-zinc-400 hover:text-white hover:bg-white/5"
            >
              <Camera className="h-5 w-5" />
            </Button>
          </div>

          <div className="relative flex-1">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={
                isInstitutional ? "Message your classmates..." : "Share with the community..."
              }
              className="h-12 border-white/10 bg-white/5 pl-4 pr-12 text-sm text-white placeholder:text-zinc-600 focus:ring-primary/50"
            />
            <div className="absolute right-3 top-3.5">
              <Clock className="h-5 w-5 text-zinc-700" />
            </div>
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={sending || (!newMessage.trim() && !uploading)}
            className="h-12 w-12 rounded-xl bg-primary shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
          >
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </form>
      </footer>
    </div>
  );
}
