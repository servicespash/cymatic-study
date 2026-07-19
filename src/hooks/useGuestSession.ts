import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

/**
 * useGuestSession Hook
 * Tracks a 5-minute timer upon initial entry, enabling full app feature previews.
 * Once the 5-minute guest session expires, it triggers a sign-in login modal or forces redirection.
 */
export function useGuestSession() {
  const { isGuestMode, signOut } = useAuth();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (!isGuestMode) {
      setTimeLeft(null);
      setIsExpired(false);
      return;
    }

    const checkTime = () => {
      const startTimeStr = localStorage.getItem("guest_session_start");
      if (!startTimeStr) return;

      const startTime = parseInt(startTimeStr, 10);
      const elapsed = Date.now() - startTime;
      const fiveMinutesMs = 5 * 60 * 1000;

      if (elapsed >= fiveMinutesMs) {
        setIsExpired(true);
        setTimeLeft(0);
        setShowLoginModal(true);

        // Notify the user
        toast.error("⏱️ Guest Session Expired", {
          description:
            "Your 5-minute guest session has ended. Please sign in or register to keep your progress!",
          duration: 10000,
        });

        // Force sign out from guest mode
        signOut();
      } else {
        const remainingSeconds = Math.ceil((fiveMinutesMs - elapsed) / 1000);
        setTimeLeft(remainingSeconds);
        setIsExpired(false);
      }
    };

    // Initial check
    checkTime();

    // Setup interval to tick every second
    const interval = setInterval(checkTime, 1000);

    return () => clearInterval(interval);
  }, [isGuestMode, signOut]);

  const closeLoginModal = () => {
    setShowLoginModal(false);
  };

  const triggerLoginModal = () => {
    setShowLoginModal(true);
  };

  return {
    timeLeft,
    isExpired,
    isActive: !!isGuestMode,
    showLoginModal,
    triggerLoginModal,
    closeLoginModal,
  };
}
