import React, { useState } from "react";
import { Compass } from "lucide-react";

const TrigonometryCalculator: React.FC = () => {
  const [val, setVal] = useState<string>("");
  const [unit, setUnit] = useState<"deg" | "rad">("deg");
  const [func, setFunc] = useState<"sin" | "cos" | "tan" | "asin" | "acos" | "atan">("sin");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculate = () => {
    setError(null);
    setResult(null);

    const v = parseFloat(val);
    if (isNaN(v)) {
      setError("Please enter a valid number.");
      return;
    }

    let res: number;
    const isInverse = func.startsWith("a");
    let input = v;

    if (!isInverse && unit === "deg") {
      input = v * (Math.PI / 180);
    }

    try {
      switch (func) {
        case "sin":
          res = Math.sin(input);
          break;
        case "cos":
          res = Math.cos(input);
          break;
        case "tan":
          if (unit === "deg" && Math.abs(v) % 180 === 90) {
            setError("Tangent is undefined for this angle.");
            return;
          }
          res = Math.tan(input);
          break;
        case "asin":
          if (v < -1 || v > 1) {
            setError("Input for asin must be between -1 and 1.");
            return;
          }
          res = Math.asin(v);
          break;
        case "acos":
          if (v < -1 || v > 1) {
            setError("Input for acos must be between -1 and 1.");
            return;
          }
          res = Math.acos(v);
          break;
        case "atan":
          res = Math.atan(v);
          break;
        default:
          return;
      }

      if (isInverse && unit === "deg") {
        res = res * (180 / Math.PI);
      }

      setResult(res.toFixed(4) + (isInverse && unit === "deg" ? "°" : ""));
    } catch (e) {
      setError("Calculation error.");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-math/10 text-math">
          <Compass className="h-5 w-5" />
        </div>
        <h3 className="font-semibold text-foreground">Trig Ratios</h3>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {(["sin", "cos", "tan", "asin", "acos", "atan"] as const).map((f) => (
          <button
            key={f}
            onClick={() => {
              setFunc(f);
              setResult(null);
            }}
            className={`rounded-md px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${func === f ? "bg-math text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {func.startsWith("a") ? "Ratio (Value)" : "Angle"}
          </label>
          <input
            type="number"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder={func.startsWith("a") ? "0.5" : "30"}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-math/50 transition-all font-mono"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Unit
          </label>
          <select
            value={unit}
            onChange={(e) => {
              setUnit(e.target.value as "deg" | "rad");
              setResult(null);
            }}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-math/50 transition-all"
          >
            <option value="deg">Degrees (°)</option>
            <option value="rad">Radians</option>
          </select>
        </div>
      </div>

      <button
        onClick={calculate}
        className="w-full rounded-xl bg-math py-3 text-sm font-bold text-primary-foreground shadow-glow hover:opacity-90 active:scale-95 transition-all"
      >
        Calculate {func}({val || "x"})
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

export default TrigonometryCalculator;
