import {
  Plus,
  Trash2,
  Download,
  MessageSquare,
  Search,
  Settings,
  BarChart3,
  Clock,
  X,
  Globe,
  Volume2,
  VolumeX,
  Play,
  Sliders,
  RefreshCw,
  UserCheck,
  Camera,
  Mic,
  Bell,
  HardDrive,
} from "lucide-react";
import { useTutorStore } from "@/store/useTutorStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { exportChatToPDF } from "@/lib/chat-pdf-export";
import { DeploymentStatus } from "@/components/DeploymentStatus";
import { useTutorVoice } from "@/hooks/useTutorVoice";
import { useLanguageStore, type LanguageCode } from "@/store/useLanguageStore";
import { useTutor } from "@/lib/TutorService";
import { HardwareBridge } from "@/lib/HardwareBridge";
import { toast } from "sonner";

type SidebarMenu = "history" | "search" | "analytics" | "settings";

export function ChatSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { sessions, sessionId, loadSession, createNewSession, deleteSession } = useTutorStore();
  const [activeMenu, setActiveMenu] = useState<SidebarMenu | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  const filteredSessions = useMemo(() => {
    let result = sessions;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.title?.toLowerCase().includes(q) ||
          s.summary?.toLowerCase().includes(q) ||
          s.messages.some((m) => m.text.toLowerCase().includes(q)),
      );
    }
    if (dateRange.from) {
      result = result.filter((s) => format(s.timestamp, "yyyy-MM-dd") >= dateRange.from);
    }
    if (dateRange.to) {
      result = result.filter((s) => format(s.timestamp, "yyyy-MM-dd") <= dateRange.to);
    }
    return result;
  }, [sessions, searchQuery, dateRange]);

  const librarySessions = useMemo(() => {
    return sessions.filter((s) => s.summary);
  }, [sessions]);

  const groupedSessions = useMemo(() => {
    const groups: Record<string, typeof sessions> = {};
    sessions.forEach((s) => {
      const date = format(s.timestamp, "yyyy-MM-dd");
      if (!groups[date]) groups[date] = [];
      groups[date].push(s);
    });
    return groups;
  }, [sessions]);

  const menuItems = [
    { id: "history", label: "Chat History", icon: Clock, desc: "Past study discussions" },
    {
      id: "search",
      label: "Search Transcripts",
      icon: Search,
      desc: "Keyword & date range filtering",
    },
    { id: "analytics", label: "Study Analytics", icon: BarChart3, desc: "Engagement & summaries" },
    { id: "settings", label: "Tutor Settings", icon: Settings, desc: "Robust AI & Voice config" },
  ];

  const handlePrintSummary = (session: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>${session.title || "Study Summary"}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Jakarta+Sans:wght@400;700&display=swap');
            body { font-family: 'Jakarta Sans', sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.6; }
            .header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; text-align: center; }
            .logo { font-weight: 800; font-size: 24px; letter-spacing: -1px; margin-bottom: 5px; }
            .meta { font-size: 12px; color: #666; margin-bottom: 20px; }
            .title { font-size: 32px; font-weight: 800; margin-bottom: 10px; color: #0891b2; }
            .summary-box { background: #f8fafc; border-left: 4px solid #0891b2; padding: 20px; border-radius: 8px; margin: 20px 0; font-style: italic; }
            .section-title { font-size: 18px; font-weight: 700; margin-top: 30px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; color: #475569; }
            .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-align: center; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">CYMATIC STUDY HUB</div>
            <div class="meta">Academic Transcript & Revision Summary</div>
          </div>
          <div class="title">${session.title || "Study Session Summary"}</div>
          <div class="meta">Date: ${format(session.timestamp, "MMMM do, yyyy")} | Session ID: ${session.id}</div>
          
          <div class="section-title">Core Learning Objective</div>
          <div class="summary-box">
            "${session.summary || "Summary pending analysis."}"
          </div>

          <div class="section-title">Key Insights & Discussion</div>
          <div style="font-size: 14px;">
            ${session.messages
              .slice(0, 20)
              .map(
                (m: any) => `
              <div style="margin-bottom: 10px; padding: 8px; border-bottom: 1px solid #f1f5f9;">
                <strong style="color: ${m.sender === "student" ? "#0891b2" : "#475569"}">${m.sender === "student" ? "LEARNER" : "AI TUTOR"}:</strong>
                <div style="margin-top: 4px;">${m.text}</div>
              </div>
            `,
              )
              .join("")}
          </div>

          <div class="footer">
            Generated via Cymatic AI Mentor · Verified Academic Record · ${format(new Date(), "yyyy-MM-dd HH:mm")}
          </div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-80 lg:w-96 bg-zinc-950 border-r border-zinc-800 transition-transform duration-300 ease-in-out shadow-2xl flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      {/* Header */}
      <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {activeMenu && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg -ml-2"
              onClick={() => setActiveMenu(null)}
            >
              <Plus className="w-4 h-4 rotate-45" />
            </Button>
          )}
          <h2 className="text-zinc-100 font-bold tracking-tight">
            {activeMenu ? menuItems.find((m) => m.id === activeMenu)?.label : "Tutor Workspace"}
          </h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden h-8 w-8">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {!activeMenu ? (
          /* Main Menu List */
          <div className="p-4 space-y-2">
            <Button
              className="w-full justify-start h-16 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 mb-6"
              onClick={() => {
                createNewSession();
                onClose();
              }}
            >
              <div className="h-10 w-10 rounded-xl bg-cyan-500/20 flex items-center justify-center mr-4">
                <Plus className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold">New Session</div>
                <div className="text-[10px] opacity-70">Start fresh discussion</div>
              </div>
            </Button>

            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                className="w-full justify-start h-20 rounded-3xl hover:bg-zinc-900 group border border-transparent hover:border-zinc-800/50"
                onClick={() => setActiveMenu(item.id as SidebarMenu)}
              >
                <div className="h-12 w-12 rounded-2xl bg-zinc-900 flex items-center justify-center mr-4 group-hover:bg-zinc-800 transition-colors">
                  <item.icon className="w-5 h-5 text-zinc-400 group-hover:text-cyan-400" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-zinc-100">{item.label}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">{item.desc}</div>
                </div>
              </Button>
            ))}
          </div>
        ) : (
          /* Sub Menu View */
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeMenu === "history" && (
              <div className="flex flex-col h-full">
                <ScrollArea className="flex-1 px-4 py-2">
                  {Object.entries(groupedSessions)
                    .sort(([a], [b]) => b.localeCompare(a))
                    .map(([date, dateSessions]) => (
                      <div key={date} className="mb-6">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-3 ml-2">
                          {format(new Date(date), "MMMM do, yyyy")}
                        </h3>
                        <div className="space-y-1">
                          {dateSessions.map((session) => (
                            <SessionItem
                              key={session.id}
                              session={session}
                              isActive={sessionId === session.id}
                              onSelect={() => {
                                loadSession(session.id!);
                                onClose();
                              }}
                              onDelete={() => deleteSession(session.id!)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  {sessions.length === 0 && (
                    <div className="p-12 text-center text-zinc-600">
                      No session history found locally.
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}

            {activeMenu === "search" && (
              <div className="flex flex-col h-full">
                <div className="p-4 space-y-4 border-b border-zinc-800/50">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                      placeholder="Keyword search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 pl-9 text-xs h-10 rounded-xl"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-zinc-600 ml-1">
                        From
                      </label>
                      <Input
                        type="date"
                        value={dateRange.from}
                        onChange={(e) =>
                          setDateRange((prev) => ({ ...prev, from: e.target.value }))
                        }
                        className="bg-zinc-900 border-zinc-800 text-xs h-9 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-zinc-600 ml-1">
                        To
                      </label>
                      <Input
                        type="date"
                        value={dateRange.to}
                        onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
                        className="bg-zinc-900 border-zinc-800 text-xs h-9 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
                <ScrollArea className="flex-1 px-4 py-4">
                  {filteredSessions.length === 0 ? (
                    <div className="p-12 text-center text-xs text-zinc-600 italic">
                      No matches found for these search parameters.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredSessions.map((session) => (
                        <SessionItem
                          key={session.id}
                          session={session}
                          isActive={sessionId === session.id}
                          onSelect={() => {
                            loadSession(session.id!);
                            onClose();
                          }}
                          onDelete={() => deleteSession(session.id!)}
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}

            {activeMenu === "analytics" && (
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-8">
                  {/* Analytics Overview Card */}
                  <div className="p-6 rounded-3xl bg-cyan-500/5 border border-cyan-500/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-cyan-500">
                        Cognitive Engagement
                      </h3>
                      <BarChart3 className="w-4 h-4 text-cyan-500" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-400">Study Proficiency</span>
                        <span className="text-white font-bold">
                          {Math.min(100, 45 + librarySessions.length * 5)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-500 transition-all duration-1000"
                          style={{ width: `${Math.min(100, 45 + librarySessions.length * 5)}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-relaxed">
                      You have completed{" "}
                      <span className="text-white font-bold">{librarySessions.length}</span>{" "}
                      high-value study modules.
                    </p>
                  </div>

                  {Object.entries(groupedSessions)
                    .sort(([a], [b]) => b.localeCompare(a))
                    .map(([date, dateSessions]) => {
                      const summaries = dateSessions.filter((s) => s.summary);
                      if (summaries.length === 0) return null;

                      return (
                        <div key={date} className="space-y-4">
                          <div className="flex items-center justify-between ml-2">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                              {format(new Date(date), "MMMM do, yyyy")}
                            </h3>
                            {summaries.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-[9px] uppercase font-bold text-cyan-500 hover:bg-cyan-500/10"
                                onClick={() => {
                                  const combinedSummary = summaries
                                    .map((s) => `--- ${s.title} ---\n${s.summary}`)
                                    .join("\n\n");
                                  handlePrintSummary({
                                    title: `Daily Study Portfolio - ${date}`,
                                    summary: combinedSummary,
                                    timestamp: new Date(date).getTime(),
                                    messages: summaries.flatMap((s) => s.messages).slice(0, 30),
                                    id: "daily-recap",
                                  });
                                }}
                              >
                                Print Daily Recap
                              </Button>
                            )}
                          </div>
                          {summaries.map((session) => (
                            <div
                              key={session.id}
                              className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-sm space-y-4 group"
                            >
                              <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                  <h4 className="text-sm font-bold text-zinc-100">
                                    {session.title}
                                  </h4>
                                  <span className="text-[10px] text-zinc-500 font-medium">
                                    Session Revision Card
                                  </span>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl"
                                    onClick={() => handlePrintSummary(session)}
                                    title="Print Study Document"
                                  >
                                    <Search className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl"
                                    onClick={() => exportChatToPDF(session.messages)}
                                    title="Export PDF"
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              <div className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800/50 leading-relaxed">
                                <p className="text-xs text-zinc-400 italic">"{session.summary}"</p>
                              </div>
                              <Button
                                variant="secondary"
                                className="w-full h-11 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                                onClick={() => {
                                  loadSession(session.id!);
                                  onClose();
                                }}
                              >
                                Re-enter Study Session
                              </Button>
                            </div>
                          ))}
                        </div>
                      );
                    })}

                  {librarySessions.length === 0 && (
                    <div className="p-12 text-center space-y-4">
                      <BarChart3 className="w-12 h-12 text-zinc-900 mx-auto" />
                      <p className="text-sm text-zinc-500">
                        Your Study Analytics are currently empty.
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}

            {activeMenu === "settings" && <SidebarSettingsView />}
          </div>
        )}
      </div>

      <div className="p-5 border-t border-zinc-800 bg-zinc-950">
        <DeploymentStatus />
      </div>
    </div>
  );
}

function SidebarSettingsView() {
  const { language, setLanguage } = useLanguageStore();
  const tutor = useTutor();
  const {
    persona: activePersonaName,
    setPersona,
    updateVoicePreference,
    runDiagnostic,
  } = useTutorVoice();

  const [pitchOffset, setPitchOffset] = useState<number>(() =>
    parseFloat(localStorage.getItem("tutor_pitch_adj") || "0"),
  );
  const [rateOffset, setRateOffset] = useState<number>(() =>
    parseFloat(localStorage.getItem("tutor_rate_adj") || "0"),
  );
  const [availableVoices, setAvailableVoices] = useState<
    { name: string; lang: string; gender: "male" | "female" | "neutral" }[]
  >([]);

  // Hardware permissions
  const [cameraEnabled, setCameraEnabled] = useState(
    () => localStorage.getItem("perm_camera") !== "false",
  );
  const [micEnabled, setMicEnabled] = useState(() => localStorage.getItem("perm_mic") !== "false");
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => localStorage.getItem("perm_notify") !== "false",
  );
  const [storageEnabled, setStorageEnabled] = useState(
    () => localStorage.getItem("perm_storage") !== "false",
  );

  useEffect(() => {
    const fetchVoices = async () => {
      const voices = await HardwareBridge.getVoices();
      setAvailableVoices(voices);
    };
    fetchVoices();
  }, []);

  const handleTestVoice = (voiceType: "male" | "female") => {
    tutor.setVoice(voiceType);
    const sampleText =
      voiceType === "male"
        ? "Salaam! I am Adams, your male voice tutor."
        : "Salaam! I am Haawa, your female voice tutor.";
    tutor.speak(sampleText, { force: true });
  };

  const handleTogglePermission = (type: "camera" | "mic" | "notify" | "storage") => {
    if (type === "camera") {
      setCameraEnabled(!cameraEnabled);
      localStorage.setItem("perm_camera", String(!cameraEnabled));
    } else if (type === "mic") {
      setMicEnabled(!micEnabled);
      localStorage.setItem("perm_mic", String(!micEnabled));
    } else if (type === "notify") {
      setNotificationsEnabled(!notificationsEnabled);
      localStorage.setItem("perm_notify", String(!notificationsEnabled));
    } else if (type === "storage") {
      setStorageEnabled(!storageEnabled);
      localStorage.setItem("perm_storage", String(!storageEnabled));
    }
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} preference updated.`);
  };

  const saveConfig = () => {
    localStorage.setItem("tutor_pitch_adj", String(pitchOffset));
    localStorage.setItem("tutor_rate_adj", String(rateOffset));
    toast.success("Voice attributes saved successfully!");
  };

  return (
    <ScrollArea className="flex-1">
      <div className="p-6 space-y-8">
        {/* Hardware Permissions */}
        <div className="space-y-4">
          <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            <Camera className="w-3 h-3" /> Device Access
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <PermissionToggle
              icon={Camera}
              label="Camera"
              enabled={cameraEnabled}
              onToggle={() => handleTogglePermission("camera")}
            />
            <PermissionToggle
              icon={Mic}
              label="Mic"
              enabled={micEnabled}
              onToggle={() => handleTogglePermission("mic")}
            />
            <PermissionToggle
              icon={Bell}
              label="Alerts"
              enabled={notificationsEnabled}
              onToggle={() => handleTogglePermission("notify")}
            />
            <PermissionToggle
              icon={HardDrive}
              label="Cache"
              enabled={storageEnabled}
              onToggle={() => handleTogglePermission("storage")}
            />
          </div>
        </div>

        {/* Language Selection */}
        <div className="space-y-3">
          <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            <Globe className="w-3 h-3" /> Interface Language
          </Label>
          <select
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value as LanguageCode);
              toast.success(`Language set to ${e.target.value.toUpperCase()}`);
            }}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 h-11 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="en">English</option>
            <option value="lg">Luganda</option>
            <option value="nk">Runyankole</option>
            <option value="sw">Swahili</option>
            <option value="lu">Luo</option>
            <option value="ls">Lusoga</option>
          </select>
        </div>

        {/* Persona Toggle */}
        <div className="space-y-3">
          <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            <UserCheck className="w-3 h-3" /> Active Persona
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {(["Adams", "Haawa"] as const).map((p) => (
              <Button
                key={p}
                variant="ghost"
                onClick={() => setPersona(p)}
                className={cn(
                  "h-12 rounded-xl border border-zinc-800 flex items-center justify-start px-3 gap-2 transition-all",
                  activePersonaName === p
                    ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400"
                    : "hover:bg-zinc-900",
                )}
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold",
                    activePersonaName === p
                      ? "bg-cyan-500 text-black"
                      : "bg-zinc-800 text-zinc-400",
                  )}
                >
                  {p[0]}
                </div>
                <span className="text-xs font-bold">{p}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Audio Attributes */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <Sliders className="w-3 h-3" /> Speech Attributes
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => tutor.setTtsEnabled(!tutor.ttsEnabled)}
              className="h-6 px-2 text-[9px] rounded-lg"
            >
              {tutor.ttsEnabled ? (
                <Volume2 className="w-3 h-3 text-cyan-400" />
              ) : (
                <VolumeX className="w-3 h-3 text-red-400" />
              )}
            </Button>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-zinc-400">
                <span>Volume</span>
                <span>{Math.round(tutor.volume * 100)}%</span>
              </div>
              <Slider
                value={[tutor.volume]}
                min={0}
                max={1}
                step={0.1}
                onValueChange={([val]) => updateVoicePreference({ volume: val })}
                className="py-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-zinc-400">
                <span>Pitch Adjustment</span>
                <span>{pitchOffset > 0 ? `+${pitchOffset}` : pitchOffset}</span>
              </div>
              <Slider
                value={[pitchOffset]}
                min={-0.5}
                max={0.5}
                step={0.1}
                onValueChange={([val]) => setPitchOffset(val)}
                className="py-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-zinc-400">
                <span>Reading Speed</span>
                <span>{tutor.speed}x</span>
              </div>
              <Slider
                value={[tutor.speed]}
                min={0.5}
                max={2}
                step={0.1}
                onValueChange={([val]) => updateVoicePreference({ speed: val })}
                className="py-2"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              className="flex-1 bg-zinc-100 text-black hover:bg-white rounded-xl h-10 text-[10px] font-black uppercase tracking-widest"
              onClick={saveConfig}
            >
              Save Parameters
            </Button>
            <Button
              variant="outline"
              className="border-zinc-800 rounded-xl h-10 w-10 p-0"
              onClick={() => handleTestVoice(activePersonaName === "Adams" ? "male" : "female")}
              disabled={tutor.speaking}
            >
              <Play className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Sync Settings */}
        <div className="pt-6 border-t border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-white">Auto-Cloud Sync</div>
              <div className="text-[10px] text-zinc-500">Backup transcripts in real-time</div>
            </div>
            <div
              className={cn(
                "w-10 h-5 rounded-full relative cursor-pointer transition-colors",
                navigator.onLine ? "bg-cyan-500/20" : "bg-zinc-800",
              )}
            >
              <div
                className={cn(
                  "absolute top-1 w-3 h-3 rounded-full transition-all",
                  navigator.onLine ? "right-1 bg-cyan-500" : "left-1 bg-zinc-600",
                )}
              />
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full h-10 rounded-xl border border-zinc-800 text-[10px] font-bold gap-2 text-zinc-400 hover:text-white"
            onClick={() => useTutorStore.getState().syncToSupabase()}
          >
            <RefreshCw className="w-3 h-3" /> Force Background Sync
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}

function PermissionToggle({
  icon: Icon,
  label,
  enabled,
  onToggle,
}: {
  icon: any;
  label: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      variant="ghost"
      onClick={onToggle}
      className={cn(
        "h-14 rounded-xl border border-zinc-800 flex items-center justify-start px-3 gap-3 transition-all",
        enabled
          ? "bg-zinc-900 border-zinc-700 text-white"
          : "text-zinc-500 opacity-60 hover:opacity-100",
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center",
          enabled ? "bg-green-500/20 text-green-400" : "bg-zinc-950 text-zinc-700",
        )}
      >
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>
    </Button>
  );
}

function SessionItem({
  session,
  isActive,
  onSelect,
  onDelete,
}: {
  session: any;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "p-3.5 my-1 rounded-xl border border-transparent cursor-pointer flex items-center justify-between hover:bg-zinc-900 transition-colors group",
        isActive ? "bg-zinc-900 border-zinc-800 shadow-sm" : "",
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1" onClick={onSelect}>
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
            isActive ? "bg-cyan-500/10 text-cyan-400" : "bg-zinc-900 text-zinc-600",
          )}
        >
          <MessageSquare className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <span
            className={cn(
              "text-sm font-medium truncate block",
              isActive ? "text-white" : "text-zinc-400",
            )}
          >
            {session.title || `Study Session #${session.id}`}
          </span>
          <span className="text-[10px] text-zinc-600 block mt-0.5">
            {format(session.timestamp, "MMM d, h:mm a")}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-zinc-400 hover:text-red-400"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
