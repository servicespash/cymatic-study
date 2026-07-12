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

  // Mock Preview Mode States
  const [isMockPreview, setIsMockPreview] = useState(false);
  const [mockRole, setMockRoleState] = useState<"student" | "teacher" | "admin">("student");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    // Check if mock preview is currently active
    const isMockActive = localStorage.getItem("mock_preview_active") === "true";
    const savedRole =
      (localStorage.getItem("mock_preview_role") as "student" | "teacher" | "admin") || "student";
    const startTimeStr = localStorage.getItem("mock_preview_start");

    if (isMockActive && startTimeStr) {
      const startTime = parseInt(startTimeStr, 10);
      const elapsed = Date.now() - startTime;
      const fiveMinutesMs = 5 * 60 * 1000;

      if (elapsed < fiveMinutesMs) {
        setIsMockPreview(true);
        setMockRoleState(savedRole);
        setTimeLeft(Math.ceil((fiveMinutesMs - elapsed) / 1000));
        setLoading(false);
        return;
      } else {
        // Expired
        localStorage.removeItem("mock_preview_active");
        localStorage.removeItem("mock_preview_role");
        localStorage.removeItem("mock_preview_start");
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
    const checkMock = () => {
      const isMockActive = localStorage.getItem("mock_preview_active") === "true";
      const savedRole =
        (localStorage.getItem("mock_preview_role") as "student" | "teacher" | "admin") || "student";
      if (isMockActive && !isMockPreview) {
        setIsMockPreview(true);
        setMockRoleState(savedRole);
        setTimeLeft(300); // 5 minutes fresh
        setLoading(false);
      }
    };

    window.addEventListener("storage", checkMock);
    const interval = setInterval(checkMock, 1500);
    return () => {
      window.removeEventListener("storage", checkMock);
      clearInterval(interval);
    };
  }, [isMockPreview]);

  // Handle Mock Countdown
  useEffect(() => {
    if (!isMockPreview) return;

    const timer = setInterval(() => {
      const startTimeStr = localStorage.getItem("mock_preview_start");
      if (!startTimeStr) return;
      const startTime = parseInt(startTimeStr, 10);
      const elapsed = Date.now() - startTime;
      const fiveMinutesMs = 5 * 60 * 1000;

      if (elapsed >= fiveMinutesMs) {
        clearInterval(timer);
        signOut();
        toast.error("⏱️ Guest Preview Expired", {
          description:
            "Your 5-minute guest preview session has ended. Please sign in or register an account to keep your progress!",
          duration: 8000,
        });
      } else {
        setTimeLeft(Math.ceil((fiveMinutesMs - elapsed) / 1000));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isMockPreview]);

  useEffect(() => {
    if (!user || typeof window === "undefined" || isMockPreview) return;
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
  }, [user, isMockPreview]);

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
    if (isMockPreview) {
      localStorage.removeItem("mock_preview_active");
      localStorage.removeItem("mock_preview_role");
      localStorage.removeItem("mock_preview_start");
      setIsMockPreview(false);
      setSession(null);
      setUser(null);
      setProfile(null);
      toast.info("Signed out of Guest Preview mode.");
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    } else {
      await supabase.auth.signOut();
    }
  };

  const setMockRole = (role: "student" | "teacher" | "admin") => {
    setMockRoleState(role);
    localStorage.setItem("mock_preview_role", role);
    toast.success(`Switched role to ${role.toUpperCase()} (Guest Preview)`);
  };

  // Determine actual roles based on either mock preview state or actual DB profile
  const finalRole = isMockPreview ? mockRole : profile?.role || "";
  const isInstitutional = isMockPreview ? mockRole === "admin" : !!profile?.org_id;
  const isStudent = finalRole === "student" || (!finalRole && isInstitutional);
  const isTeacher = finalRole === "teacher" || finalRole === "independent_teacher";
  const isAdmin = finalRole === "admin" || finalRole === "school_admin";

  const guestUser: User = {
    id: "mock-user-123",
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
    access_token: "mock-jwt-token",
    token_type: "bearer",
    expires_in: 3600,
    refresh_token: "mock-refresh-token",
    user: guestUser,
  };

  const guestProfile: UserProfile = {
    user_id: "mock-user-123",
    display_name: "Guest Scholar",
    avatar_url: null,
    role: mockRole,
    org_id: mockRole === "admin" ? "mock-org-1" : null,
    teacher_license_id: null,
    full_name: "Guest Scholar",
  };

  const value: AuthCtx = {
    user: isMockPreview ? guestUser : user,
    session: isMockPreview ? guestSession : session,
    loading,
    profile: isMockPreview ? guestProfile : profile,
    isInstitutional,
    isStudent,
    isTeacher,
    isAdmin,
    signOut,
    isMockPreview,
    setMockRole,
    mockRole,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
