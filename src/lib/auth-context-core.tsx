import { createContext, useContext } from "react";
import type { Session, User } from "@supabase/supabase-js";

export interface UserProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string | null;
  org_id: string | null;
  teacher_license_id: string | null;
  full_name: string | null;
}

export type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: UserProfile | null;
  isInstitutional: boolean;
  isStudent: boolean;
  isTeacher: boolean;
  isAdmin: boolean;
  isGuestMode: boolean;
  signOut: () => Promise<void>;
};

export const Ctx = createContext<AuthCtx>({
  user: null,
  session: null,
  loading: true,
  profile: null,
  isInstitutional: false,
  isStudent: false,
  isTeacher: false,
  isAdmin: false,
  isGuestMode: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(Ctx);
