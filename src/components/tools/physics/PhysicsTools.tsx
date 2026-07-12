import React, { useState } from "react";
import { Zap, Thermometer, Waves, Gauge, LucideIcon } from "lucide-react";

const ToolCard = ({
  title,
  icon: Icon,
  color,
  children,
}: {
  title: string;
  icon: LucideIcon;
  color: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
    <div className="mb-4 flex items-center gap-3">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) => (
  <div>
    <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
    <input
      type="number"
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
    <div className="mt-4 rounded-lg bg-physics/10 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-lg font-bold text-physics">{value}</p>
    </div>
  );
};

const Btn = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className="mt-3 w-full rounded-lg bg-physics py-2 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 shadow-sm active:scale-[0.98]"
  >
    {children}
  </button>
);

export const OhmsLawCalc = () => {
  const [v, setV] = useState("");
  const [i, setI] = useState("");
  const [r, setR] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const calc = () => {
    const vn = parseFloat(v),
      in_ = parseFloat(i),
      rn = parseFloat(r);
    if (!isNaN(in_) && !isNaN(rn) && !v) {
      setResult(`V = ${(in_ * rn).toFixed(2)} V`);
    } else if (!isNaN(vn) && !isNaN(rn) && !i) {
      setResult(`I = ${(vn / rn).toFixed(4)} A`);
    } else if (!isNaN(vn) && !isNaN(in_) && !r) {
      setResult(`R = ${(vn / in_).toFixed(2)} Ω`);
    } else {
      setResult("Leave ONE field empty to calculate it.");
    }
  };

  return (
    <ToolCard title="Ohm's Law (V = IR)" icon={Zap} color="bg-physics">
      <p className="mb-3 text-xs text-muted-foreground">Enter any two values to find the third</p>
      <div className="grid grid-cols-3 gap-3">
        <InputField label="Voltage (V)" value={v} onChange={setV} placeholder="12" />
        <InputField label="Current (A)" value={i} onChange={setI} placeholder="2" />
        <InputField label="Resistance (Ω)" value={r} onChange={setR} placeholder="6" />
      </div>
      <Btn onClick={calc}>Calculate</Btn>
      <Result label="Result" value={result} />
    </ToolCard>
  );
};

export const WaveSpeedCalc = () => {
  const [f, setF] = useState("");
  const [w, setW] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const calc = () => {
    const fn = parseFloat(f),
      wn = parseFloat(w);
    if (isNaN(fn) || isNaN(wn)) return;
    setResult(`${(fn * wn).toFixed(2)} m/s`);
  };

  return (
    <ToolCard title="Wave Speed (v = fλ)" icon={Waves} color="bg-physics">
      <p className="mb-3 text-xs text-muted-foreground">
        Calculate wave speed from frequency and wavelength
      </p>
      <div className="grid grid-cols-2 gap-3">
        <InputField label="Frequency (Hz)" value={f} onChange={setF} placeholder="340" />
        <InputField label="Wavelength (m)" value={w} onChange={setW} placeholder="1" />
      </div>
      <Btn onClick={calc}>Calculate</Btn>
      <Result label="Wave Speed (v)" value={result} />
    </ToolCard>
  );
};

export const HeatEnergyCalc = () => {
  const [m, setM] = useState("");
  const [c, setC] = useState("4200");
  const [dt, setDt] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const calc = () => {
    const mn = parseFloat(m),
      cn = parseFloat(c),
      dtn = parseFloat(dt);
    if (isNaN(mn) || isNaN(cn) || isNaN(dtn)) return;
    const q = mn * cn * dtn;
    setResult(q >= 1000 ? `${(q / 1000).toFixed(2)} kJ` : `${q.toFixed(2)} J`);
  };

  return (
    <ToolCard title="Heat Energy (Q = mcΔθ)" icon={Thermometer} color="bg-physics">
      <p className="mb-3 text-xs text-muted-foreground">Calculate thermal energy transfer</p>
      <div className="grid grid-cols-3 gap-3">
        <InputField label="Mass (kg)" value={m} onChange={setM} placeholder="2" />
        <InputField label="SHC (J/kg°C)" value={c} onChange={setC} placeholder="4200" />
        <InputField label="Δθ (°C)" value={dt} onChange={setDt} placeholder="50" />
      </div>
      <Btn onClick={calc}>Calculate</Btn>
      <Result label="Heat Energy (Q)" value={result} />
    </ToolCard>
  );
};

