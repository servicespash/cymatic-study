import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Atom, Calculator, Leaf, Zap } from "lucide-react";

export const Route = createFileRoute("/tools/")({
  head: () => ({ meta: [{ title: "Study Tools — Lattys Cymatic Hub" }] }),
  component: ToolsLanding,
});

const cats = [
  {
    title: "Mathematics",
    desc: "Pythagoras, quadratic solver, area, trig",
    icon: Calculator,
    gradient: "bg-gradient-math",
    category: "math",
  },
  {
    title: "Physics",
    desc: "Ohm's law, wave speed, momentum, projectile",
    icon: Zap,
    gradient: "bg-gradient-physics",
    category: "physics",
  },
  {
    title: "Chemistry",
    desc: "Periodic table, moles, concentration",
    icon: Atom,
    gradient: "bg-gradient-chemistry",
    category: "chemistry",
  },
  {
    title: "Biology",
    desc: "BMI, heart rate, magnification, Punnett",
    icon: Leaf,
    gradient: "bg-gradient-biology",
    category: "biology",
  },
];

function ToolsLanding() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-extrabold">Study Tools</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Interactive calculators and references for every subject.
      </p>
      <div className="grid gap-5 sm:grid-cols-2">
        {cats.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.title}
              to="/tools/$category"
              params={{ category: c.category }}
              className="group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-card transition-smooth hover:-translate-y-1 hover:shadow-glow"
            >
              <div className="mb-3 flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.gradient}`}
                >
                  <Icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-bold">{c.title}</h3>
              </div>
              <p className="flex-1 text-sm text-muted-foreground">{c.desc}</p>
              <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Open tools{" "}
                <ArrowRight className="h-4 w-4 transition-smooth group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
