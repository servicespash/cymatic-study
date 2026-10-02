import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Settings as SettingsIcon, Globe, Camera, Mic, Bell, HardDrive } from "lucide-react";
import { UserProfileCard } from "@/components/UserProfileCard";
import { useLanguageStore, type LanguageCode } from "@/store/useLanguageStore";
import { useAuth } from "@/lib/auth-context";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

// Role-aware settings components
import { AdminSettings } from "@/components/settings/AdminSettings";
import { TeacherSettings } from "@/components/settings/TeacherSettings";
import { StudentSettings } from "@/components/settings/StudentSettings";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "System Settings — Cymatic Study" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { language, setLanguage, t } = useLanguageStore();
  const { isAdmin, isTeacher, isStudent } = useAuth();

  const [activeTab, setActiveTab] = useState<"permissions" | "role_settings">("permissions");

  // Local hardware preferences
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

  const handleTogglePermission = (type: "camera" | "mic" | "notify" | "storage") => {
    if (type === "camera") {
      setCameraEnabled(!cameraEnabled);
      localStorage.setItem("perm_camera", String(!cameraEnabled));
      toast.success(`Camera access: ${!cameraEnabled ? "Active" : "Disabled"}`);
    } else if (type === "mic") {
      setMicEnabled(!micEnabled);
      localStorage.setItem("perm_mic", String(!micEnabled));
      toast.success(`Microphone access: ${!micEnabled ? "Active" : "Disabled"}`);
    } else if (type === "notify") {
      setNotificationsEnabled(!notificationsEnabled);
      localStorage.setItem("perm_notify", String(!notificationsEnabled));
      toast.success(`Push notifications: ${!notificationsEnabled ? "Active" : "Disabled"}`);
    } else if (type === "storage") {
      setStorageEnabled(!storageEnabled);
      localStorage.setItem("perm_storage", String(!storageEnabled));
      toast.success(`Offline database cache: ${!storageEnabled ? "Active" : "Disabled"}`);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-8 pb-32 animate-fade-in text-white bg-zinc-950 min-h-screen">
      {/* Settings Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-glow">
            <SettingsIcon className="h-6 w-6 animate-spin-slow text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-extrabold tracking-tight">System Settings</h1>
              <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                {activeTab === "permissions" ? "Permissions & Hardware" : "Role Console"}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Configure devices, language parameters, and institutional bounds.
            </p>
          </div>
        </div>

        {/* Global Language Switcher with Lusoga Support */}
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-2xl">
          <Globe className="h-4 w-4 text-indigo-400" />
          <select
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value as LanguageCode);
              toast.success(`Language shifted to ${e.target.value.toUpperCase()}!`);
            }}
            className="bg-transparent text-xs font-bold outline-none cursor-pointer border-none text-white font-mono"
          >
            <option className="bg-zinc-900" value="en">
              English
            </option>
            <option className="bg-zinc-900" value="lg">
              Luganda
            </option>
            <option className="bg-zinc-900" value="nk">
              Runyankole
            </option>
            <option className="bg-zinc-900" value="sw">
              Swahili
            </option>
            <option className="bg-zinc-900" value="lu">
              Luo
            </option>
            <option className="bg-zinc-900" value="ls">
              Lusoga
            </option>
          </select>
        </div>
      </div>

      {/* User Info & Role Profile Card */}
      <UserProfileCard showActions={false} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-zinc-900 p-1 rounded-2xl border border-zinc-800 h-12">
          <TabsTrigger value="permissions" className="text-xs font-bold uppercase tracking-wider">
            🔌 Hardware & Devices
          </TabsTrigger>
          <TabsTrigger value="role_settings" className="text-xs font-bold uppercase tracking-wider">
            💼 Role-Aware Console
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Hardware Permissions */}
        <TabsContent value="permissions" className="space-y-6 outline-none">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">Browser Hardware Access</h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Enable microphone, camera, notifications, and offline capability.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <PermissionCard
                title="Camera Feed Capture"
                desc="Required for real-time portfolio verification and face registration."
                enabled={cameraEnabled}
                icon={Camera}
                onToggle={() => handleTogglePermission("camera")}
              />
              <PermissionCard
                title="Microphone Audio Feed"
                desc="Utilized for Socratic audio diagnostics and voice tutor responses."
                enabled={micEnabled}
                icon={Mic}
                onToggle={() => handleTogglePermission("mic")}
              />
              <PermissionCard
                title="Syllabus Notifications"
                desc="Sends critical study guidelines, reminders, and verification alerts."
                enabled={notificationsEnabled}
                icon={Bell}
                onToggle={() => handleTogglePermission("notify")}
              />
              <PermissionCard
                title="Offline Web Storage"
                desc="Saves your course records, study hours, and files without internet."
                enabled={storageEnabled}
                icon={HardDrive}
                onToggle={() => handleTogglePermission("storage")}
              />
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: Role-Aware Settings */}
        <TabsContent value="role_settings" className="space-y-6 outline-none">
          {isAdmin && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest px-1">
                Institutional Administration
              </h4>
              <AdminSettings />
            </div>
          )}

          {isTeacher && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest px-1">
                Educator Space
              </h4>
              <TeacherSettings />
            </div>
          )}

          {isStudent && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest px-1">
                Learner Space
              </h4>
              <StudentSettings />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface PermissionCardProps {
  title: string;
  desc: string;
  enabled: boolean;
  icon: any;
  onToggle: () => void;
}

function PermissionCard({ title, desc, enabled, icon: Icon, onToggle }: PermissionCardProps) {
  return (
    <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <div
          className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
            enabled ? "bg-indigo-600/15 text-indigo-400" : "bg-zinc-800 text-zinc-500"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="space-y-0.5 min-w-0 text-left">
          <h4 className="text-xs font-extrabold text-white truncate">{title}</h4>
          <p className="text-[10px] text-zinc-400 leading-normal line-clamp-2">{desc}</p>
        </div>
      </div>

      <button
        onClick={onToggle}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          enabled ? "bg-indigo-600" : "bg-zinc-800"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
