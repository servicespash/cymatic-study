import { useAuth as useCoreAuth } from "@/lib/auth-context";
import { toast } from "sonner";

/**
 * Custom useAuth Hook
 * Extends the core auth context with helpers for initiating
 * and querying the 5-minute Guest Session mode.
 */
export function useAuth() {
  const auth = useCoreAuth();

  const startGuestSession = (role: "student" | "teacher" | "admin" = "student") => {
    localStorage.setItem("guest_session_active", "true");
    localStorage.setItem("guest_session_role", role);
    localStorage.setItem("guest_session_start", Date.now().toString());

    // Dispatch events to synchronize across components
    window.dispatchEvent(new Event("storage"));

    toast.success(`🔑 5-Minute Guest Session Initiated (${role.toUpperCase()})!`, {
      description: "Enjoy full app functionality, dashboards, and quizzes as a guest.",
      duration: 5000,
    });
  };

  const endGuestSession = () => {
    localStorage.removeItem("guest_session_active");
    localStorage.removeItem("guest_session_role");
    localStorage.removeItem("guest_session_start");
    window.dispatchEvent(new Event("storage"));
  };

  return {
    ...auth,
    startGuestSession,
    endGuestSession,
  };
}
