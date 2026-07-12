import React, { useState } from "react";
import { Leaf, Heart, Droplets, Microscope, LucideIcon } from "lucide-react";

const ToolCard = ({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) => (
  <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-biology">
        <Icon className="h-5 w-5 text-primary-foreground" />
      </div>
      <h3 className="font-semibold text-foreground">{title}</h3>
    </div>
    {children}
  </div>
);

const InputField = ({
  label,
  value,
  onChange,
  placeholder,
  type = "number",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) => (
  <div>
    <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
    />
  </div>
);

const Result = ({ label, value }: { label: string; value: string | null }) => {
  if (!value) return null;
  return (
    <div className="mt-4 rounded-lg bg-biology/10 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-lg font-bold text-biology">{value}</p>
    </div>
  );
};

const Btn = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className="mt-3 w-full rounded-lg bg-biology py-2 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 shadow-sm active:scale-[0.98]"
  >
    {children}
  </button>
);

export const BMICalculator = () => {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const calc = () => {
    const w = parseFloat(weight),
      h = parseFloat(height) / 100;
    if (isNaN(w) || isNaN(h) || h === 0) return;
    const bmi = w / (h * h);
    const cat =
      bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese";
    setResult(`${bmi.toFixed(1)} — ${cat}`);
  };

  return (
    <ToolCard title="BMI Calculator" icon={Heart}>
      <p className="mb-3 text-xs text-muted-foreground">Body Mass Index = weight / height²</p>
      <div className="grid grid-cols-2 gap-3">
        <InputField label="Weight (kg)" value={weight} onChange={setWeight} placeholder="60" />
        <InputField label="Height (cm)" value={height} onChange={setHeight} placeholder="170" />
      </div>
      <Btn onClick={calc}>Calculate BMI</Btn>
      <Result label="BMI" value={result} />
    </ToolCard>
  );
};

export const HeartRateZones = () => {
  const [age, setAge] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const calc = () => {
    const a = parseFloat(age);
    if (isNaN(a)) return;
    const max = 220 - a;
    setResult(
      `Max HR: ${max} bpm | Fat Burn (60-70%): ${Math.round(max * 0.6)}-${Math.round(max * 0.7)} | Cardio (70-85%): ${Math.round(max * 0.7)}-${Math.round(max * 0.85)}`,
    );
  };

  return (
    <ToolCard title="Heart Rate Zones" icon={Heart}>
      <p className="mb-3 text-xs text-muted-foreground">Calculate exercise heart rate zones</p>
      <InputField label="Age (years)" value={age} onChange={setAge} placeholder="16" />
      <Btn onClick={calc}>Calculate</Btn>
      <Result label="Heart Rate Zones" value={result} />
    </ToolCard>
  );
};

export const MagnificationCalc = () => {
  const [image, setImage] = useState("");
  const [actual, setActual] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const calc = () => {
    const i = parseFloat(image),
      a = parseFloat(actual);
    if (isNaN(i) || isNaN(a) || a === 0) return;
    setResult(`×${(i / a).toFixed(1)}`);
  };

  return (
    <ToolCard title="Magnification Calculator" icon={Microscope}>
      <p className="mb-3 text-xs text-muted-foreground">Magnification = Image size / Actual size</p>
      <div className="grid grid-cols-2 gap-3">
        <InputField label="Image size (mm)" value={image} onChange={setImage} placeholder="30" />
        <InputField
          label="Actual size (mm)"
          value={actual}
          onChange={setActual}
          placeholder="0.02"
        />
      </div>
      <Btn onClick={calc}>Calculate</Btn>
      <Result label="Magnification" value={result} />
    </ToolCard>
  );
};

export const PunnettSquare = () => {
  const [p1, setP1] = useState("Tt");
  const [p2, setP2] = useState("Tt");
  const [result, setResult] = useState<string | null>(null);

  const calc = () => {
    if (p1.length !== 2 || p2.length !== 2) {
      setResult("Enter 2-letter genotypes (e.g., Tt)");
      return;
    }
    const combos: string[] = [];
    for (const a of p1) for (const b of p2) combos.push(a.toUpperCase() === a ? a + b : b + a);
    const counts: Record<string, number> = {};
    combos.forEach((c) => {
      const sorted =
        c[0].toUpperCase() <= c[1].toUpperCase()
          ? c[0].toUpperCase() === c[0]
            ? c
            : c[1] + c[0]
          : c[1].toUpperCase() === c[1]
            ? c[1] + c[0]
            : c;
      counts[sorted] = (counts[sorted] || 0) + 1;
    });
    setResult(
      Object.entries(counts)
        .map(([k, v]) => `${k}: ${v}/4`)
        .join(" | "),
    );
  };

  return (
    <ToolCard title="Punnett Square" icon={Leaf}>
      <p className="mb-3 text-xs text-muted-foreground">Predict offspring genotype ratios</p>
      <div className="grid grid-cols-2 gap-3">
        <InputField
          label="Parent 1 genotype"
          value={p1}
          onChange={setP1}
          placeholder="Tt"
          type="text"
        />
        <InputField
          label="Parent 2 genotype"
          value={p2}
          onChange={setP2}
          placeholder="Tt"
          type="text"
        />
      </div>
      <Btn onClick={calc}>Cross</Btn>
      <Result label="Offspring ratios" value={result} />
    </ToolCard>
  );
};

export const WaterPotentialCalc = () => {
  const [solute, setSolute] = useState("");
  const [pressure, setPressure] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const calc = () => {
    const s = parseFloat(solute),
      p = parseFloat(pressure);
    if (isNaN(s) || isNaN(p)) return;
    setResult(`Ψ = ${(s + p).toFixed(2)} kPa`);
  };

  return (
    <ToolCard title="Water Potential (Ψ = Ψs + Ψp)" icon={Droplets}>
      <p className="mb-3 text-xs text-muted-foreground">Calculate water potential of a cell</p>
      <div className="grid grid-cols-2 gap-3">
        <InputField
          label="Solute potential Ψs (kPa)"
          value={solute}
          onChange={setSolute}
          placeholder="-500"
        />
        <InputField
          label="Pressure potential Ψp (kPa)"
          value={pressure}
          onChange={setPressure}
          placeholder="300"
        />
      </div>
      <Btn onClick={calc}>Calculate</Btn>
      <Result label="Water Potential (Ψ)" value={result} />
    </ToolCard>
  );
};

export const EcologyQuadrat = () => {
  const [count, setCount] = useState("");
  const [quadratArea, setQuadratArea] = useState("");
  const [totalArea, setTotalArea] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const calc = () => {
    const c = parseFloat(count),
      qa = parseFloat(quadratArea),
      ta = parseFloat(totalArea);
    if (isNaN(c) || isNaN(qa) || isNaN(ta) || qa === 0) return;
    const density = c / qa;
    const estimated = density * ta;
    setResult(
      `Density: ${density.toFixed(2)} per m² | Estimated population: ${Math.round(estimated)}`,
    );
  };

  return (
    <ToolCard title="Quadrat Population Estimate" icon={Leaf}>
      <p className="mb-3 text-xs text-muted-foreground">
        Estimate population from quadrat sampling
      </p>
      <div className="grid grid-cols-3 gap-3">
        <InputField label="Count in quadrat" value={count} onChange={setCount} placeholder="8" />
        <InputField
          label="Quadrat area (m²)"
          value={quadratArea}
          onChange={setQuadratArea}
          placeholder="1"
        />
        <InputField
          label="Total area (m²)"
          value={totalArea}
          onChange={setTotalArea}
          placeholder="500"
        />
      </div>
      <Btn onClick={calc}>Estimate</Btn>
      <Result label="Population Estimate" value={result} />
    </ToolCard>
  );
};

export default function BiologyTools() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <BMICalculator />
      <HeartRateZones />
      <MagnificationCalc />
      <PunnettSquare />
      <WaterPotentialCalc />
      <EcologyQuadrat />
    </div>
  );
}
