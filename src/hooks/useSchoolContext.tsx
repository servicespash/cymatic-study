import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useUserRole, UserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";

interface SchoolContextState {
  schoolId: string | null;
  schoolName: string | null;
  userRole: UserRole | null;
  rawRole: string | null;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  orgState: any | null;
  loading: boolean;
}

const SchoolContext = createContext<SchoolContextState>({
  schoolId: null,
  schoolName: null,
  userRole: null,
  rawRole: null,
  isAdmin: false,
  isTeacher: false,
  isStudent: false,
  orgState: null,
  loading: true,
});

export function SchoolProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const {
    role,
    rawRole,
    isAdmin,
    isTeacher,
    isStudent,
    organizationId,
    schoolName: roleSchoolName,
    loading: roleLoading,
  } = useUserRole();

  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState<string | null>(null);
  const [orgState, setOrgState] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSchoolContext() {
      if (roleLoading) return;

      const finalSchoolId =
        organizationId || profile?.org_id || user?.user_metadata?.org_id || null;
      let finalSchoolName = roleSchoolName || profile?.school_name || null;
      let fetchedOrgState = null;

      if (finalSchoolId) {
        try {
          const { data, error } = await supabase
            .from("organizations")
            .select("*")
            .eq("id", finalSchoolId)
            .maybeSingle();

          if (data) {
            fetchedOrgState = data;
            if (!finalSchoolName && data.name) {
              finalSchoolName = data.name;
            }
          }
        } catch (e) {
          console.warn("Failed to fetch organization state", e);
        }
      }

      setSchoolId(finalSchoolId);
      setSchoolName(finalSchoolName);
      setOrgState(fetchedOrgState);
      setLoading(false);
    }

    loadSchoolContext();
  }, [user, profile, organizationId, roleSchoolName, roleLoading]);

  return (
    <SchoolContext.Provider
      value={{
        schoolId,
        schoolName,
        userRole: role,
        rawRole,
        isAdmin,
        isTeacher,
        isStudent,
        orgState,
        loading: loading || roleLoading,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchoolContext() {
  return useContext(SchoolContext);
}
