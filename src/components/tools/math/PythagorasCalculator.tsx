import React, { useState } from "react";
import { Triangle } from "lucide-react";

const PythagorasCalculator: React.FC = () => {
  const [a, setA] = useState<string>("");
  const [b, setB] = useState<string>("");
  const [c, setC] = useState<string>("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculate = () => {
    setError(null);
    setResult(null);

    const av = parseFloat(a),
      bv = parseFloat(b),
      cv = parseFloat(c);
    const filled = [a, b, c].filter((x) => x !== "").length;

    if (filled < 2) {
      setError("Enter at least two values.");
      return;
    }

    if (a && b && !c) {
      setResult(`c = ${Math.sqrt(av ** 2 + bv ** 2).toFixed(4)}`);
    } else if (a && c && !b) {
      if (cv <= av) setError("Hypotenuse must be longer than side a.");
      else setResult(`b = ${Math.sqrt(cv ** 2 - av ** 2).toFixed(4)}`);
    } else if (b && c && !a) {
      if (cv <= bv) setError("Hypotenuse must be longer than side b.");
      else setResult(`a = ${Math.sqrt(cv ** 2 - bv ** 2).toFixed(4)}`);
    } else {
      setError("Leave one field empty to calculate it.");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-math/10 text-math">
          <Triangle className="h-5 w-5" />
        </div>
        <h3 className="font-semibold text-foreground">Pythagoras Solver</h3>
      </div>

      <div className="mb-6 space-y-3">
        <p className="text-xs text-muted-foreground">Calculates sides of a right-angled triangle</p>
        <div className="rounded-lg bg-muted/50 p-3 text-center font-serif text-[13px] text-foreground italic">
          a² + b² = c²
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Side a
          </label>
          <input
            type="number"
            value={a}
            onChange={(e) => setA(e.target.value)}
            placeholder="3"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-math/50 transition-all"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Side b
          </label>
          <input
            type="number"
            value={b}
            onChange={(e) => setB(e.target.value)}
            placeholder="4"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-math/50 transition-all"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Hyp (c)
          </label>
          <input
            type="number"
            value={c}
            onChange={(e) => setC(e.target.value)}
            placeholder="5"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-math/50 transition-all"
          />
        </div>
      </div>

      <button
        onClick={calculate}
        className="mt-6 w-full rounded-xl bg-math py-3 text-sm font-bold text-primary-foreground shadow-glow hover:opacity-90 active:scale-95 transition-all"
      >
        Calculate Missing Side
      </button>

      {error && (
        <div className="mt-4 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-center text-xs font-bold text-destructive">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4 rounded-lg bg-math/10 border border-math/20 p-4 animate-in fade-in slide-in-from-top-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-math mb-1">Result</p>
          <div className="flex items-center justify-center">
            <span className="text-2xl font-black text-math font-mono">{result}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PythagorasCalculator;
