import { useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Ctx, type AuthCtx, type UserProfile } from "./auth-context-core";
import { toast } from "sonner";

const REFERRAL_STORAGE_KEY = "cymatic_signup_referral_code";

export { useAuth } from "./auth-context-core";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Guest Session Mode States
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [guestRole, setGuestRoleState] = useState<"student" | "teacher" | "admin">("student");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    // Check if guest session is currently active
    const isGuestActive = localStorage.getItem("guest_session_active") === "true";
    const savedRole =
      (localStorage.getItem("guest_session_role") as "student" | "teacher" | "admin") || "student";
    const startTimeStr = localStorage.getItem("guest_session_start");

    if (isGuestActive && startTimeStr) {
      const startTime = parseInt(startTimeStr, 10);
      const elapsed = Date.now() - startTime;
      const fiveMinutesMs = 5 * 60 * 1000;

      if (elapsed < fiveMinutesMs) {
        setIsGuestMode(true);
        setGuestRoleState(savedRole);
        setTimeLeft(Math.ceil((fiveMinutesMs - elapsed) / 1000));
        setLoading(false);
        return;
      } else {
        // Expired
        localStorage.removeItem("guest_session_active");
        localStorage.removeItem("guest_session_role");
        localStorage.removeItem("guest_session_start");
      }
    }

    console.log("AuthProvider: Initializing standard flow...");

    // 1. Set up listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      console.log("AuthProvider: Auth state changed:", _event, !!s?.user);
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    // 2. Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      console.log("AuthProvider: Initial session found:", !!initialSession);
      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        fetchProfile(initialSession.user.id);
      } else {
        console.log("AuthProvider: No initial session, setting loading false");
        setLoading(false);
      }
    });

    return () => {
      console.log("AuthProvider: Unsubscribing...");
      subscription.unsubscribe();
    };
  }, []);

  // Listen to changes in localStorage from other tabs or actions
  useEffect(() => {
    const checkGuest = () => {
      const isGuestActive = localStorage.getItem("guest_session_active") === "true";
      const savedRole =
        (localStorage.getItem("guest_session_role") as "student" | "teacher" | "admin") || "student";
      if (isGuestActive && !isGuestMode) {
        setIsGuestMode(true);
        setGuestRoleState(savedRole);
        setTimeLeft(300); // 5 minutes fresh
        setLoading(false);
      }
    };

    window.addEventListener("storage", checkGuest);
    const interval = setInterval(checkGuest, 1500);
    return () => {
      window.removeEventListener("storage", checkGuest);
      clearInterval(interval);
    };
  }, [isGuestMode]);

  // Handle Guest Countdown
  useEffect(() => {
    if (!isGuestMode) return;

    const timer = setInterval(() => {
      const startTimeStr = localStorage.getItem("guest_session_start");
      if (!startTimeStr) return;
      const startTime = parseInt(startTimeStr, 10);
      const elapsed = Date.now() - startTime;
      const fiveMinutesMs = 5 * 60 * 1000;

      if (elapsed >= fiveMinutesMs) {
        clearInterval(timer);
        signOut();
        toast.error("⏱️ Guest Session Expired", {
          description:
            "Your 5-minute guest session has ended. Please sign in or register an account to keep your progress!",
          duration: 8000,
        });
      } else {
        setTimeLeft(Math.ceil((fiveMinutesMs - elapsed) / 1000));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isGuestMode]);

  useEffect(() => {
    if (!user || typeof window === "undefined" || isGuestMode) return;
    const pendingReferralCode = window.localStorage.getItem(REFERRAL_STORAGE_KEY);
    if (!pendingReferralCode?.trim()) return;

    const applyPendingReferral = async () => {
      try {
        await supabase.rpc("record_referral", {
          referrer_code: pendingReferralCode.trim(),
        });
      } catch (err) {
        console.warn("Failed to apply stored referral code:", err);
      } finally {
        window.localStorage.removeItem(REFERRAL_STORAGE_KEY);
      }
    };

    void applyPendingReferral();
  }, [user, isGuestMode]);

  const fetchProfile = async (userId: string) => {
    try {
      console.log("Fetching profile for userId:", userId);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Profile fetch error:", error);
      } else {
        console.log("Profile fetch result:", data);
        if (data) {
          setProfile(data);
        }
      }
    } catch (err) {
      console.error("Profile fetch exception:", err);
    } finally {
      console.log("Setting loading to false");
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (isGuestMode) {
      localStorage.removeItem("guest_session_active");
      localStorage.removeItem("guest_session_role");
      localStorage.removeItem("guest_session_start");
      setIsGuestMode(false);
      setSession(null);
      setUser(null);
      setProfile(null);
      toast.info("Signed out of Guest Session mode.");
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    } else {
      await supabase.auth.signOut();
    }
  };

  const setGuestRole = (role: "student" | "teacher" | "admin") => {
    setGuestRoleState(role);
    localStorage.setItem("guest_session_role", role);
    toast.success(`Switched role to ${role.toUpperCase()} (Guest Session)`);
  };

  // Determine actual roles based on either guest session state or actual DB profile
  const finalRole = isGuestMode ? guestRole : profile?.role || "";
  const isInstitutional = isGuestMode ? guestRole === "admin" : !!profile?.org_id;
  const isStudent = finalRole === "student" || (!finalRole && isInstitutional);
  const isTeacher = finalRole === "teacher" || finalRole === "independent_teacher";
  const isAdmin = finalRole === "admin" || finalRole === "school_admin";

  const guestUser: User = {
    id: "guest-user",
    app_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
    email: "guest@cymatichub.xyz",
    user_metadata: { display_name: "Guest Scholar" },
    confirmed_at: new Date().toISOString(),
    phone: "",
    role: "authenticated",
    updated_at: new Date().toISOString(),
  };

  const guestSession: Session = {
    access_token: "guest-jwt-token",
    token_type: "bearer",
    expires_in: 3600,
    refresh_token: "guest-refresh-token",
    user: guestUser,
  };

  const guestProfile: UserProfile = {
    user_id: "guest-user",
    display_name: "Guest Scholar",
    avatar_url: null,
    role: guestRole,
    org_id: guestRole === "admin" ? "guest-org-1" : null,
    teacher_license_id: null,
    full_name: "Guest Scholar",
  };

  const value: AuthCtx = {
    user: isGuestMode ? guestUser : user,
    session: isGuestMode ? guestSession : session,
    loading,
    profile: isGuestMode ? guestProfile : profile,
    isInstitutional,
    isStudent,
    isTeacher,
    isAdmin,
    signOut,
    isGuestMode,
    setGuestRole,
    guestRole,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