export const PressureCalc = () => {
  const [mode, setMode] = useState<"solid" | "liquid">("solid");
  const [f, setF] = useState("");
  const [a, setA] = useState("");
  const [rho, setRho] = useState("1000");
  const [g] = useState("10");
  const [h, setH] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const calc = () => {
    if (mode === "solid") {
      const fn = parseFloat(f),
        an = parseFloat(a);
      if (isNaN(fn) || isNaN(an) || an === 0) return;
      setResult(`${(fn / an).toFixed(2)} Pa`);
    } else {
      const rn = parseFloat(rho),
        gn = parseFloat(g),
        hn = parseFloat(h);
      if (isNaN(rn) || isNaN(gn) || isNaN(hn)) return;
      setResult(`${(rn * gn * hn).toFixed(2)} Pa`);
    }
  };

  return (
    <ToolCard title="Pressure Calculator" icon={Gauge} color="bg-physics">
      <div className="mb-3 flex gap-2">
        {(["solid", "liquid"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setResult(null);
            }}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${mode === m ? "bg-physics text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            {m === "solid" ? "P = F/A" : "P = ρgh"}
          </button>
        ))}
      </div>
      {mode === "solid" ? (
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Force (N)" value={f} onChange={setF} placeholder="100" />
          <InputField label="Area (m²)" value={a} onChange={setA} placeholder="0.5" />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <InputField label="Density (kg/m³)" value={rho} onChange={setRho} placeholder="1000" />
          <InputField label="g (m/s²)" value={g} onChange={() => {}} placeholder="10" />
          <InputField label="Depth (m)" value={h} onChange={setH} placeholder="5" />
        </div>
      )}
      <Btn onClick={calc}>Calculate</Btn>
      <Result label="Pressure" value={result} />
    </ToolCard>
  );
};

export const MomentumCalc = () => {
  const [m, setM] = useState("");
  const [v, setV] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const calc = () => {
    const mn = parseFloat(m),
      vn = parseFloat(v);
    if (isNaN(mn) || isNaN(vn)) return;
    setResult(`${(mn * vn).toFixed(2)} kg·m/s`);
  };

  return (
    <ToolCard title="Momentum (p = mv)" icon={Zap} color="bg-physics">
      <div className="grid grid-cols-2 gap-3">
        <InputField label="Mass (kg)" value={m} onChange={setM} placeholder="5" />
        <InputField label="Velocity (m/s)" value={v} onChange={setV} placeholder="10" />
      </div>
      <Btn onClick={calc}>Calculate</Btn>
      <Result label="Momentum (p)" value={result} />
    </ToolCard>
  );
};

export const ProjectileCalc = () => {
  const [u, setU] = useState("");
  const [angle, setAngle] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const calc = () => {
    const un = parseFloat(u),
      an = parseFloat(angle);
    if (isNaN(un) || isNaN(an)) return;
    const rad = (an * Math.PI) / 180;
    const g = 10;
    const range = (un ** 2 * Math.sin(2 * rad)) / g;
    const maxH = (un ** 2 * Math.sin(rad) ** 2) / (2 * g);
    const t = (2 * un * Math.sin(rad)) / g;
    setResult(
      `Range: ${range.toFixed(2)} m | Max Height: ${maxH.toFixed(2)} m | Time: ${t.toFixed(2)} s`,
    );
  };

  return (
    <ToolCard title="Projectile Motion" icon={Zap} color="bg-physics">
      <p className="mb-3 text-xs text-muted-foreground">
        Calculate range, max height and time of flight
      </p>
      <div className="grid grid-cols-2 gap-3">
        <InputField label="Initial velocity (m/s)" value={u} onChange={setU} placeholder="20" />
        <InputField label="Angle (°)" value={angle} onChange={setAngle} placeholder="45" />
      </div>
      <Btn onClick={calc}>Calculate</Btn>
      <Result label="Results" value={result} />
    </ToolCard>
  );
};

