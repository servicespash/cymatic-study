import { createContext, useContext } from "react";
import type { Session, User } from "@supabase/supabase-js";
import type { UserRole } from "@/hooks/useUserRole";

export interface UserProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string | null;
  org_id: string | null;
  school_name: string | null;
  school_id: string | null;
  teacher_license_id: string | null;
  full_name: string | null;
  username: string | null;
  phone: string | null;
}

export type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: UserProfile | null;
  role: UserRole;
  rawRole: string;
  isInstitutional: boolean;
  isStudent: boolean;
  isTeacher: boolean;
  isAdmin: boolean;
  isGuestMode: boolean;
  schoolId: string | null;
  schoolName: string | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasRole: (allowed: UserRole | string | (UserRole | string)[]) => boolean;
  isAuthorized: (allowed: (UserRole | string)[]) => boolean;
};

export const Ctx = createContext<AuthCtx>({
  user: null,
  session: null,
  loading: true,
  profile: null,
  role: "student",
  rawRole: "student",
  isInstitutional: false,
  isStudent: true,
  isTeacher: false,
  isAdmin: false,
  isGuestMode: false,
  schoolId: null,
  schoolName: null,
  signOut: async () => {},
  refreshProfile: async () => {},
  hasRole: () => false,
  isAuthorized: () => false,
});

export const useAuth = () => useContext(Ctx);
