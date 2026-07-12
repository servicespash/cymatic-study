import React, { useState } from "react";
import { Calculator } from "lucide-react";

const QuadraticSolver: React.FC = () => {
  const [a, setA] = useState<string>("");
  const [b, setB] = useState<string>("");
  const [c, setC] = useState<string>("");
  const [roots, setRoots] = useState<
    { x1: string; x2: string; type: string } | { error: string } | null
  >(null);

  const calculateRoots = () => {
    const aVal = parseFloat(a);
    const bVal = parseFloat(b);
    const cVal = parseFloat(c);

    if (isNaN(aVal) || isNaN(bVal) || isNaN(cVal)) {
      setRoots({ error: "Please enter valid numbers for a, b, and c." });
      return;
    }
    if (aVal === 0) {
      setRoots({ error: "Coefficient 'a' cannot be zero (not quadratic)." });
      return;
    }

    const discriminant = bVal * bVal - 4 * aVal * cVal;

    if (discriminant < 0) {
      const realPart = (-bVal / (2 * aVal)).toFixed(4);
      const imagPart = (Math.sqrt(-discriminant) / (2 * aVal)).toFixed(4);
      setRoots({
        x1: `${realPart} + ${imagPart}i`,
        x2: `${realPart} - ${imagPart}i`,
        type: "Imaginary (Complex) Roots",
      });
    } else if (discriminant === 0) {
      const x = (-bVal / (2 * aVal)).toFixed(4);
      setRoots({ x1: x, x2: x, type: "Real & Equal Roots" });
    } else {
      const x1 = ((-bVal + Math.sqrt(discriminant)) / (2 * aVal)).toFixed(4);
      const x2 = ((-bVal - Math.sqrt(discriminant)) / (2 * aVal)).toFixed(4);
      setRoots({ x1, x2, type: "Real & Distinct Roots" });
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-math/10 text-math">
          <Calculator className="h-5 w-5" />
        </div>
        <h3 className="font-semibold text-foreground">Quadratic Solver</h3>
      </div>

      <div className="mb-6 space-y-3">
        <p className="text-xs text-muted-foreground">Solves ax² + bx + c = 0</p>
        <div className="rounded-lg bg-muted/50 p-3 text-center font-serif italic text-foreground">
          x = <span className="border-b border-foreground pb-0.5">-b ± √(b² - 4ac)</span>
          <br />
          <span className="relative -top-1 ml-4 block text-[10px] leading-none">2a</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            a
          </label>
          <input
            type="number"
            value={a}
            onChange={(e) => setA(e.target.value)}
            placeholder="1"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-math/50 transition-all"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            b
          </label>
          <input
            type="number"
            value={b}
            onChange={(e) => setB(e.target.value)}
            placeholder="5"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-math/50 transition-all"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            c
          </label>
          <input
            type="number"
            value={c}
            onChange={(e) => setC(e.target.value)}
            placeholder="6"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-math/50 transition-all"
          />
        </div>
      </div>

      <button
        onClick={calculateRoots}
        className="mt-6 w-full rounded-xl bg-math py-3 text-sm font-bold text-primary-foreground shadow-glow hover:opacity-90 active:scale-95 transition-all"
      >
        Solve Equation
      </button>

      {roots && "error" in roots ? (
        <div className="mt-4 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-center text-xs font-bold text-destructive">
          {roots.error}
        </div>
      ) : roots ? (
        <div className="mt-4 space-y-2">
          <div className="rounded-lg bg-math/10 border border-math/20 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-math mb-3">
              {(roots as any).type}
            </p>
            <div className="grid gap-2 font-mono">
              <div className="flex items-center justify-between border-b border-math/10 pb-2">
                <span className="text-xs text-muted-foreground italic">x₁</span>
                <span className="text-lg font-black text-math">{(roots as any).x1}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground italic">x₂</span>
                <span className="text-lg font-black text-math">{(roots as any).x2}</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default QuadraticSolver;
