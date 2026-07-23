import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

export function useRoleRedirect() {
  const { user, profile, loading, isAdmin, isTeacher } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user || !profile) return;

    if (isAdmin) {
      navigate({ to: "/admin/dashboard" });
    } else if (isTeacher) {
      // Teachers can have a specific view or the main dashboard
      navigate({ to: "/dashboard" });
    } else {
      navigate({ to: "/dashboard" });
    }
  }, [user, profile, loading, isAdmin, isTeacher, navigate]);
}
