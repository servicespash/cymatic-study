import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpenText } from "lucide-react";
import { AepCurriculumIndex } from "@/components/curriculum/AepCurriculumIndex";

export const Route = createFileRoute("/aep")({
  head: () => ({
    meta: [
      { title: "AEP Curriculum Library — Cymatic Study" },
      {
        name: "description",
        content: "Browse the NCDC Accelerated Education Programme Physics and Biology syllabus index, study aids, and official source PDFs.",
      },
    ],
  }),
  component: AepCurriculumPage,
});

function AepCurriculumPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/lessons" className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted">
          <ArrowLeft className="h-4 w-4" /> Back to lessons
        </Link>
        <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground sm:text-sm">
          <BookOpenText className="h-4 w-4" /> Curriculum source library
        </span>
      </div>
      <AepCurriculumIndex standalone />
      <footer className="mx-auto max-w-7xl px-4 pb-10 pt-4 text-xs leading-6 text-muted-foreground sm:px-6 lg:px-8">
        Source material remains the property of its publisher. This index links to the official NCDC syllabi and provides separate study aids; it does not reproduce the complete source documents.
      </footer>
    </main>
  );
}
