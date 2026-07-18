import React, { useState } from "react";
import { BarChart3 } from "lucide-react";

const StatisticsCalculator: React.FC = () => {
  const [input, setInput] = useState<string>("");
  const [stats, setStats] = useState<{
    mean: string;
    median: string;
    mode: string;
    range: string;
    count: number;
    sorted: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculate = () => {
    setError(null);
    setStats(null);

    if (!input.trim()) {
      setError("Please enter some numbers.");
      return;
    }

    // Split by comma or space and parse numbers
    const numbers = input
      .split(/[\s,]+/)
      .map((x) => x.trim())
      .filter((x) => x !== "")
      .map((x) => parseFloat(x))
      .filter((x) => !isNaN(x));

    if (numbers.length === 0) {
      setError("No valid numbers found. Use commas or spaces to separate values.");
      return;
    }

    const count = numbers.length;
    const sorted = [...numbers].sort((a, b) => a - b);

    // Mean
    const sum = sorted.reduce((acc, x) => acc + x, 0);
    const mean = sum / count;

    // Median
    let median = 0;
    const mid = Math.floor(count / 2);
    if (count % 2 === 0) {
      median = (sorted[mid - 1] + sorted[mid]) / 2;
    } else {
      median = sorted[mid];
    }

    // Mode
    const freq: Record<number, number> = {};
    let maxFreq = 0;
    sorted.forEach((n) => {
      freq[n] = (freq[n] || 0) + 1;
      if (freq[n] > maxFreq) {
        maxFreq = freq[n];
      }
    });

    const modes = Object.entries(freq)
      .filter(([_, f]) => f === maxFreq)
      .map(([n, _]) => parseFloat(n));

    let modeStr = "";
    if (maxFreq === 1 && count > 1) {
      modeStr = "None (All unique)";
    } else {
      modeStr = modes.join(", ") + ` (Freq: ${maxFreq})`;
    }

    // Range
    const min = sorted[0];
    const max = sorted[count - 1];
    const range = max - min;

    setStats({
      mean: mean.toFixed(4),
      median: median.toFixed(4),
      mode: modeStr,
      range: range.toString(),
      count,
      sorted: sorted.join(", "),
    });
  };

  const handleClear = () => {
    setInput("");
    setStats(null);
    setError(null);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-math/10 text-math">
          <BarChart3 className="h-5 w-5" />
        </div>
        <h3 className="font-semibold text-foreground">Statistics Calculator</h3>
      </div>

      <div className="mb-6 space-y-3">
        <p className="text-xs text-muted-foreground">
          Calculates central tendency metrics from a set of data values.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Data Values (separated by commas or spaces)
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. 12, 15, 12, 17, 20, 22, 15, 12"
            rows={3}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-math/50 transition-all font-mono"
          />
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
          Analyze Data
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-center text-xs font-bold text-destructive">
          {error}
        </div>
      )}

      {stats && (
        <div className="mt-4 space-y-3 rounded-lg bg-math/5 border border-math/10 p-4 animate-in fade-in slide-in-from-top-2 text-sm">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sorted Data:</span>
            <p className="font-mono text-xs text-foreground font-semibold bg-muted/30 p-2 rounded-md mt-1">{stats.sorted}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="p-2 bg-math/10 border border-math/20 rounded-md">
              <p className="text-[10px] text-muted-foreground font-mono uppercase">Mean (Average)</p>
              <p className="font-bold text-math font-mono text-base">{stats.mean}</p>
            </div>
            <div className="p-2 bg-math/10 border border-math/20 rounded-md">
              <p className="text-[10px] text-muted-foreground font-mono uppercase">Median (Middle)</p>
              <p className="font-bold text-math font-mono text-base">{stats.median}</p>
            </div>
            <div className="p-2 bg-math/10 border border-math/20 rounded-md col-span-2">
              <p className="text-[10px] text-muted-foreground font-mono uppercase">Mode (Most Frequent)</p>
              <p className="font-bold text-math font-mono text-base">{stats.mode}</p>
            </div>
            <div className="p-2 bg-math/10 border border-math/20 rounded-md">
              <p className="text-[10px] text-muted-foreground font-mono uppercase">Range (Max - Min)</p>
              <p className="font-bold text-math font-mono text-base">{stats.range}</p>
            </div>
            <div className="p-2 bg-math/10 border border-math/20 rounded-md">
              <p className="text-[10px] text-muted-foreground font-mono uppercase">Count (N)</p>
              <p className="font-bold text-math font-mono text-base">{stats.count}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatisticsCalculator;
