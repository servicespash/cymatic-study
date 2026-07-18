import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, BookOpen, Dumbbell, Sparkles } from "lucide-react";
import { useState } from "react";
import { topics } from "@/data/topics";
import { topicNotes } from "@/data/notes";
import { quizQuestions } from "@/data/quizzes";
import { downloadText } from "@/lib/download";
import { subjectLabels } from "@/lib/constants";

// Tool Components
import PhysicsTools from "@/components/tools/physics/PhysicsTools";
import ChemistryTools from "@/components/tools/chemistry/ChemistryTools";
import BiologyTools from "@/components/tools/biology/BiologyTools";

// Math tools are individual files
import PythagorasCalculator from "@/components/tools/math/PythagorasCalculator";
import QuadraticSolver from "@/components/tools/math/QuadraticSolver";
import TrigonometryCalculator from "@/components/tools/math/TrigonometryCalculator";
import Matrix3x3Determinant from "@/components/tools/math/Matrix3x3Determinant";
import AreaPerimeterCalc from "@/components/tools/math/AreaPerimeterCalc";
import SimultaneousEquations from "@/components/tools/math/SimultaneousEquations";
import StatisticsCalculator from "@/components/tools/math/StatisticsCalculator";

// Export PDF Modal
import { ExportPdfModal } from "@/components/ExportPdfModal";

export const Route = createFileRoute("/tools/$category")({
  head: () => ({ meta: [{ title: "Tools — Latty's Cymatic Study" }] }),
  component: ToolCategoryPage,
});

type Subject = "math" | "physics" | "chemistry" | "biology";

function buildNotesFile(subject: Subject) {
  const subj = topics.filter((t) => t.subject === subject);
  const lines: string[] = [`# ${subjectLabels[subject]} — Notes`, ""];
  subj.forEach((t) => {
    lines.push(`## ${t.title} (S${t.level})`, t.description, "");
    if (t.formulas?.length) {
      lines.push("**Key formulas:**");
      t.formulas.forEach((f) => lines.push(`- ${f}`));
      lines.push("");
    }
    const note = topicNotes.find((n) => n.topicId === t.id);
    note?.sections.forEach((s) => lines.push(`### ${s.heading}`, s.content, ""));
    if (note?.examples?.length) {
      lines.push("**Worked examples:**");
      note.examples.forEach((ex) => lines.push(`Q: ${ex.problem}`, `A: ${ex.solution}`, ""));
    }
    lines.push("");
  });
  return lines.join("\n");
}

function buildExercisesFile(subject: Subject) {
  const subj = topics.filter((t) => t.subject === subject);
  const lines: string[] = [`# ${subjectLabels[subject]} — Exercises`, ""];
  subj.forEach((t) => {
    const qs = quizQuestions.filter((q) => q.topicId === t.id);
    if (!qs.length) return;
    lines.push(`## ${t.title} (S${t.level})`, "");
    qs.forEach((q, i) => {
      lines.push(`${i + 1}. ${q.question}`);
      q.options.forEach((o, j) => lines.push(`   ${String.fromCharCode(65 + j)}. ${o}`));
      lines.push(`   Answer: ${String.fromCharCode(65 + q.correctIndex)}`, "");
    });
  });
  return lines.join("\n");
}

function buildNotesPdfContent(subject: Subject) {
  const subj = topics.filter((t) => t.subject === subject);
  const contentList: { sectionTitle: string; body: string[] }[] = [];

  subj.forEach((t) => {
    const bodies: string[] = [];
    bodies.push(`Level: Senior ${t.level}`);
    bodies.push(`Description: ${t.description}`);
    if (t.formulas?.length) {
      bodies.push(`Key formulas: ${t.formulas.join(", ")}`);
    }
    const note = topicNotes.find((n) => n.topicId === t.id);
    note?.sections.forEach((s) => {
      bodies.push(`-- ${s.heading} --`);
      bodies.push(s.content);
    });
    if (note?.examples?.length) {
      note.examples.forEach((ex) => {
        bodies.push(`Worked Example: ${ex.problem}`);
        bodies.push(`Solution: ${ex.solution}`);
      });
    }
    contentList.push({
      sectionTitle: t.title,
      body: bodies,
    });
  });
  return contentList;
}

function buildExercisesPdfContent(subject: Subject) {
  const subj = topics.filter((t) => t.subject === subject);
  const contentList: {
    sectionTitle: string;
    body: { q: string; options?: string[]; a: string }[];
  }[] = [];

  subj.forEach((t) => {
    const qs = quizQuestions.filter((q) => q.topicId === t.id);
    if (!qs.length) return;
    const body: { q: string; options?: string[]; a: string }[] = qs.map((q) => ({
      q: q.question,
      options: q.options,
      a: q.options[q.correctIndex],
    }));
    contentList.push({
      sectionTitle: `${t.title} (S${t.level})`,
      body,
    });
  });
  return contentList;
}

