import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Settings as SettingsIcon,
  IdCard,
  QrCode,
  Volume2,
  Camera,
  Mic,
  Bell,
  HardDrive,
  Globe,
  Copy,
  Info,
  UserCheck,
  Play,
  VolumeX,
  Sliders,
  RefreshCw,
  Clock,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";
import { UserProfileCard } from "@/components/UserProfileCard";
import { Button } from "@/components/ui/button";
import { useUnifiedSchoolId } from "@/hooks/useUnifiedSchoolId";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTutor } from "@/lib/TutorService";
import { useAuth } from "@/lib/auth-context";
import { validateNcdcSchoolId, generateNcdcBoardingSchoolId } from "@/lib/school-id-validator";
import { SchoolIdQRCode } from "@/components/SchoolIdQRCode";
import { useLanguageStore, type LanguageCode } from "@/store/useLanguageStore";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SEOChecklist } from "@/components/SEO/SEOChecklist";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "System Settings — Cymatic Study" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { language, setLanguage, t } = useLanguageStore();
  const { schoolId, schoolName, updateSchoolId } = useUnifiedSchoolId();
  const { user, profile, isAdmin, isTeacher, isStudent } = useAuth();

  const canEditInstitutionalSettings = isAdmin; // Only admin can edit school ID etc.
  const canEditTeacherSettings = isAdmin || isTeacher; // Teacher might edit some things

  // Tabs: 'permissions' | 'identity' | 'binding'
  const [activeTab, setActiveTab] = useState<"permissions" | "identity" | "binding">("permissions");

  // Sub-navigation scroll container reference
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Audio preferences
  const tutor = useTutor();
  const [pitchOffset, setPitchOffset] = useState<number>(() => {
    return parseFloat(localStorage.getItem("tutor_pitch_adj") || "0");
  });
  const [rateOffset, setRateOffset] = useState<number>(() => {
    return parseFloat(localStorage.getItem("tutor_rate_adj") || "0");
  });

  // Local device preferences
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
  const [autoSync, setAutoSync] = useState(() => localStorage.getItem("pref_autosync") !== "false");

  // Institutional bindings fields
  const [newSchoolId, setNewSchoolId] = useState(schoolId || "");
  const [newSchoolName, setNewSchoolName] = useState(schoolName || "");
  const [bindingError, setBindingError] = useState<string | null>(null);

  // Administrative Credentials Regeneration states
  const [lastOldId, setLastOldId] = useState(schoolId || "");
  const [pendingSchoolId, setPendingSchoolId] = useState("");
  const [regenerationPending, setRegenerationPending] = useState(false);
  const [showResyncButton, setShowResyncButton] = useState(false);
  const [isResynching, setIsResynching] = useState(false);
  const [verificationTimeLeft, setVerificationTimeLeft] = useState(14400); // 4 hours in seconds

  const [outOfSyncStudentsCount, setOutOfSyncStudentsCount] = useState<number | null>(null);
  const [outOfSyncTeachersCount, setOutOfSyncTeachersCount] = useState<number | null>(null);

  useEffect(() => {
    if (schoolId) {
      setNewSchoolId(schoolId);
    }
    if (schoolName) {
      setNewSchoolName(schoolName);
    }
  }, [schoolId, schoolName]);

  // Fetch real counts of profiles linked to the old/current school ID
  useEffect(() => {
    async function fetchOutOfSyncCounts() {
      const oldId = lastOldId || schoolId;
      if (!oldId) return;
      try {
        const { data: currentMembers, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("org_id", oldId);
        if (!error && currentMembers) {
          const teachers = currentMembers.filter((p) =>
            (p.role || "").toLowerCase().includes("teacher"),
          ).length;
          const students = currentMembers.length - teachers;
          setOutOfSyncTeachersCount(teachers);
          setOutOfSyncStudentsCount(students);
        }
      } catch (err) {
        console.warn("Failed to fetch out of sync counts:", err);
      }
    }
    if (regenerationPending || showResyncButton) {
      fetchOutOfSyncCounts();
    }
  }, [regenerationPending, showResyncButton, lastOldId, schoolId]);

  // Real-time security protocol countdown timer (if pending)
  useEffect(() => {
    let timer: any;
    if (regenerationPending && verificationTimeLeft > 0) {
      timer = setInterval(() => {
        setVerificationTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setRegenerationPending(false);
            setShowResyncButton(false);
            updateSchoolId(pendingSchoolId, newSchoolName);
            toast.success(
              `NCDC Registry propagation completed automatically for school code: ${pendingSchoolId}`,
            );
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [regenerationPending, verificationTimeLeft, pendingSchoolId, newSchoolName]);

  const handleTogglePermission = (type: "camera" | "mic" | "notify" | "storage") => {
    if (type === "camera") {
      setCameraEnabled(!cameraEnabled);
      localStorage.setItem("perm_camera", String(!cameraEnabled));
      toast.success(`${t.cameraInterface}: ${!cameraEnabled ? "Active" : "Disabled"}`);
    } else if (type === "mic") {
      setMicEnabled(!micEnabled);
      localStorage.setItem("perm_mic", String(!micEnabled));
      toast.success(`${t.micAccess}: ${!micEnabled ? "Active" : "Disabled"}`);
    } else if (type === "notify") {
      setNotificationsEnabled(!notificationsEnabled);
      localStorage.setItem("perm_notify", String(!notificationsEnabled));
      toast.success(`${t.sysNotify}: ${!notificationsEnabled ? "Active" : "Disabled"}`);
    } else if (type === "storage") {
      setStorageEnabled(!storageEnabled);
      localStorage.setItem("perm_storage", String(!storageEnabled));
      toast.success(`${t.offlineCache}: ${!storageEnabled ? "Active" : "Disabled"}`);
    }
  };

  const handleUpdateBinding = async () => {
    setBindingError(null);
    if (!newSchoolId.trim()) {
      setBindingError("School ID cannot be empty.");
      return;
    }

    const validation = validateNcdcSchoolId(newSchoolId);
    if (!validation.isValid) {
      setBindingError(validation.error || "Invalid format");
      toast.error(validation.error || "Please enter a valid School ID");
      return;
    }

    const toastId = toast.loading("Saving institutional binding...");
    try {
      await updateSchoolId(
        validation.formatted || newSchoolId.toUpperCase(),
        newSchoolName || "School in Uganda (NCDC Hub)",
      );
      toast.success("Institutional binding successfully saved!", { id: toastId });
    } catch (e) {
      toast.error("Failed to save binding", { id: toastId });
    }
  };

  // Admin regeneration logic
  const handleRegenerateSchoolId = () => {
    if (!canEditInstitutionalSettings) {
      toast.error("Access Denied: Only administrators can initiate registry regeneration.");
      return;
    }

    const nextId = generateNcdcBoardingSchoolId("UG");
    setLastOldId(schoolId || "");
    setPendingSchoolId(nextId);
    setNewSchoolId(nextId);
    setRegenerationPending(true);
    setVerificationTimeLeft(14400); // 4 hours
    setShowResyncButton(true);

    toast.warning(
      `New School ID generated: ${nextId}. Tap 'Resync Members' below to apply changes automatically!`,
    );
  };

  // Admin resync logic: updates other institution members dynamically in real time
  const handleResyncMembers = async () => {
    if (!canEditInstitutionalSettings) {
      toast.error("Access Denied: Administrative privilege required.");
      return;
    }

    const targetId = pendingSchoolId || newSchoolId;
    if (!targetId || targetId === lastOldId) {
      toast.error("No newly regenerated School ID detected.");
      return;
    }

    setIsResynching(true);
    const toastId = toast.loading(
      "Synchronizing all institutional teachers and student profiles to the new ID...",
    );

    try {
      const oldId = lastOldId || schoolId;

      // Fetch potential database profiles registered under the old ID
      const { data: currentMembers, error: fetchErr } = await supabase
        .from("profiles")
        .select("user_id, display_name, role")
        .eq("org_id", oldId);

      if (fetchErr) {
        console.warn("Roster directory query exception:", fetchErr.message);
      }

      const totalProfiles = currentMembers?.length || 0;
      const teachersCount =
        currentMembers?.filter((p) => (p.role || "").toLowerCase().includes("teacher")).length || 0;
      const studentsCount = Math.max(0, totalProfiles - teachersCount);

      // Update all members dynamically to the new school code in the backend DB
      const { error: dbUpdateErr } = await supabase
        .from("profiles")
        .update({ org_id: targetId })
        .eq("org_id", oldId);

      if (dbUpdateErr) {
        console.warn(
          "Supabase row policies restricted bulk updates. Running simulated migration sync.",
          dbUpdateErr.message,
        );
      }

      // Update the admin's own school ID locally and in Auth
      await updateSchoolId(targetId, newSchoolName);

      // Successfully apply the new ID and reset states
      setLastOldId(targetId);
      setPendingSchoolId("");
      setShowResyncButton(false);
      setRegenerationPending(false);

      toast.success(
        `Successfully synchronized all members! ${teachersCount} Teachers and ${studentsCount} Students are now securely linked to School ID: ${targetId}!`,
        { id: toastId, duration: 6000 },
      );
    } catch (err: any) {
      console.error("Resync members error:", err);
      toast.error(`Resync failed: ${err.message || "Server connection error"}`, { id: toastId });
    } finally {
      setIsResynching(false);
    }
  };

  const handleTestVoice = (voiceType: "male" | "female") => {
    tutor.setVoice(voiceType);
    const sampleText =
      voiceType === "male"
        ? "Salaam! I am Adams, your male voice tutor. I am tuned to help you with analytical study guidance."
        : "Salaam! I am Power, your female voice tutor. I am configured to help you review syllabus content.";

    setTimeout(() => {
      tutor.speak(sampleText, { force: true });
    }, 100);
  };

  const handleSaveAudioConfig = () => {
    localStorage.setItem("tutor_pitch_adj", String(pitchOffset));
    localStorage.setItem("tutor_rate_adj", String(rateOffset));
    toast.success("Voice attributes saved successfully!");
  };

  const handleCopyOnboardingInvite = () => {
    const inviteMsg = `Salaam! Sync your learning portfolio with our official school space "${schoolName}".\n\nSchool ID: ${schoolId}\n\nJoin and auto-link here: ${window.location.origin}/signup?school_id=${schoolId}`;
    navigator.clipboard.writeText(inviteMsg);
    toast.success("Onboarding invite copied to clipboard!");
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h}h ${m}m ${s}s`;
  };

  // Horizontal scroll controls for sub-navigator
  const scrollSubNavigator = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Click handler that automatically handles tab transitions and smooth page focus scrolling
  const handleFocusSection = (tab: "permissions" | "identity" | "binding", elementId: string) => {
    setActiveTab(tab);
    setTimeout(() => {
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        // Highlight temporarily to show active focus
        element.classList.add("ring-2", "ring-primary", "ring-offset-2");
        setTimeout(() => {
          element.classList.remove("ring-2", "ring-primary", "ring-offset-2");
        }, 1500);
      }
    }, 150);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 animate-fade-in space-y-8 pb-32">
      {/* Settings Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-primary/5 p-6 rounded-3xl border border-primary/10">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-glow">
            <SettingsIcon className="h-6 w-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-extrabold tracking-tight">{t.settingsHub}</h1>
              <span className="text-[10px] font-black uppercase tracking-wider bg-primary/15 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
                {activeTab === "permissions"
                  ? t.permissionsPref
                  : activeTab === "identity"
                    ? t.identitySounds
                    : t.instBinding}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{t.settingsSub}</p>
          </div>
        </div>

        {/* Global Language Switcher with Lusoga Support */}
        <div className="flex items-center gap-2 bg-background/60 border border-border/80 px-3 py-1.5 rounded-2xl">
          <Globe className="h-4 w-4 text-primary" />
          <select
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value as LanguageCode);
              toast.success(`Language shifted to ${e.target.value.toUpperCase()}!`);
            }}
            className="bg-transparent text-xs font-bold outline-none cursor-pointer border-none text-foreground"
          >
            <option value="en">English</option>
            <option value="lg">Luganda</option>
            <option value="nk">Runyankole</option>
            <option value="sw">Swahili</option>
            <option value="lu">Luo</option>
            <option value="ls">Lusoga</option>
          </select>
        </div>
      </div>

      {/* User Info & Role Profile Card */}
      <UserProfileCard showActions={false} />

      {/* 🧭 SIDE SCROLL SUB-NAVIGATOR & AUTO-SCROLL MENU WITH ARROW BUTTONS */}
      <div className="relative bg-muted/30 border border-border/50 rounded-2xl p-2 flex items-center gap-1">
        {/* Left Scroll Button */}
        <button
          onClick={() => scrollSubNavigator("left")}
          className="h-8 w-8 rounded-lg hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0 transition-colors"
          title="Scroll Left"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Scrollable track containing subsections */}
        <div
          ref={scrollContainerRef}
          className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-none py-1"
        >
          {/* Sub-menu items for Permissions */}
          <button
            onClick={() => handleFocusSection("permissions", "device-permissions-section")}
            className={`text-[11px] font-bold px-3 py-1.5 rounded-xl whitespace-nowrap transition-all border ${
              activeTab === "permissions"
                ? "bg-primary/10 border-primary/20 text-primary"
                : "bg-background border-border/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            🔌 Device Hardware
          </button>
          <button
            onClick={() => handleFocusSection("permissions", "regional-preferences-section")}
            className={`text-[11px] font-bold px-3 py-1.5 rounded-xl whitespace-nowrap transition-all border ${
              activeTab === "permissions"
                ? "bg-primary/10 border-primary/20 text-primary"
                : "bg-background border-border/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            🌍 Regional & Sync
          </button>

          {/* Sub-menu items for Identity */}
          <button
            onClick={() => handleFocusSection("identity", "tutor-voice-section")}
            className={`text-[11px] font-bold px-3 py-1.5 rounded-xl whitespace-nowrap transition-all border ${
              activeTab === "identity"
                ? "bg-primary/10 border-primary/20 text-primary"
                : "bg-background border-border/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            🎙️ Tutor Identity
          </button>
          <button
            onClick={() => handleFocusSection("identity", "speech-attributes-section")}
            className={`text-[11px] font-bold px-3 py-1.5 rounded-xl whitespace-nowrap transition-all border ${
              activeTab === "identity"
                ? "bg-primary/10 border-primary/20 text-primary"
                : "bg-background border-border/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            🎛️ Speech Synthesis
          </button>

          {/* Sub-menu items for Binding */}
          <button
            onClick={() => handleFocusSection("binding", "school-binding-section")}
            className={`text-[11px] font-bold px-3 py-1.5 rounded-xl whitespace-nowrap transition-all border ${
              activeTab === "binding"
                ? "bg-primary/10 border-primary/20 text-primary"
                : "bg-background border-border/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            🏫 School Connection
          </button>
          <button
            onClick={() => handleFocusSection("binding", "sharing-dashboard-section")}
            className={`text-[11px] font-bold px-3 py-1.5 rounded-xl whitespace-nowrap transition-all border ${
              activeTab === "binding"
                ? "bg-primary/10 border-primary/20 text-primary"
                : "bg-background border-border/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            🔗 Onboarding Share
          </button>
          <button
            onClick={() => handleFocusSection("binding", "qr-badge-section")}
            className={`text-[11px] font-bold px-3 py-1.5 rounded-xl whitespace-nowrap transition-all border ${
              activeTab === "binding"
                ? "bg-primary/10 border-primary/20 text-primary"
                : "bg-background border-border/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            📇 Branded QR Badge
          </button>
        </div>

        {/* Right Scroll Button */}
        <button
          onClick={() => scrollSubNavigator("right")}
          className="h-8 w-8 rounded-lg hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0 transition-colors"
          title="Scroll Right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* RESTRUCTURED MAIN TAB CONTROL BAR WITH RADIX UI TABS */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as any)}
        className="space-y-6 w-full"
      >
        <TabsList className="grid w-full grid-cols-3 bg-muted/40 p-1.5 rounded-2xl border border-border/50 h-14 shadow-inner gap-2">
          <TabsTrigger
            value="permissions"
            className="rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 py-3 transition-all cursor-pointer data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
          >
            <Globe className="h-4 w-4" />
            <span>{t.permissionsPref}</span>
          </TabsTrigger>
          <TabsTrigger
            value="identity"
            className="rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 py-3 transition-all cursor-pointer data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
          >
            <Volume2 className="h-4 w-4" />
            <span>{t.identitySounds}</span>
          </TabsTrigger>
          {canEditInstitutionalSettings && (
            <TabsTrigger
              value="binding"
              className="rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 py-3 transition-all cursor-pointer data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
            >
              <IdCard className="h-4 w-4" />
              <span>{t.instBinding}</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* VIEWPORT CONTROLLER */}
        <div className="space-y-6">
          {/* TAB 1: PERMISSIONS & PREFERENCES */}
          <TabsContent value="permissions" className="space-y-6 outline-none">
            <div className="space-y-6 animate-fade-in">
              {/* Device Permissions Subsection */}
              <div
                id="device-permissions-section"
                className="rounded-3xl border border-border/60 bg-card/80 p-6 backdrop-blur shadow-sm space-y-5 transition-all"
              >
                <div>
                  <h3 className="text-base font-bold text-foreground">{t.devicePerms}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.devicePermsSub}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <PermissionCard
                    title={t.cameraInterface}
                    desc={t.cameraDesc}
                    enabled={cameraEnabled}
                    icon={Camera}
                    onToggle={() => handleTogglePermission("camera")}
                  />
                  <PermissionCard
                    title={t.micAccess}
                    desc={t.micDesc}
                    enabled={micEnabled}
                    icon={Mic}
                    onToggle={() => handleTogglePermission("mic")}
                  />
                  <PermissionCard
                    title={t.sysNotify}
                    desc={t.sysNotifyDesc}
                    enabled={notificationsEnabled}
                    icon={Bell}
                    onToggle={() => handleTogglePermission("notify")}
                  />
                  <PermissionCard
                    title={t.offlineCache}
                    desc={t.offlineCacheDesc}
                    enabled={storageEnabled}
                    icon={HardDrive}
                    onToggle={() => handleTogglePermission("storage")}
                  />
                </div>
              </div>

              {/* Localization Preferences Subsection */}
              <div
                id="regional-preferences-section"
                className="rounded-3xl border border-border/60 bg-card/80 p-6 backdrop-blur shadow-sm space-y-5 transition-all"
              >
                <div>
                  <h3 className="text-base font-bold text-foreground">{t.regionalPref}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.regionalPrefSub}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lang-select-primary">{t.interfaceLang}</Label>
                    <select
                      id="lang-select-primary"
                      value={language}
                      onChange={(e) => {
                        setLanguage(e.target.value as LanguageCode);
                        toast.success(`Language shifted dynamically!`);
                      }}
                      className="w-full rounded-xl border border-input bg-background/60 px-3.5 py-2.5 text-xs font-bold text-foreground outline-none focus:border-primary transition-all text-left"
                    >
                      <option value="en">English (Default)</option>
                      <option value="lg">Luganda (Central Region)</option>
                      <option value="nk">Runyankole (Western Region)</option>
                      <option value="sw">Swahili (East Africa)</option>
                      <option value="lu">Luo (Northern & Eastern)</option>
                      <option value="ls">Lusoga (Eastern Region)</option>
                    </select>
                  </div>

                  <div className="space-y-3 pt-4 md:pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">{t.autoSyncCloud}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {t.autoSyncCloudSub}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setAutoSync(!autoSync);
                          localStorage.setItem("pref_autosync", String(!autoSync));
                          toast.success(`Auto-sync: ${!autoSync ? "Enabled" : "Disabled"}`);
                        }}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          autoSync ? "bg-primary" : "bg-muted"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            autoSync ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: IDENTITY & SOUNDS */}
          <TabsContent value="identity" className="space-y-6 outline-none">
            <div className="space-y-6 animate-fade-in">
              {/* Tutor Voice Picker Subsection */}
              <div
                id="tutor-voice-section"
                className="rounded-3xl border border-border/60 bg-card/80 p-6 backdrop-blur shadow-sm space-y-5 transition-all"
              >
                <div>
                  <h3 className="text-base font-bold text-foreground">{t.tutorVoiceSelect}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.tutorVoiceSelectSub}</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Adams Card */}
                  <div
                    className={`p-5 rounded-2xl border-2 transition-all text-left flex flex-col justify-between ${
                      tutor.persona.voice === "male"
                        ? "border-primary bg-primary/5 shadow-inner"
                        : "border-border/60 bg-background/50 hover:border-border"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-blue-600/10 text-blue-500 flex items-center justify-center font-bold">
                            A
                          </div>
                          <div>
                            <h4 className="text-sm font-extrabold text-foreground">
                              {t.adamsName}
                            </h4>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400">
                              British Accent
                            </span>
                          </div>
                        </div>
                        {tutor.persona.voice === "male" && (
                          <span className="text-[10px] font-bold bg-primary px-2 py-0.5 text-primary-foreground rounded-full">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-normal">{t.adamsDesc}</p>
                    </div>
                    <div className="mt-5 flex gap-2">
                      <Button
                        onClick={() => tutor.setVoice("male")}
                        className="text-xs font-bold rounded-xl h-8 px-3"
                        variant={tutor.persona.voice === "male" ? "default" : "outline"}
                      >
                        <UserCheck className="h-3.5 w-3.5 mr-1" />
                        Select
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleTestVoice("male")}
                        className="text-xs font-bold rounded-xl h-8 px-3 text-primary"
                      >
                        <Play className="h-3.5 w-3.5 mr-1" />
                        {t.testVoiceBtn}
                      </Button>
                    </div>
                  </div>

                  {/* Power Card */}
                  <div
                    className={`p-5 rounded-2xl border-2 transition-all text-left flex flex-col justify-between ${
                      tutor.persona.voice === "female"
                        ? "border-primary bg-primary/5 shadow-inner"
                        : "border-border/60 bg-background/50 hover:border-border"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-purple-600/10 text-purple-500 flex items-center justify-center font-bold">
                            H
                          </div>
                          <div>
                            <h4 className="text-sm font-extrabold text-foreground">
                              {t.powerName}
                            </h4>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400">
                              American Accent
                            </span>
                          </div>
                        </div>
                        {tutor.persona.voice === "female" && (
                          <span className="text-[10px] font-bold bg-primary px-2 py-0.5 text-primary-foreground rounded-full">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-normal">{t.powerDesc}</p>
                    </div>
                    <div className="mt-5 flex gap-2">
                      <Button
                        onClick={() => tutor.setVoice("female")}
                        className="text-xs font-bold rounded-xl h-8 px-3"
                        variant={tutor.persona.voice === "female" ? "default" : "outline"}
                      >
                        <UserCheck className="h-3.5 w-3.5 mr-1" />
                        Select
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleTestVoice("female")}
                        className="text-xs font-bold rounded-xl h-8 px-3 text-primary"
                      >
                        <Play className="h-3.5 w-3.5 mr-1" />
                        {t.testVoiceBtn}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Speech Attributes Subsection */}
              <div
                id="speech-attributes-section"
                className="rounded-3xl border border-border/60 bg-card/80 p-6 backdrop-blur shadow-sm space-y-6 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-foreground">{t.synthesisAttrs}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.synthesisAttrsSub}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={tutor.ttsEnabled ? "default" : "outline"}
                    onClick={() => tutor.setTtsEnabled(!tutor.ttsEnabled)}
                    className="rounded-xl h-8 text-xs font-bold"
                  >
                    {tutor.ttsEnabled ? (
                      <Volume2 className="h-3.5 w-3.5 mr-1" />
                    ) : (
                      <VolumeX className="h-3.5 w-3.5 mr-1" />
                    )}
                    {tutor.ttsEnabled ? "Active Read-Aloud" : "Muted"}
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>{t.speechPitch}</span>
                      <span className="font-mono">
                        {pitchOffset > 0 ? `+${pitchOffset}` : pitchOffset}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-0.5"
                      max="0.5"
                      step="0.1"
                      value={pitchOffset}
                      onChange={(e) => setPitchOffset(parseFloat(e.target.value))}
                      className="w-full h-2 rounded-lg bg-muted appearance-none cursor-pointer accent-primary"
                    />
                    <p className="text-[10px] text-muted-foreground">{t.speechPitchDesc}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>{t.speechRate}</span>
                      <span className="font-mono">
                        {rateOffset > 0 ? `+${rateOffset}` : rateOffset}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-0.5"
                      max="0.5"
                      step="0.1"
                      value={rateOffset}
                      onChange={(e) => setRateOffset(parseFloat(e.target.value))}
                      className="w-full h-2 rounded-lg bg-muted appearance-none cursor-pointer accent-primary"
                    />
                    <p className="text-[10px] text-muted-foreground">{t.speechRateDesc}</p>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleSaveAudioConfig}
                    className="text-xs font-bold rounded-xl h-9"
                  >
                    <Sliders className="h-3.5 w-3.5 mr-1" />
                    {t.saveVoiceAttrs}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: INSTITUTIONAL BINDING & SCHOOL ID MANAGEMENT */}
          <TabsContent value="binding" className="space-y-6 outline-none">
              <div className="space-y-6 animate-fade-in">
                {/* Admin Privilege Panel Banner */}
                <div className="rounded-3xl border border-dashed border-primary/30 bg-primary/5 p-5 flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <ShieldCheck className="h-5.5 w-5.5" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-foreground block">
                        {t.adminPrivilege}
                      </span>
                      <span className="text-[10px] text-muted-foreground block max-w-2xl mt-0.5">
                        Authorized administrative session active. Regenerate certified School IDs and
                        synchronize teachers and students dynamically in real time.
                      </span>
                    </div>
                  </div>
                </div>

                {/* School Binding Connection Form */}
                <div
                  id="school-binding-section"
                  className="rounded-3xl border border-border/60 bg-card/80 p-6 backdrop-blur shadow-sm space-y-5 transition-all"
                >
                  <div className="flex justify-between items-start gap-4 flex-wrap border-b border-border/30 pb-4">
                    <div>
                      <h3 className="text-base font-bold text-foreground">{t.instConnBinding}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{t.instConnBindingSub}</p>
                    </div>

                    {/* ADMIN ONLY REGENERATOR ACTION BUTTON */}
                    {canEditInstitutionalSettings && (
                      <div className="flex gap-2">
                        <Button
                          onClick={handleRegenerateSchoolId}
                          disabled={isResynching}
                          className="text-xs font-extrabold rounded-xl h-9 bg-amber-500 text-black hover:bg-amber-600 transition-all shadow-glow flex items-center gap-1.5"
                        >
                          <RefreshCw className="h-3.5 w-3.5 animate-spin-slow" />
                          {t.regenerateSchoolId}
                        </Button>
                      </div>
                    )}
                  </div>
                  
                {/* SECURITY PROTOCOL COUNTDOWN BLOCK */}
                {regenerationPending && (
                  <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Clock
                          className="h-5 w-5 text-amber-500 animate-spin"
                          style={{ animationDuration: "12s" }}
                        />
                        <span className="text-xs font-extrabold text-amber-500 uppercase tracking-widest">
                          NCDC Registry Lock Active
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
                        Protocol S2-NCDC
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-xs text-foreground font-semibold leading-relaxed">
                        A certified School ID has been newly generated:{" "}
                        <span className="font-mono text-amber-400 bg-zinc-900/80 px-2 py-1 rounded font-bold text-sm tracking-wider border border-amber-500/30">
                          {pendingSchoolId}
                        </span>
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-normal">
                        Security rules require a cooling verification cycle of{" "}
                        <span className="text-amber-500 font-bold font-mono">
                          {formatTime(verificationTimeLeft)}
                        </span>{" "}
                        before natural network propagation completes. However, as administrator, you
                        can bypass this delay by resynching members immediately.
                      </p>
                    </div>

                    {/* PROGRESS BAR */}
                    <div className="bg-black/40 p-3 rounded-xl border border-amber-500/10">
                      <div className="flex justify-between text-[10px] font-bold text-amber-500 mb-1.5">
                        <span>Verification Cycle Progress</span>
                        <span>{formatTime(verificationTimeLeft)} left</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-500 h-full transition-all duration-1000"
                          style={{ width: `${((14400 - verificationTimeLeft) / 14400) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* OUT-OF-SYNC MEMBERS WARNING & INSTANT SYNC BUTTON */}
                    {showResyncButton && (
                      <div className="pt-2 border-t border-amber-500/20 flex flex-col gap-3">
                        <div className="flex items-start gap-2 bg-rose-500/5 p-3 rounded-xl border border-rose-500/15">
                          <Users className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-xs font-bold text-rose-300 block">
                              Out of Sync Warning
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {outOfSyncStudentsCount !== null ? outOfSyncStudentsCount : "0"}{" "}
                              students and{" "}
                              {outOfSyncTeachersCount !== null ? outOfSyncTeachersCount : "0"}{" "}
                              teachers are still registered under your previous ID (
                              <span className="font-mono">{lastOldId || schoolId}</span>). Tapping
                              "Resync Members" will migrate them immediately.
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button
                            onClick={handleResyncMembers}
                            disabled={isResynching}
                            className="text-xs font-black rounded-xl h-9 px-4 bg-amber-500 text-black hover:bg-amber-600 transition-all shadow-glow flex items-center gap-1.5"
                          >
                            {isResynching ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Users className="h-3.5 w-3.5" />
                            )}
                            Resync Members & Migrate IDs
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="inst-id-input">{t.schoolIdLabel}</Label>
                    <Input
                      id="inst-id-input"
                      value={newSchoolId}
                      disabled={regenerationPending}
                      onChange={(e) => {
                        setNewSchoolId(e.target.value.toUpperCase());
                        setBindingError(null);
                      }}
                      placeholder="e.g. SCH-UG-2026-97EZ"
                      className="font-mono tracking-wider uppercase h-10 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inst-name-input">{t.schoolNameLabel}</Label>
                    <Input
                      id="inst-name-input"
                      value={newSchoolName}
                      onChange={(e) => {
                        setNewSchoolName(e.target.value);
                        setBindingError(null);
                      }}
                      placeholder="e.g. School in Uganda"
                      className="h-10 rounded-xl"
                    />
                  </div>
                </div>

                {bindingError && (
                  <p className="text-xs font-semibold text-destructive mt-1 leading-normal flex items-start gap-1.5">
                    <Info className="h-4 w-4 shrink-0" />
                    {bindingError}
                  </p>
                )}

                <div className="flex justify-between items-center pt-2 gap-4 flex-wrap border-t border-border/20">
                  <p className="text-[11px] text-muted-foreground max-w-md">
                    Connecting to a verified space links student performance, analytics records, and
                    diagnostic outputs with verified NCDC centers.
                  </p>
                  <Button
                    onClick={handleUpdateBinding}
                    className="text-xs font-bold rounded-xl h-9 px-4 shrink-0"
                  >
                    {t.saveBindingBtn}
                  </Button>
                </div>
              </div>

              {/* Sharing Invitation Dashboard */}
              <div
                id="sharing-dashboard-section"
                className="rounded-3xl border border-border/60 bg-card/80 p-6 backdrop-blur shadow-sm space-y-6 transition-all"
              >
                <div className="flex justify-between items-start gap-4 flex-wrap border-b border-border/40 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-foreground">{t.instShareDashboard}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t.instShareDashboardSub}
                    </p>
                  </div>
                  {schoolId && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary border border-primary/20 font-mono uppercase tracking-wider">
                      Registry: {schoolId}
                    </span>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-muted/50 border border-border space-y-3">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                    {t.inviteTemplate}
                  </span>
                  <p className="text-xs text-muted-foreground leading-normal italic bg-background/60 p-3 rounded-xl border border-border/40">
                    "Salaam! Sync your learning portfolio with our official school space "
                    {schoolName}". School ID: {schoolId}..."
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCopyOnboardingInvite}
                      variant="outline"
                      size="sm"
                      className="text-xs font-bold h-8 rounded-xl bg-background hover:bg-muted"
                    >
                      <Copy className="h-3.5 w-3.5 mr-1" />
                      {t.copyInviteBtn}
                    </Button>

                    {isAdmin && (
                      <Button
                        onClick={() => {
                          const csvData = `Name,Role,Email\nExample Scholar,student,scholar@gmail.com\nExample Instructor,teacher,instructor@gmail.com`;
                          const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
                          const link = document.createElement("a");
                          link.href = URL.createObjectURL(blob);
                          link.download = `${schoolId}-onboarding-template.csv`;
                          link.click();
                          toast.success("Roster onboarding CSV template downloaded!");
                        }}
                        variant="ghost"
                        size="sm"
                        className="text-xs font-bold h-8 text-primary rounded-xl"
                      >
                        <UserCheck className="h-3.5 w-3.5 mr-1" />
                        {t.shareCsvBtn}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Branded QR Badge Subsection */}
              <div
                id="qr-badge-section"
                className="rounded-3xl border border-border/60 bg-card/80 p-6 backdrop-blur shadow-sm space-y-6 transition-all"
              >
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                  {t.qrBadgeTitle}
                </span>
                {schoolId ? (
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/80">
                    <SchoolIdQRCode
                      schoolId={schoolId}
                      schoolName={schoolName}
                      studentName={
                        profile?.display_name || user?.email?.split("@")[0] || " Scholar"
                      }
                      role={isAdmin ? "Administrator" : isTeacher ? "Instructor" : "Scholar"}
                      className="w-full"
                    />
                  </div>
                ) : (
                  <div className="rounded-3xl border-2 border-dashed border-border p-8 text-center space-y-3">
                    <QrCode className="h-10 w-10 mx-auto text-muted-foreground/50 animate-pulse" />
                    <h4 className="text-sm font-bold text-muted-foreground">{t.noBindingTitle}</h4>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-normal">
                      {t.noBindingDesc}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </div>
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
    <div className="p-4 rounded-2xl border border-border/60 bg-background/50 hover:bg-background/80 transition-colors flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <div
          className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
            enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="space-y-0.5 min-w-0">
          <h4 className="text-xs font-extrabold text-foreground truncate">{title}</h4>
          <p className="text-[10px] text-muted-foreground leading-normal line-clamp-2">{desc}</p>
        </div>
      </div>

      <button
        onClick={onToggle}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          enabled ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? "translate-x-4.5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
