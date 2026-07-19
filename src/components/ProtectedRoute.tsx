import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, isGuestMode } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user && !isGuestMode) {
      navigate({ to: "/login" });
    }
  }, [user, loading, isGuestMode, navigate]);

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-background"
        id="protected-route-loading"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user && !isGuestMode) {
    return null;
  }

  return <div id="protected-route-content">{children}</div>;
}