function ToolCategoryPage() {
  const { category } = Route.useParams();
  const subject = category as Subject;
  const label = subjectLabels[subject] ?? category;
  const subjTopics = topics.filter((t) => t.subject === subject);

  const [isNotesPdfOpen, setIsNotesPdfOpen] = useState(false);
  const [isExercisesPdfOpen, setIsExercisesPdfOpen] = useState(false);

  const renderInteractiveTools = () => {
    switch (subject) {
      case "math":
        return (
          <div className="grid gap-6 md:grid-cols-2">
            <PythagorasCalculator />
            <QuadraticSolver />
            <TrigonometryCalculator />
            <Matrix3x3Determinant />
            <AreaPerimeterCalc />
            <SimultaneousEquations />
            <StatisticsCalculator />
          </div>
        );
      case "physics":
        return <PhysicsTools />;
      case "chemistry":
        return <ChemistryTools />;
      case "biology":
        return <BiologyTools />;
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link to="/tools" className="text-xs font-semibold text-primary hover:underline">
        ← All tools
      </Link>

      <div className="mt-2 mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-extrabold capitalize">{label} Tools</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Interactive calculators and references for {label.toLowerCase()}.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/quizzes/$subject"
            params={{ subject }}
            className="rounded-lg bg-primary/10 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
          >
            Practice Quizzes
          </Link>
          <Link
            to="/lessons"
            className="rounded-lg border border-border px-4 py-2 text-xs font-bold hover:bg-muted transition-colors"
          >
            Study Notes
          </Link>
        </div>
      </div>

      {/* INTERACTIVE TOOLS SECTION */}
      <section className="mb-12">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Interactive Calculators</h2>
        </div>
        {renderInteractiveTools()}
      </section>

      {/* DOWNLOADS SECTION */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-bold">Offline Resources</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            onClick={() => downloadText(`${subject}-notes.txt`, buildNotesFile(subject))}
            className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-5 text-left shadow-card transition-smooth hover:-translate-y-1 hover:shadow-glow"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-bold">Download Plain Notes</p>
              <p className="text-xs text-muted-foreground">Offline TXT format, S1–S4</p>
            </div>
            <Download className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
          </button>

          <button
            onClick={() => setIsNotesPdfOpen(true)}
            className="group flex items-center gap-3 rounded-2xl border border-teal-500/30 bg-teal-500/5 p-5 text-left shadow-card transition-smooth hover:-translate-y-1 hover:shadow-glow"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/15 text-teal-400">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-teal-300 flex items-center gap-1.5">
                Export Branded Notes
                <span className="text-[9px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded">
                  PDF
                </span>
              </p>
              <p className="text-xs text-teal-400/70">Verifiable layout, QR codes, S1–S4 labels</p>
            </div>
            <Download className="h-5 w-5 text-teal-400/50 group-hover:text-teal-300" />
          </button>

          <button
            onClick={() => downloadText(`${subject}-exercises.txt`, buildExercisesFile(subject))}
            className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-5 text-left shadow-card transition-smooth hover:-translate-y-1 hover:shadow-glow"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/15 text-success">
              <Dumbbell className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-bold">Download Plain Practice Book</p>
              <p className="text-xs text-muted-foreground">Offline TXT format, S1–S4</p>
            </div>
            <Download className="h-5 w-5 text-muted-foreground group-hover:text-success" />
          </button>

          <button
            onClick={() => setIsExercisesPdfOpen(true)}
            className="group flex items-center gap-3 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-5 text-left shadow-card transition-smooth hover:-translate-y-1 hover:shadow-glow"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-indigo-300 flex items-center gap-1.5">
                Export Branded Practice Book
                <span className="text-[9px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">
                  PDF
                </span>
              </p>
              <p className="text-xs text-indigo-400/70">
                Verifiable layout, QR codes, S1–S4 labels
              </p>
            </div>
            <Download className="h-5 w-5 text-indigo-400/50 group-hover:text-indigo-300" />
          </button>
        </div>
      </section>

      {/* TOPICS COVERED SECTION */}
      <section>
        <h2 className="mb-4 text-xl font-bold">Curriculum Topics</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {subjTopics.map((t) => (
            <div
              key={t.id}
              className="rounded-xl border border-border bg-card p-4 transition-smooth hover:border-primary/30"
            >
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
                Senior {t.level}
              </p>
              <p className="mt-1 font-semibold text-foreground">{t.title}</p>
              <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{t.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MODALS */}
      <ExportPdfModal
        isOpen={isNotesPdfOpen}
        onClose={() => setIsNotesPdfOpen(false)}
        title={`${label} Study Notes`}
        subject={subject}
        docType="lesson_notes"
        content={buildNotesPdfContent(subject)}
      />

      <ExportPdfModal
        isOpen={isExercisesPdfOpen}
        onClose={() => setIsExercisesPdfOpen(false)}
        title={`${label} Practice Book`}
        subject={subject}
        docType="quiz"
        content={buildExercisesPdfContent(subject)}
      />
    </div>
  );
}
