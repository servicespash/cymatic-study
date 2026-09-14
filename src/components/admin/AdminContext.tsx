import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Organization, Stats, TeacherBottleneck } from "@/types/admin";

interface AdminContextType {
  org: Organization | null;
  stats: Stats;
  loading: boolean;
  currentOrgId: string;
  loadDashboardStats: (orgId: string) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const { user, profile } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    s1: 0, s2: 0, s3: 0, s4: 0, s5: 0, s6: 0,
    pendingSubmissions: 0,
    activeTeachers: 0,
  });

  const currentOrgId = profile?.organization_id || user?.user_metadata?.school_id || org?.id || "";

  useEffect(() => {
    if (user?.id && currentOrgId) {
        fetchOrgData();
    }
  }, [user?.id, currentOrgId]);

  const fetchOrgData = async () => {
    setLoading(true);
    // ... logic from AdminDashboard.fetchOrgData
    setLoading(false);
  };

  const loadDashboardStats = async (orgId: string) => {
    // ... logic from AdminDashboard.loadDashboardStats
  };

  return (
    <AdminContext.Provider value={{ org, stats, loading, currentOrgId, loadDashboardStats }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) throw new Error("useAdmin must be used within AdminProvider");
  return context;
};
