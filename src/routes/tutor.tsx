import { createFileRoute } from "@tanstack/react-router";
import { TutorPage } from "@/components/TutorPage";
import { z } from "zod";

const tutorSearchSchema = z.object({
  prefill: z.string().optional(),
});

export const Route = createFileRoute("/tutor")({
  validateSearch: (search) => tutorSearchSchema.parse(search),
  component: TutorPage,
});
