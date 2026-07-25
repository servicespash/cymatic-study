import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/student")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
