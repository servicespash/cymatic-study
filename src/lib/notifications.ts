import { toast } from "sonner";
import type { UserRole } from "@/hooks/useUserRole";

/**
 * Standardized Toast Notification System
 * Handles authentication events, role permission alerts, and user feedback.
 */

export interface NotificationOptions {
  id?: string | number;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const notifications = {
  // Authentication Success
  authSuccess: (displayName?: string, role?: UserRole | string, schoolName?: string) => {
    const roleLabel = role
      ? role.charAt(0).toUpperCase() + role.slice(1)
      : "User";
    const name = displayName || "Scholar";

    toast.success(`Welcome back, ${name}!`, {
      description: schoolName
        ? `Authenticated as ${roleLabel} • ${schoolName}`
        : `Signed in to ${roleLabel} portal successfully.`,
      duration: 4000,
    });
  },

  // Signup Success
  signUpSuccess: (email?: string, role?: string) => {
    toast.success("Account created successfully!", {
      description: email
        ? `Welcome to Lattys Cymatic Study. Initialized with ${role || "student"} credentials.`
        : "Your academic account is ready.",
      duration: 5000,
    });
  },

  // Auth Error
  authError: (error: any, options?: NotificationOptions) => {
    let message = "Authentication failed. Please check your credentials.";
    let description: string | undefined;

    if (typeof error === "string") {
      message = error;
    } else if (error?.message) {
      const raw = error.message;
      if (
        raw.toLowerCase().includes("failed to fetch") ||
        raw.toLowerCase().includes("networkerror")
      ) {
        message = "Network connection failed";
        description = "Could not reach authentication servers. Please verify your connection.";
      } else if (raw.includes("Invalid login credentials")) {
        message = "Invalid login credentials";
        description = "Please verify your username, email, or password.";
      } else if (raw.includes("Email not confirmed")) {
        message = "Email verification required";
        description = "Please confirm your email address via the link sent to your inbox.";
      } else {
        message = raw;
      }
    }

    toast.error(message, {
      description,
      id: options?.id,
      duration: options?.duration || 5000,
      action: options?.action,
    });
  },

  // Role Access Denied
  roleDenied: (
    requiredRole: string | string[],
    currentRole: string = "student",
    redirectTarget?: string,
  ) => {
    const required = Array.isArray(requiredRole)
      ? requiredRole.join(" or ")
      : requiredRole;

    toast.warning("Access Restricted", {
      description: `This section requires ${required} permissions. Your current role is "${currentRole}". Redirecting to your dashboard...`,
      duration: 4500,
    });
  },

  // Sign out
  signOutSuccess: () => {
    toast.info("Signed out successfully", {
      description: "Your session has ended securely. See you next time!",
      duration: 3000,
    });
  },

  // Session Warning
  sessionExpired: () => {
    toast.warning("Session Expired", {
      description: "Please sign in again to continue accessing your academic records.",
      duration: 5000,
    });
  },

  // General helpers
  success: (title: string, description?: string, options?: NotificationOptions) => {
    toast.success(title, {
      description,
      id: options?.id,
      duration: options?.duration || 4000,
      action: options?.action,
    });
  },

  error: (title: string, description?: string, options?: NotificationOptions) => {
    toast.error(title, {
      description,
      id: options?.id,
      duration: options?.duration || 5000,
      action: options?.action,
    });
  },

  info: (title: string, description?: string, options?: NotificationOptions) => {
    toast.info(title, {
      description,
      id: options?.id,
      duration: options?.duration || 4000,
      action: options?.action,
    });
  },

  warning: (title: string, description?: string, options?: NotificationOptions) => {
    toast.warning(title, {
      description,
      id: options?.id,
      duration: options?.duration || 4000,
      action: options?.action,
    });
  },
};

/**
 * Schedules daily discipline nudges for Capacitor Native / Web Notifications
 */
export async function scheduleDailyNudges(persona: "Adams" | "Haawa" = "Adams") {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      await LocalNotifications.cancel({ notifications: [{ id: 101 }, { id: 102 }] });
      await LocalNotifications.schedule({
        notifications: [
          {
            title: `Study Session with ${persona}`,
            body: persona === "Adams"
              ? "Focus on the target. 30 minutes of deep study elevates your standing."
              : "Keep up the momentum! Reviewing your syllabus goals today.",
            id: 101,
            schedule: { at: new Date(Date.now() + 1000 * 60 * 60 * 4) },
          },
        ],
      });
    }
  } catch (err) {
    console.warn("Could not schedule daily nudges:", err);
  }
}

export default notifications;
