import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Info,
  BookOpen,
  Trophy,
  GraduationCap,
  Users,
  UserRound,
  School,
  Landmark,
  ChevronRight,
  Laptop,
  Leaf,
  Briefcase,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/curriculum")({
  head: () => ({
    meta: [
      { title: "Curriculum | Latty's Cymatic Hub" },
      {
        name: "description",
        content: "Explore the Uganda Secondary Curriculum. Designed by Isabirye Latif.",
      },
    ],
  }),
  component: SensitizationHub,
});

type Role = "student" | "parent" | "teacher" | "admin";
type Level = "lower" | "alevel";

function SensitizationHub() {
  const [activeRole, setActiveRole] = useState<Role>("student");
  const [level, setLevel] = useState<Level>("lower");

  const explainers = [
    {
      id: "20-80-rule",
      title: "The 20/80 Assessment Rule",
      icon: School,
      content:
        "Under the new NCDC 2026 guidelines, your final grade is split: 20% comes from School-Based Continuous Assessment (Projects and Topic Tests), and 80% comes from the Summative UNEB Exam at the end of S.4.",
      gradient: "from-blue-500/20 to-cyan-500/20",
    },
    {
      id: "ae-grading",
      title: "Aggregates vs. Letter Grades",
      icon: Trophy,
      content:
        "The old aggregate system is gone. Students are now graded on a Competency Scale from A (Exceptional) to E (Entry Level). This focus is on what a student CAN DO, not just what they remember.",
      gradient: "from-purple-500/20 to-pink-500/20",
    },
    {
      id: "standalone",
      title: "What is a Stand-Alone Grade?",
      icon: GraduationCap,
      content:
        "Project work now receives a 'Stand-Alone' grade on the final certificate. This showcases specific creative and practical skillsets to future employers and universities, separate from academic exam scores.",
      gradient: "from-orange-500/20 to-yellow-500/20",
    },
  ];

  const roleBenefits = {
    student: [
      "Track your 20% continuous assessment points live.",
      "Get AI-powered feedback on your project phases.",
      "Practice with competency-aligned quizzes.",
    ],
    parent: [
      "Monitor your child's project progress in real-time.",
      "Understand the new grading system with simple explainers.",
      "See descriptive competency profiles for every subject.",
    ],
    teacher: [
      "Access pre-aligned lesson notes for S.1-S.4.",
      "Automate the 20% score tracking for your students.",
      "Download marking guides for the new practical projects.",
    ],
    admin: [
      "Oversee school-wide NCDC curriculum compliance.",
      "Review teacher performance and project submission stats.",
      "Export institutional reports for UNEB registration.",
    ],
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black md:text-4xl mb-3">Curriculum Hub 🇺🇬</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Everything you need to know about Uganda's May 2026 NCDC Curriculum compliance.
        </p>
      </div>

      {/* CURRICULUM LEVEL TOGGLE */}
      <div className="mx-auto mb-8 flex max-w-md p-1 rounded-2xl bg-muted border border-border">
        {[
          { id: "lower" as Level, label: "Lower Secondary", icon: BookOpen },
          { id: "alevel" as Level, label: "Aligned A-Level", icon: GraduationCap },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setLevel(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-2 py-2.5 rounded-xl text-[10px] sm:text-xs font-bold transition min-w-0 ${
              level === t.id ? "bg-background text-primary shadow-sm" : "text-muted-foreground"
            }`}
          >
            <t.icon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{t.label}</span>
          </button>
        ))}
      </div>

      {level === "alevel" && (
        <section className="mb-10 rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10 p-6 space-y-4">
          <div>
            <h2 className="text-xl font-black mb-1">Aligned A-Level Framework</h2>
            <p className="text-xs text-muted-foreground">
              The pioneer competency cohort has transitioned to Senior Five. A-Level uses
              <strong> criterion-referenced assessment</strong>: progress is measured against
              explicit milestone standards, not ranked against peers.
            </p>
          </div>
          <h3 className="text-sm font-bold">Mandatory Cross-Cutting Themes</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                icon: Laptop,
                label: "ICT Integration & Digital Literacy",
                tone: "from-cyan-500/20 to-blue-500/20",
              },
              {
                icon: Leaf,
                label: "Climate Change & Environmental Sustainability",
                tone: "from-emerald-500/20 to-green-500/20",
              },
              {
                icon: Briefcase,
                label: "Entrepreneurship & Financial Independence",
                tone: "from-amber-500/20 to-orange-500/20",
              },
            ].map((t) => (
              <div
                key={t.label}
                className={`rounded-2xl border border-border/60 bg-gradient-to-br ${t.tone} p-4 flex flex-col min-w-0`}
              >
                <t.icon className="h-6 w-6 text-primary mb-2 shrink-0" />
                <p className="text-[11px] font-bold leading-tight break-words">{t.label}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-card border border-border p-4">
            <p className="text-xs font-bold mb-1">Criterion-Referenced Milestones</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
              <li>Demonstrates mastery of subject-specific competencies</li>
              <li>Applies cross-cutting themes in projects and papers</li>
              <li>Tracks progress against published rubrics, not classmates</li>
            </ul>
          </div>
        </section>
      )}

      {/* EXPLAINER GRID */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mb-12">
        {explainers.map((item) => (
          <div
            key={item.id}
            className={`rounded-3xl border border-border/50 bg-gradient-to-br ${item.gradient} p-6 shadow-sm hover:shadow-md transition-all flex flex-col min-w-0`}
          >
            <item.icon className="h-8 w-8 text-primary mb-4 shrink-0" />
            <h3 className="font-bold text-lg mb-2 leading-tight">{item.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed break-words">
              {item.content}
            </p>
          </div>
        ))}
      </div>

      {/* ROLE-BASED VIEWS */}
      <section className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-glow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-xl font-bold">Why it matters for you</h2>
            <p className="text-sm text-muted-foreground">
              Select your role to see tailored benefits.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex p-1 bg-muted rounded-xl gap-1 self-start flex-wrap">
              {[
                { id: "student", label: "Student", icon: UserRound },
                { id: "parent", label: "Parent", icon: Users },
                { id: "teacher", label: "Teacher", icon: Landmark },
                { id: "admin", label: "Admin", icon: School },
              ].map((role) => (
                <button
                  key={role.id}
                  onClick={() => setActiveRole(role.id as Role)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeRole === role.id
                      ? "bg-background text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-background/50"
                  }`}
                >
                  <role.icon className="h-3.5 w-3.5" />
                  {role.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 px-2">
              <input type="checkbox" id="indep" className="h-4 w-4 rounded border-border" />
              <label htmlFor="indep" className="text-xs font-bold text-muted-foreground">
                Operate Independently (Skip School ID)
              </label>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {roleBenefits[activeRole].map((benefit, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-4 rounded-2xl bg-muted/30 border border-border/50"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary">
                <ChevronRight className="h-4 w-4" />
              </div>
              <p className="text-sm font-medium">{benefit}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ SECTION */}
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          Frequently Asked Questions
        </h2>
        <Accordion type="single" collapsible className="w-full space-y-3">
          <AccordionItem value="item-1" className="border rounded-2xl px-4 bg-card">
            <AccordionTrigger className="hover:no-underline font-semibold py-4">
              Will these grades affect university admission?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-sm pb-4">
              Yes. Universities are moving towards holistic admissions, looking at both your
              academic A-E grades and your practical stand-alone project scores.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2" className="border rounded-2xl px-4 bg-card">
            <AccordionTrigger className="hover:no-underline font-semibold py-4">
              How do I earn the 20% points on Cymatic Hub?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-sm pb-4">
              Complete the 4-phase PBL tasks in the 'Projects' section and pass your topic-specific
              quizzes with at least 70%.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
