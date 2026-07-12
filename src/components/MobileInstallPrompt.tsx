import { useEffect, useState } from "react";
import { useMobileInstallPrompt } from "@/hooks/use-mobile-install-prompt";
import { useAuth } from "@/lib/auth-context";

/**
 * Mobile App Installation Prompt Modal
 * Shows after successful login on web/desktop platforms
 * Displays QR code and direct download link
 */
export function MobileInstallPrompt() {
  const { user } = useAuth();
  const { show, loading, error, releaseInfo, dismissPrompt, installDetected } =
    useMobileInstallPrompt(!!user);

  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    if (!releaseInfo?.downloadUrl) return;

    try {
      await navigator.clipboard.writeText(releaseInfo.downloadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  if (!show || installDetected || !releaseInfo) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Install Mobile App</h2>
          <button
            onClick={dismissPrompt}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Get the Latty&apos;s Cymatic Hub app on your mobile device for offline access and better
          learning experience.
        </p>

        {/* QR Code Section */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin">
              <svg
                className="w-8 h-8 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : releaseInfo ? (
          <>
            {/* QR Code */}
            <div className="flex justify-center mb-4">
              <div className="bg-white p-2 rounded-lg border border-gray-200">
                <img src={releaseInfo.qrCodeUrl} alt="Download QR Code" className="w-48 h-48" />
              </div>
            </div>

            {/* Version Info */}
            <div className="text-center mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Version {releaseInfo.version} • {releaseInfo.apkSize}
              </p>
            </div>

            {/* Direct Download Section */}
            <div className="space-y-3">
              {/* Direct Link Button */}
              <a
                href={releaseInfo.downloadUrl}
                download
                className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download APK
              </a>

              {/* Copy Link Button */}
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-900 dark:text-white font-semibold py-2 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16H5v-4m0-5H3m6 0h10M5 5h10m0 0V3m0 2v10m0 0l4-4m-4 4l-4-4"
                  />
                </svg>
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>

            {/* Release Notes */}
            {releaseInfo.releaseNotes && (
              <details className="mt-4 cursor-pointer">
                <summary className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                  What&apos;s New
                </summary>
                <div className="mt-2 p-2 bg-gray-50 dark:bg-slate-800 rounded text-sm text-gray-600 dark:text-gray-400 max-h-32 overflow-y-auto">
                  <p className="whitespace-pre-wrap">
                    {releaseInfo.releaseNotes.substring(0, 200)}...
                  </p>
                </div>
              </details>
            )}
          </>
        ) : null}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={dismissPrompt}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors font-medium"
          >
            Maybe Later
          </button>
        </div>

        {/* Footer Info */}
        <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-4">
          Supports Android 7.0+
        </p>
      </div>
    </div>
  );
}