export const SUVATCalc = () => {
  const [s, setS] = useState("");
  const [u, setU] = useState("");
  const [v, setV] = useState("");
  const [a, setA] = useState("");
  const [t, setT] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const calc = () => {
    const sn = parseFloat(s),
      un = parseFloat(u),
      vn = parseFloat(v),
      an = parseFloat(a),
      tn = parseFloat(t);
    const inputs = [s, u, v, a, t].filter((x) => x !== "").length;

    if (inputs < 3) {
      setResult("Need at least 3 values.");
      return;
    }

    try {
      // Logic for various SUVAT combinations
      if (u && v && t && !a) setResult(`a = ${((vn - un) / tn).toFixed(2)} m/s²`);
      else if (u && v && t && !s) setResult(`s = ${(0.5 * (un + vn) * tn).toFixed(2)} m`);
      else if (u && a && t && !s) setResult(`s = ${(un * tn + 0.5 * an * tn ** 2).toFixed(2)} m`);
      else if (u && a && t && !v) setResult(`v = ${(un + an * tn).toFixed(2)} m/s`);
      else if (v && a && t && !s) setResult(`s = ${(vn * tn - 0.5 * an * tn ** 2).toFixed(2)} m`);
      else if (u && v && a && !s) setResult(`s = ${((vn ** 2 - un ** 2) / (2 * an)).toFixed(2)} m`);
      else if (u && v && a && !t) setResult(`t = ${((vn - un) / an).toFixed(2)} s`);
      else setResult("Try another combination (3 knowns).");
    } catch (e) {
      setResult("Calculation error.");
    }
  };

  return (
    <ToolCard title="SUVAT Kinematics" icon={Zap} color="bg-physics">
      <p className="mb-3 text-xs text-muted-foreground">
        Equations of motion (constant acceleration)
      </p>
      <div className="grid grid-cols-3 gap-2">
        <InputField label="s (m)" value={s} onChange={setS} placeholder="dist" />
        <InputField label="u (m/s)" value={u} onChange={setU} placeholder="init" />
        <InputField label="v (m/s)" value={v} onChange={setV} placeholder="final" />
        <InputField label="a (m/s²)" value={a} onChange={setA} placeholder="accel" />
        <InputField label="t (s)" value={t} onChange={setT} placeholder="time" />
      </div>
      <Btn onClick={calc}>Solve</Btn>
      <Result label="Unknown solved" value={result} />
    </ToolCard>
  );
};

export const SnellsLawCalc = () => {
  const [n1, setN1] = useState("1.0");
  const [theta1, setTheta1] = useState("");
  const [n2, setN2] = useState("1.5");
  const [theta2, setTheta2] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const calc = () => {
    const r1 = (parseFloat(theta1) * Math.PI) / 180;
    const r2 = (parseFloat(theta2) * Math.PI) / 180;
    const v1 = parseFloat(n1),
      v2 = parseFloat(n2);

    if (n1 && theta1 && n2 && !theta2) {
      const sin2 = (v1 * Math.sin(r1)) / v2;
      if (sin2 > 1) setResult("Total Internal Reflection");
      else setResult(`θ₂ = ${((Math.asin(sin2) * 180) / Math.PI).toFixed(2)}°`);
    } else if (n1 && n2 && theta2 && !theta1) {
      const sin1 = (v2 * Math.sin(r2)) / v1;
      setResult(`θ₁ = ${((Math.asin(sin1) * 180) / Math.PI).toFixed(2)}°`);
    } else {
      setResult("Fill n₁, n₂ and one angle.");
    }
  };

  return (
    <ToolCard title="Refraction (Snell's Law)" icon={Waves} color="bg-physics">
      <p className="mb-3 text-xs text-muted-foreground">n₁ sin θ₁ = n₂ sin θ₂</p>
      <div className="grid grid-cols-2 gap-3">
        <InputField label="n₁ (index 1)" value={n1} onChange={setN1} />
        <InputField label="θ₁ (degrees)" value={theta1} onChange={setTheta1} />
        <InputField label="n₂ (index 2)" value={n2} onChange={setN2} />
        <InputField label="θ₂ (degrees)" value={theta2} onChange={setTheta2} />
      </div>
      <Btn onClick={calc}>Calculate</Btn>
      <Result label="Result" value={result} />
    </ToolCard>
  );
};

export const DensityCalc = () => {
  const [m, setM] = useState("");
  const [v, setV] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const calc = () => {
    const mn = parseFloat(m),
      vn = parseFloat(v);
    if (isNaN(mn) || isNaN(vn) || vn === 0) return;
    setResult(`${(mn / vn).toFixed(2)} kg/m³`);
  };

  return (
    <ToolCard title="Density (ρ = m/V)" icon={Zap} color="bg-physics">
      <div className="grid grid-cols-2 gap-3">
        <InputField label="Mass (kg)" value={m} onChange={setM} placeholder="10" />
        <InputField label="Volume (m³)" value={v} onChange={setV} placeholder="2" />
      </div>
      <Btn onClick={calc}>Calculate</Btn>
      <Result label="Density (ρ)" value={result} />
    </ToolCard>
  );
};

export default function PhysicsTools() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <SUVATCalc />
      <DensityCalc />
      <OhmsLawCalc />
      <SnellsLawCalc />
      <MomentumCalc />
      <ProjectileCalc />
      <HeatEnergyCalc />
      <PressureCalc />
      <WaveSpeedCalc />
    </div>
  );
}
