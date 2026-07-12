import { generateVectorPdf, safeFilename } from "@/lib/pdf-export";
import type { ProjectState } from "@/routes/projects";

export async function exportProjectReport(state: any, suffix = "CymaticHub") {
  const name = safeFilename(
    `${state.studentName || "student"}-${state.title || "project"}-${suffix}`,
  );
  await generateVectorPdf(state, `${name}.pdf`);
}
