import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { AuthRouteMiddleware } from "@/middlewares/auth-middleware";
import { GlobalErrorBoundary } from "@/components/GlobalErrorBoundary";
import { LayoutDashboard, GraduationCap, Users, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const location = useLocation();

  const navItems = [
    { label: "Summary", path: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Student Matrix", path: "/admin/dashboard/students", icon: GraduationCap },
    { label: "Teacher Station", path: "/admin/dashboard/teachers", icon: Users },
  ];

  return (
    <GlobalErrorBoundary fallbackTitle="Admin Dashboard Exception">
      <AuthRouteMiddleware requireAdmin>
        <div className="min-h-screen bg-background flex flex-col">
          {/* Top Navigation Header */}
          <div className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-black text-white">
                  C
                </div>
                <h2 className="text-xl font-black uppercase tracking-widest text-primary">
                  Command Node
                </h2>
              </div>

              <div className="flex overflow-x-auto gap-2 hide-scrollbar">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                        isActive
                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-white" : "text-muted-foreground"}`}
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 w-full max-w-7xl mx-auto min-w-0">
            <Outlet />
          </div>
        </div>
      </AuthRouteMiddleware>
    </GlobalErrorBoundary>
  );
}
