import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/dashboard/educators")({
  beforeLoad: () => {
    throw redirect({ to: "/developer-console" });
  },
  component: () => null,
});
