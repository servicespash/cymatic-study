import { createContext, useContext, ReactNode } from "react";
import { useOrganization } from "@/hooks/useOrganization";
import type { UserRole } from "@/hooks/useUserRole";

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
  const org = useOrganization();

  return (
    <SchoolContext.Provider
      value={{
        schoolId: org.organizationId,
        schoolName: org.schoolName,
        userRole: org.role as UserRole,
        rawRole: org.role,
        isAdmin: org.isAdmin,
        isTeacher: org.isTeacher,
        isStudent: org.isStudent,
        orgState: {
          id: org.orgId,
          school_key: org.organizationId,
          name: org.schoolName,
        },
        loading: org.loading,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchoolContext() {
  return useContext(SchoolContext);
}
