import { createFileRoute } from "@tanstack/react-router";
import { AuthRouteMiddleware } from "@/middlewares/auth-middleware";
import { Card, CardContent } from "@/components/ui/card";
import { TermProgressChart } from "@/components/TermProgressChart";
import { MilestoneBadges } from "@/components/MilestoneBadges";
import { ProgressDashboard } from "@/components/ProgressDashboard";

export const Route = createFileRoute("/student/progress")({
  component: () => (
    <AuthRouteMiddleware allowedRoles={["student"]}>
      <StudentProgressPage />
    </AuthRouteMiddleware>
  ),
});

function StudentProgressPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Academic Progress & Achievements</h1>
      <div className="grid gap-6">
        <TermProgressChart />
        <MilestoneBadges />
        <ProgressDashboard />
      </div>
    </div>
  );
}
