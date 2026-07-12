import { useAuth as useCoreAuth } from "@/lib/auth-context";
import { toast } from "sonner";

/**
 * Custom useAuth Hook
 * Extends the core auth context with helpers for initiating
 * and querying the 5-minute Guest Preview mode.
 */
export function useAuth() {
  const auth = useCoreAuth();

  const startMockPreview = (role: "student" | "teacher" | "admin" = "student") => {
    localStorage.setItem("mock_preview_active", "true");
    localStorage.setItem("mock_preview_role", role);
    localStorage.setItem("mock_preview_start", Date.now().toString());

    // Dispatch events to synchronize across components
    window.dispatchEvent(new Event("storage"));

    toast.success(`🔑 5-Minute Guest Preview Initiated (${role.toUpperCase()})!`, {
      description: "Enjoy full app functionality, dashboards, and quizzes as a guest.",
      duration: 5000,
    });
  };

  const endMockPreview = () => {
    localStorage.removeItem("mock_preview_active");
    localStorage.removeItem("mock_preview_role");
    localStorage.removeItem("mock_preview_start");
    window.dispatchEvent(new Event("storage"));
  };

  return {
    ...auth,
    startMockPreview,
    endMockPreview,
  };
}
