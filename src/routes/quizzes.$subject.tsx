import { createFileRoute } from "@tanstack/react-router";
import { QuizzesPage } from "./quizzes";

export const Route = createFileRoute("/quizzes/$subject")({
  head: ({ params }) => ({
    meta: [{ title: `${params.subject.toUpperCase()} Quizzes — Latty's Cymatic Hub` }],
  }),
  component: SubjectQuizzesPage,
});

function SubjectQuizzesPage() {
  const { subject } = Route.useParams();
  return <QuizzesPage initialSubject={subject} />;
}
