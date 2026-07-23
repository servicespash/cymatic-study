import React, { useState } from "react";
import { Equal } from "lucide-react";

const SimultaneousEquations: React.FC = () => {
  const [a, setA] = useState<string>("");
  const [b, setB] = useState<string>("");
  const [c, setC] = useState<string>("");
  const [d, setD] = useState<string>("");
  const [e, setE] = useState<string>("");
  const [f, setF] = useState<string>("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculate = () => {
    setError(null);
    setResult(null);

    const aVal = parseFloat(a);
    const bVal = parseFloat(b);
    const cVal = parseFloat(c);
    const dVal = parseFloat(d);
    const eVal = parseFloat(e);
    const fVal = parseFloat(f);

    if (isNaN(aVal) || isNaN(bVal) || isNaN(cVal) || isNaN(dVal) || isNaN(eVal) || isNaN(fVal)) {
      setError("Please fill in all coefficients.");
      return;
    }

    // determinant D = a*e - b*d
    const D = aVal * eVal - bVal * dVal;

    if (D === 0) {
      setError(
        "No unique solution exists (Determinant is 0). Equations are parallel or coincident.",
      );
      return;
    }

    const x = (cVal * eVal - bVal * fVal) / D;
    const y = (aVal * fVal - cVal * dVal) / D;

    setResult(`x = ${x.toFixed(4)}, y = ${y.toFixed(4)}`);
  };

  const handleClear = () => {
    setA("");
    setB("");
    setC("");
    setD("");
    setE("");
    setF("");
    setResult(null);
    setError(null);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-math/10 text-math">
          <Equal className="h-5 w-5" />
        </div>
        <h3 className="font-semibold text-foreground">Simultaneous Equation Solver</h3>
      </div>

      <div className="mb-6 space-y-3">
        <p className="text-xs text-muted-foreground">
          Solves a system of linear equations of the form:
        </p>
        <div className="rounded-lg bg-muted/50 p-3 text-center font-serif text-[13px] text-foreground italic space-y-1">
          <div>Eq 1: ax + by = c</div>
          <div>Eq 2: dx + ey = f</div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <span className="text-xs font-bold text-foreground">Equation 1</span>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <div>
              <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                coeff a
              </label>
              <input
                type="number"
                value={a}
                onChange={(e) => setA(e.target.value)}
                placeholder="2"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-math/50 transition-all"
              />
            </div>
            <div>
              <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                coeff b
              </label>
              <input
                type="number"
                value={b}
                onChange={(e) => setB(e.target.value)}
                placeholder="3"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-math/50 transition-all"
              />
            </div>
            <div>
              <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                constant c
              </label>
              <input
                type="number"
                value={c}
                onChange={(e) => setC(e.target.value)}
                placeholder="8"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-math/50 transition-all"
              />
            </div>
          </div>
        </div>

        <div>
          <span className="text-xs font-bold text-foreground">Equation 2</span>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <div>
              <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                coeff d
              </label>
              <input
                type="number"
                value={d}
                onChange={(e) => setD(e.target.value)}
                placeholder="1"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-math/50 transition-all"
              />
            </div>
            <div>
              <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                coeff e
              </label>
              <input
                type="number"
                value={e}
                onChange={(e) => setE(e.target.value)}
                placeholder="-1"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-math/50 transition-all"
              />
            </div>
            <div>
              <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                constant f
              </label>
              <input
                type="number"
                value={f}
                onChange={(e) => setF(e.target.value)}
                placeholder="2"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-math/50 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        <button
          onClick={handleClear}
          className="w-1/3 rounded-xl border border-border bg-transparent py-3 text-sm font-bold text-foreground hover:bg-muted active:scale-95 transition-all"
        >
          Clear
        </button>
        <button
          onClick={calculate}
          className="flex-1 rounded-xl bg-math py-3 text-sm font-bold text-primary-foreground shadow-glow hover:opacity-90 active:scale-95 transition-all"
        >
          Solve (x, y)
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-center text-xs font-bold text-destructive">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4 rounded-lg bg-math/10 border border-math/20 p-4 animate-in fade-in slide-in-from-top-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-math mb-1">Solution</p>
          <div className="flex items-center justify-center">
            <span className="text-xl font-black text-math font-mono">{result}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimultaneousEquations;
