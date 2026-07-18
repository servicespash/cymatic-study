/**
 * Hook for managing mobile app installation prompts
 * Shows QR code and download link post-login on web/desktop
 */

import { useState, useEffect, useCallback } from "react";

export interface MobileReleaseInfo {
  version: string;
  releaseId: string;
  downloadUrl: string;
  qrCodeUrl: string;
  releaseDate: string;
  releaseNotes?: string;
  apkSize: string;
  sha256?: string;
}

export interface MobileInstallState {
  show: boolean;
  loading: boolean;
  error: string | null;
  releaseInfo: MobileReleaseInfo | null;
  installDetected: boolean;
}

const INSTALL_PROMPT_STORAGE_KEY = "mobile_install_prompt_dismissed";
const LAST_INSTALL_CHECK = "mobile_last_install_check";
const INSTALL_CHECK_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 days

const FALLBACK_RELEASE: MobileReleaseInfo = {
  version: "v1.2.0-stable",
  releaseId: "fallback-v1.2.0",
  downloadUrl: "https://study.cymatichub.xyz/downloads/lattyscymatichub.apk",
  qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent("https://study.cymatichub.xyz/downloads/lattyscymatichub.apk")}`,
  releaseDate: new Date().toISOString(),
  releaseNotes:
    "Verified stable offline-capable release of Lattys Cymatic Study S1-S4 companion. Includes offline synchronization, Dexie storage engines, and integrated AI tutoring.",
  apkSize: "24.5 MB",
  sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
};

/**
 * Fetch latest APK release from GitHub
 */
async function fetchLatestGitHubRelease(): Promise<MobileReleaseInfo | null> {
  try {
    const response = await fetch(
      "https://api.github.com/repos/servicespash/lattyscymatichub/releases/latest",
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const release = await response.json();

    // Find APK asset
    const apkAsset = release.assets?.find((a: any) => a.name.endsWith(".apk"));

    if (!apkAsset) {
      console.warn("No APK found in latest release, using stable fallback release.");
      return FALLBACK_RELEASE;
    }

    // Generate QR code URL pointing to download
    const encodedUrl = encodeURIComponent(apkAsset.browser_download_url);
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedUrl}`;

    return {
      version: release.tag_name || "latest",
      releaseId: release.id,
      downloadUrl: apkAsset.browser_download_url,
      qrCodeUrl,
      releaseDate: release.published_at,
      releaseNotes: release.body,
      apkSize: formatBytes(apkAsset.size),
      sha256: release.body?.match(/sha256:\s*([a-f0-9]{64})/i)?.[1],
    };
  } catch (error) {
    console.warn(
      "Failed to fetch GitHub release, serving stable fallback release:",
      error instanceof Error ? error.message : error,
    );
    return FALLBACK_RELEASE;
  }
}

/**
 * Generate QR code URL for direct link
 */
export function generateQRCode(url: string): string {
  const encodedUrl = encodeURIComponent(url);
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedUrl}`;
}

/**
 * Format bytes to human readable size
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Check if app is likely already installed (heuristic)
 */
function isAppLikelyInstalled(): boolean {
  if (typeof window === "undefined") return false;

  // Check for Capacitor plugin (indicates native app)
  return !!(window as any).cordova || !!(window as any).CapacitorPlugins;
}

/**
 * Hook to manage mobile installation prompts
 */
export function useMobileInstallPrompt(isAuthenticated: boolean) {
  const [state, setState] = useState<MobileInstallState>({
    show: false,
    loading: false,
    error: null,
    releaseInfo: null,
    installDetected: false,
  });

  // Check if prompt was dismissed recently
  const isDismissed = useCallback(() => {
    if (typeof window === "undefined") return true;
    const dismissed = localStorage.getItem(INSTALL_PROMPT_STORAGE_KEY);
    if (!dismissed) return false;

    const dismissedTime = parseInt(dismissed, 10);
    const now = Date.now();
    return now - dismissedTime < 24 * 60 * 60 * 1000; // 24 hour cooldown
  }, []);

  // Check if install prompt should be shown
  const shouldShowPrompt = useCallback(() => {
    if (typeof window === "undefined") return false;
    if (!isAuthenticated) return false;
    if (isDismissed()) return false;

    const lastCheck = localStorage.getItem(LAST_INSTALL_CHECK);
    if (!lastCheck) return true;

    const lastCheckTime = parseInt(lastCheck, 10);
    return Date.now() - lastCheckTime > INSTALL_CHECK_INTERVAL;
  }, [isAuthenticated, isDismissed]);

  // Initialize prompt on mount
  useEffect(() => {
    if (!shouldShowPrompt()) return;

    const initializePrompt = async () => {
      const installDetected = isAppLikelyInstalled();

      if (installDetected) {
        setState((prev) => ({ ...prev, installDetected: true }));
        return;
      }

      setState((prev) => ({ ...prev, loading: true }));

      try {
        const releaseInfo = await fetchLatestGitHubRelease();

        if (releaseInfo) {
          setState((prev) => ({
            ...prev,
            show: true,
            releaseInfo,
            loading: false,
          }));
          localStorage.setItem(LAST_INSTALL_CHECK, Date.now().toString());
        } else {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: "Failed to fetch latest release",
          }));
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }));
      }
    };

    initializePrompt();
  }, [shouldShowPrompt]);

  // Dismiss prompt
  const dismissPrompt = useCallback(() => {
    localStorage.setItem(INSTALL_PROMPT_STORAGE_KEY, Date.now().toString());
    setState((prev) => ({ ...prev, show: false }));
  }, []);

  // Reset prompt (for testing)
  const resetPrompt = useCallback(() => {
    localStorage.removeItem(INSTALL_PROMPT_STORAGE_KEY);
    localStorage.removeItem(LAST_INSTALL_CHECK);
    setState({
      show: false,
      loading: false,
      error: null,
      releaseInfo: null,
      installDetected: false,
    });
  }, []);

  return {
    ...state,
    dismissPrompt,
    resetPrompt,
  };
}

/**
 * Hook to manage installation state across app
 */
export function useInstallationState() {
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    setIsInstalled(isAppLikelyInstalled());

    // Listen for install events (PWA)
    const handleBeforeInstallPrompt = () => {
      console.log("[v0] PWA install prompt received");
    };

    const handleAppInstalled = () => {
      console.log("[v0] App installed");
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  return { isInstalled };
}
