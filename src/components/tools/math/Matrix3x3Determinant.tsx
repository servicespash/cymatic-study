import React, { useState } from "react";
import { Grid3X3 } from "lucide-react";

const Matrix3x3Determinant: React.FC = () => {
  const [matrix, setMatrix] = useState<string[][]>([
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
  ]);
  const [determinant, setDeterminant] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (row: number, col: number, value: string) => {
    const newMatrix = matrix.map((r, rowIndex) =>
      r.map((c, colIndex) => (rowIndex === row && colIndex === col ? value : c)),
    );
    setMatrix(newMatrix);
  };

  const calculateDeterminant = () => {
    setError(null);
    setDeterminant(null);

    const m = matrix.map((row) => row.map(Number));
    const hasNaN = m.some((row) => row.some(isNaN));
    const hasEmpty = matrix.some((row) => row.some((cell) => cell === ""));

    if (hasNaN || hasEmpty) {
      setError("Please enter valid numbers in all cells.");
      return;
    }

    const a = m[0][0],
      b = m[0][1],
      c = m[0][2];
    const d = m[1][0],
      e = m[1][1],
      f = m[1][2];
    const g = m[2][0],
      h = m[2][1],
      i = m[2][2];

    // Formula: det(A) = a(ei − fh) − b(di − fg) + c(dh − eg)
    const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
    setDeterminant(det);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-math/10 text-math">
          <Grid3X3 className="h-5 w-5" />
        </div>
        <h3 className="font-semibold text-foreground">3x3 Determinant</h3>
      </div>

      <div className="mb-6 space-y-3">
        <p className="text-xs text-muted-foreground">Calculates det(A) for a 3x3 matrix</p>
        <div className="rounded-lg bg-muted/50 p-3 text-center font-serif text-[13px] text-foreground italic">
          |A| = a(ei − fh) − b(di − fg) + c(dh − eg)
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 bg-muted/20 p-2 rounded-xl border border-border/50">
        {matrix.map((row, rowIndex) =>
          row.map((val, colIndex) => (
            <input
              key={`${rowIndex}-${colIndex}`}
              type="number"
              value={val}
              onChange={(e) => handleInputChange(rowIndex, colIndex, e.target.value)}
              className="w-full rounded-lg border border-input bg-background p-2 text-center text-sm font-mono outline-none focus:ring-2 focus:ring-math/50 transition-all"
              placeholder={String.fromCharCode(97 + rowIndex * 3 + colIndex)} // a, b, c...
            />
          )),
        )}
      </div>

      <button
        onClick={calculateDeterminant}
        className="mt-6 w-full rounded-xl bg-math py-3 text-sm font-bold text-primary-foreground shadow-glow hover:opacity-90 active:scale-95 transition-all"
      >
        Calculate Determinant
      </button>

      {error && (
        <div className="mt-4 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-center text-xs font-bold text-destructive">
          {error}
        </div>
      )}

      {determinant !== null && (
        <div className="mt-4 rounded-lg bg-math/10 border border-math/20 p-4 animate-in fade-in slide-in-from-top-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-math mb-1">
            Resulting Determinant
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-serif italic text-muted-foreground">det(A) =</span>
            <span className="text-2xl font-black text-math font-mono">{determinant}</span>
          </div>
          {determinant === 0 && (
            <p className="mt-2 text-[10px] text-amber-600 font-bold uppercase tracking-tighter">
              Singular Matrix (Non-Invertible)
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Matrix3x3Determinant;
