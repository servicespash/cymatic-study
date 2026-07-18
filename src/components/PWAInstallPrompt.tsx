import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Button } from "@/components/ui/button";
import { X, Download, Share, PlusSquare, Info } from "lucide-react";

export function PWAInstallPrompt() {
  const { isInstalled, canInstall, deferredPrompt, isIOS, isStandalone, installPWA } =
    usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Show prompt if it can be installed and hasn't been dismissed recently
    const dismissedAt = localStorage.getItem("pwa-prompt-dismissed-at");
    const isRecentlyDismissed =
      dismissedAt && Date.now() - parseInt(dismissedAt) < 1000 * 60 * 60 * 24; // 24 hours

    if (canInstall && !isInstalled && !isStandalone && !isRecentlyDismissed) {
      const timer = setTimeout(() => setIsVisible(true), 3000); // Wait 3 seconds before showing
      return () => clearTimeout(timer);
    }
  }, [canInstall, isInstalled, isStandalone]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("pwa-prompt-dismissed-at", Date.now().toString());
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      await installPWA();
      setIsVisible(false);
    } else if (isIOS) {
      setShowInstructions(true);
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 overflow-hidden">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>

            {!showInstructions ? (
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl">
                    <Download className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">
                      Install Cymatic Study
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Add to your home screen for offline study access and a faster experience.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleInstall}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                  >
                    Install Now
                  </Button>
                  <Button variant="outline" onClick={handleDismiss} className="flex-1 rounded-xl">
                    Not Now
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    How to install on iOS
                  </h3>
                </div>

                <ol className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 font-medium text-xs">
                      1
                    </span>
                    <p>
                      Tap the <Share className="w-4 h-4 inline-block mx-1 mb-1 text-blue-500" />{" "}
                      <strong>Share</strong> button in Safari toolbar.
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 font-medium text-xs">
                      2
                    </span>
                    <p>
                      Scroll down and tap{" "}
                      <PlusSquare className="w-4 h-4 inline-block mx-1 mb-1 text-slate-500" />{" "}
                      <strong>Add to Home Screen</strong>.
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 font-medium text-xs">
                      3
                    </span>
                    <p>
                      Tap <strong>Add</strong> in the top right corner.
                    </p>
                  </li>
                </ol>

                <Button
                  onClick={() => setShowInstructions(false)}
                  variant="secondary"
                  className="w-full mt-2 rounded-xl"
                >
                  Back
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
