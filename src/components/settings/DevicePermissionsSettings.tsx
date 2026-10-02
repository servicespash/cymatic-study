import React from "react";
import { Camera, Mic, Bell, HardDrive, Globe } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { useLanguageStore, type LanguageCode } from "@/store/useLanguageStore";

interface PermissionCardProps {
  title: string;
  desc: string;
  enabled: boolean;
  icon: any;
  onToggle: () => void;
}

const PermissionCard: React.FC<PermissionCardProps> = ({
  title,
  desc,
  enabled,
  icon: Icon,
  onToggle,
}) => (
  <div className="flex items-center justify-between p-4 rounded-2xl bg-background border border-border/50 hover:border-primary/30 transition-all">
    <div className="flex items-center gap-3">
      <div
        className={`h-10 w-10 rounded-xl flex items-center justify-center ${enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h4 className="text-sm font-bold">{title}</h4>
        <p className="text-[10px] text-muted-foreground">{desc}</p>
      </div>
    </div>
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${enabled ? "bg-primary" : "bg-muted"}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  </div>
);

export const DevicePermissionsSettings: React.FC = () => {
  const { language, setLanguage, t } = useLanguageStore();

  const [cameraEnabled, setCameraEnabled] = React.useState(
    () => localStorage.getItem("perm_camera") !== "false",
  );
  const [micEnabled, setMicEnabled] = React.useState(
    () => localStorage.getItem("perm_mic") !== "false",
  );
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(
    () => localStorage.getItem("perm_notify") !== "false",
  );
  const [storageEnabled, setStorageEnabled] = React.useState(
    () => localStorage.getItem("perm_storage") !== "false",
  );
  const [autoSync, setAutoSync] = React.useState(
    () => localStorage.getItem("pref_autosync") !== "false",
  );

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

  return (
    <div className="space-y-6">
      <div
        id="device-permissions-section"
        className="rounded-3xl border border-border/60 bg-card/80 p-6 backdrop-blur shadow-sm space-y-5"
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

      <div
        id="regional-preferences-section"
        className="rounded-3xl border border-border/60 bg-card/80 p-6 backdrop-blur shadow-sm space-y-5"
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
              className="w-full rounded-xl border border-input bg-background/60 px-3.5 py-2.5 text-xs font-bold text-foreground outline-none focus:border-primary transition-all"
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
                <span className="text-[10px] text-muted-foreground">{t.autoSyncCloudSub}</span>
              </div>
              <button
                onClick={() => {
                  setAutoSync(!autoSync);
                  localStorage.setItem("pref_autosync", String(!autoSync));
                  toast.success(`Auto-sync: ${!autoSync ? "Enabled" : "Disabled"}`);
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${autoSync ? "bg-primary" : "bg-muted"}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${autoSync ? "translate-x-5" : "translate-x-0"}`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
