import React, { useState } from "react";
import { Atom, Search, FlaskConical } from "lucide-react";

const ELEMENTS = [
  {
    z: 1,
    symbol: "H",
    name: "Hydrogen",
    mass: 1.008,
    group: 1,
    period: 1,
    category: "nonmetal",
    config: "1s¹",
  },
  {
    z: 2,
    symbol: "He",
    name: "Helium",
    mass: 4.003,
    group: 18,
    period: 1,
    category: "noble gas",
    config: "1s²",
  },
  {
    z: 3,
    symbol: "Li",
    name: "Lithium",
    mass: 6.941,
    group: 1,
    period: 2,
    category: "alkali metal",
    config: "2,1",
  },
  {
    z: 4,
    symbol: "Be",
    name: "Beryllium",
    mass: 9.012,
    group: 2,
    period: 2,
    category: "alkaline earth",
    config: "2,2",
  },
  {
    z: 5,
    symbol: "B",
    name: "Boron",
    mass: 10.81,
    group: 13,
    period: 2,
    category: "metalloid",
    config: "2,3",
  },
  {
    z: 6,
    symbol: "C",
    name: "Carbon",
    mass: 12.01,
    group: 14,
    period: 2,
    category: "nonmetal",
    config: "2,4",
  },
  {
    z: 7,
    symbol: "N",
    name: "Nitrogen",
    mass: 14.01,
    group: 15,
    period: 2,
    category: "nonmetal",
    config: "2,5",
  },
  {
    z: 8,
    symbol: "O",
    name: "Oxygen",
    mass: 16.0,
    group: 16,
    period: 2,
    category: "nonmetal",
    config: "2,6",
  },
  {
    z: 9,
    symbol: "F",
    name: "Fluorine",
    mass: 19.0,
    group: 17,
    period: 2,
    category: "halogen",
    config: "2,7",
  },
  {
    z: 10,
    symbol: "Ne",
    name: "Neon",
    mass: 20.18,
    group: 18,
    period: 2,
    category: "noble gas",
    config: "2,8",
  },
  {
    z: 11,
    symbol: "Na",
    name: "Sodium",
    mass: 22.99,
    group: 1,
    period: 3,
    category: "alkali metal",
    config: "2,8,1",
  },
  {
    z: 12,
    symbol: "Mg",
    name: "Magnesium",
    mass: 24.31,
    group: 2,
    period: 3,
    category: "alkaline earth",
    config: "2,8,2",
  },
  {
    z: 13,
    symbol: "Al",
    name: "Aluminium",
    mass: 26.98,
    group: 13,
    period: 3,
    category: "metal",
    config: "2,8,3",
  },
  {
    z: 14,
    symbol: "Si",
    name: "Silicon",
    mass: 28.09,
    group: 14,
    period: 3,
    category: "metalloid",
    config: "2,8,4",
  },
  {
    z: 15,
    symbol: "P",
    name: "Phosphorus",
    mass: 30.97,
    group: 15,
    period: 3,
    category: "nonmetal",
    config: "2,8,5",
  },
  {
    z: 16,
    symbol: "S",
    name: "Sulphur",
    mass: 32.07,
    group: 16,
    period: 3,
    category: "nonmetal",
    config: "2,8,6",
  },
  {
    z: 17,
    symbol: "Cl",
    name: "Chlorine",
    mass: 35.45,
    group: 17,
    period: 3,
    category: "halogen",
    config: "2,8,7",
  },
  {
    z: 18,
    symbol: "Ar",
    name: "Argon",
    mass: 39.95,
    group: 18,
    period: 3,
    category: "noble gas",
    config: "2,8,8",
  },
  {
    z: 19,
    symbol: "K",
    name: "Potassium",
    mass: 39.1,
    group: 1,
    period: 4,
    category: "alkali metal",
    config: "2,8,8,1",
  },
  {
    z: 20,
    symbol: "Ca",
    name: "Calcium",
    mass: 40.08,
    group: 2,
    period: 4,
    category: "alkaline earth",
    config: "2,8,8,2",
  },
  {
    z: 21,
    symbol: "Sc",
    name: "Scandium",
    mass: 44.96,
    group: 3,
    period: 4,
    category: "transition metal",
    config: "2,8,9,2",
  },
  {
    z: 22,
    symbol: "Ti",
    name: "Titanium",
    mass: 47.87,
    group: 4,
    period: 4,
    category: "transition metal",
    config: "2,8,10,2",
  },
  {
    z: 23,
    symbol: "V",
    name: "Vanadium",
    mass: 50.94,
    group: 5,
    period: 4,
    category: "transition metal",
    config: "2,8,11,2",
  },
  {
    z: 24,
    symbol: "Cr",
    name: "Chromium",
    mass: 52.0,
    group: 6,
    period: 4,
    category: "transition metal",
    config: "2,8,13,1",
  },
  {
    z: 25,
    symbol: "Mn",
    name: "Manganese",
    mass: 54.94,
    group: 7,
    period: 4,
    category: "transition metal",
    config: "2,8,13,2",
  },
  {
    z: 26,
    symbol: "Fe",
    name: "Iron",
    mass: 55.85,
    group: 8,
    period: 4,
    category: "transition metal",
    config: "2,8,14,2",
  },
  {
    z: 27,
    symbol: "Co",
    name: "Cobalt",
    mass: 58.93,
    group: 9,
    period: 4,
    category: "transition metal",
    config: "2,8,15,2",
  },
  {
    z: 28,
    symbol: "Ni",
    name: "Nickel",
    mass: 58.69,
    group: 10,
    period: 4,
    category: "transition metal",
    config: "2,8,16,2",
  },
  {
    z: 29,
    symbol: "Cu",
    name: "Copper",
    mass: 63.55,
    group: 11,
    period: 4,
    category: "transition metal",
    config: "2,8,18,1",
  },
  {
    z: 30,
    symbol: "Zn",
    name: "Zinc",
    mass: 65.38,
    group: 12,
    period: 4,
    category: "transition metal",
    config: "2,8,18,2",
  },
  {
    z: 35,
    symbol: "Br",
    name: "Bromine",
    mass: 79.9,
    group: 17,
    period: 4,
    category: "halogen",
    config: "2,8,18,7",
  },
  {
    z: 36,
    symbol: "Kr",
    name: "Krypton",
    mass: 83.8,
    group: 18,
    period: 4,
    category: "noble gas",
    config: "2,8,18,8",
  },
  {
    z: 47,
    symbol: "Ag",
    name: "Silver",
    mass: 107.87,
    group: 11,
    period: 5,
    category: "transition metal",
    config: "2,8,18,18,1",
  },
  {
    z: 53,
    symbol: "I",
    name: "Iodine",
    mass: 126.9,
    group: 17,
    period: 5,
    category: "halogen",
    config: "2,8,18,18,7",
  },
  {
    z: 79,
    symbol: "Au",
    name: "Gold",
    mass: 196.97,
    group: 11,
    period: 6,
    category: "transition metal",
    config: "2,8,18,32,18,1",
  },
  {
    z: 82,
    symbol: "Pb",
    name: "Lead",
    mass: 207.2,
    group: 14,
    period: 6,
    category: "metal",
    config: "2,8,18,32,18,4",
  },
];

const categoryColors: Record<string, string> = {
  nonmetal: "bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700",
  "noble gas": "bg-purple-100 border-purple-300 dark:bg-purple-900/30 dark:border-purple-700",
  "alkali metal": "bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-700",
  "alkaline earth": "bg-orange-100 border-orange-300 dark:bg-orange-900/30 dark:border-orange-700",
  metalloid: "bg-teal-100 border-teal-300 dark:bg-teal-900/30 dark:border-teal-700",
  halogen: "bg-yellow-100 border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700",
  "transition metal": "bg-blue-100 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700",
  metal: "bg-slate-100 border-slate-300 dark:bg-slate-800/30 dark:border-slate-600",
};

export const PeriodicTable = () => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<(typeof ELEMENTS)[0] | null>(null);

  const filtered = search
    ? ELEMENTS.filter(
        (e) =>
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          e.symbol.toLowerCase().includes(search.toLowerCase()) ||
          String(e.z) === search,
      )
    : ELEMENTS;

  return (
    <div className="mb-8 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chemistry">
          <Atom className="h-5 w-5 text-primary-foreground" />
        </div>
        <h3 className="font-semibold text-foreground">Periodic Table Reference</h3>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search element..."
          className="w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {Object.entries(categoryColors).map(([cat, cls]) => (
          <span
            key={cat}
            className={`rounded-md border px-2 py-0.5 text-[10px] font-medium ${cls}`}
          >
            {cat}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-9">
        {filtered.map((el) => (
          <button
            key={el.z}
            onClick={() => setSelected(el)}
            className={`flex flex-col items-center rounded-lg border p-2 text-center transition-all hover:shadow-md ${categoryColors[el.category] || "bg-muted"} ${selected?.z === el.z ? "ring-2 ring-primary" : ""}`}
          >
            <span className="text-[9px] text-muted-foreground">{el.z}</span>
            <span className="text-lg font-bold text-foreground">{el.symbol}</span>
            <span className="text-[9px] text-muted-foreground truncate w-full">{el.name}</span>
          </button>
        ))}
      </div>

      {selected && (
        <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4 animate-fade-in">
          <h4 className="text-lg font-bold text-foreground">
            {selected.name} ({selected.symbol})
          </h4>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            <div>
              <span className="text-muted-foreground">Atomic No:</span>{" "}
              <strong>{selected.z}</strong>
            </div>
            <div>
              <span className="text-muted-foreground">Mass:</span> <strong>{selected.mass}</strong>
            </div>
            <div>
              <span className="text-muted-foreground">Group:</span>{" "}
              <strong>{selected.group}</strong>
            </div>
            <div>
              <span className="text-muted-foreground">Period:</span>{" "}
              <strong>{selected.period}</strong>
            </div>
            <div>
              <span className="text-muted-foreground">Config:</span>{" "}
              <strong>{selected.config}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const MolesCalc = () => {
  const [mode, setMode] = useState<"mass" | "gas" | "soln">("mass");
  const [v1, setV1] = useState("");
  const [v2, setV2] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const calculate = () => {
    const n1 = parseFloat(v1),
      n2 = parseFloat(v2);
    if (isNaN(n1) || isNaN(n2) || n2 === 0) return;

    if (mode === "mass") setResult(`${(n1 / n2).toFixed(4)} mol`);
    else if (mode === "gas") setResult(`${(n1 / 22.4).toFixed(4)} mol (at STP)`);
    else setResult(`${(n1 * n2).toFixed(4)} mol`);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chemistry">
          <FlaskConical className="h-5 w-5 text-primary-foreground" />
        </div>
        <h3 className="font-semibold text-foreground">Mole Concept</h3>
      </div>

      <div className="flex gap-2 mb-4">
        {(["mass", "gas", "soln"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setResult(null);
            }}
            className={`rounded-md px-3 py-1 text-[10px] font-bold uppercase transition-colors ${mode === m ? "bg-chemistry text-white" : "bg-muted text-muted-foreground"}`}
          >
            {m === "mass" ? "n = m/Mr" : m === "gas" ? "n = V/22.4" : "n = CV"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {mode === "mass" ? (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Mass (g)
              </label>
              <input
                type="number"
                value={v1}
                onChange={(e) => setV1(e.target.value)}
                placeholder="44"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-chemistry/50 transition-all"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Mr (g/mol)
              </label>
              <input
                type="number"
                value={v2}
                onChange={(e) => setV2(e.target.value)}
                placeholder="44"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-chemistry/50 transition-all"
              />
            </div>
          </>
        ) : mode === "gas" ? (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Vol (dm³)
              </label>
              <input
                type="number"
                value={v1}
                onChange={(e) => setV1(e.target.value)}
                placeholder="22.4"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-chemistry/50 transition-all"
              />
            </div>
            <div className="flex items-end text-[10px] text-muted-foreground pb-2">
              V_m = 22.4 dm³/mol
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Conc (mol/dm³)
              </label>
              <input
                type="number"
                value={v1}
                onChange={(e) => setV1(e.target.value)}
                placeholder="0.1"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-chemistry/50 transition-all"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Vol (dm³)
              </label>
              <input
                type="number"
                value={v2}
                onChange={(e) => setV2(e.target.value)}
                placeholder="0.25"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-chemistry/50 transition-all"
              />
            </div>
          </>
        )}
      </div>
      <button
        onClick={calculate}
        className="mt-4 w-full rounded-xl bg-chemistry py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 shadow-sm transition-all"
      >
        Calculate
      </button>
      {result && (
        <div className="mt-4 rounded-lg bg-chemistry/10 border border-chemistry/20 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-chemistry mb-1">
            Amount of Substance
          </p>
          <p className="text-xl font-black text-chemistry font-mono">{result}</p>
        </div>
      )}
    </div>
  );
};

export const ConcCalc = () => {
  const [mol, setMol] = useState("");
  const [vol, setVol] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const calculate = () => {
    const n = parseFloat(mol),
      v = parseFloat(vol);
    if (isNaN(n) || isNaN(v) || v === 0) return;
    setResult(`${(n / v).toFixed(4)} mol/dm³`);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chemistry">
          <FlaskConical className="h-5 w-5 text-primary-foreground" />
        </div>
        <h3 className="font-semibold text-foreground">Concentration (C = n/V)</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Moles (mol)
          </label>
          <input
            type="number"
            value={mol}
            onChange={(e) => setMol(e.target.value)}
            placeholder="0.5"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Vol (dm³)</label>
          <input
            type="number"
            value={vol}
            onChange={(e) => setVol(e.target.value)}
            placeholder="0.25"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>
      <button
        onClick={calculate}
        className="mt-3 w-full rounded-lg bg-chemistry py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-colors"
      >
        Calculate
      </button>
      {result && (
        <div className="mt-4 rounded-lg bg-chemistry/10 p-3">
          <p className="text-xs font-medium text-muted-foreground">Result</p>
          <p className="text-lg font-bold text-chemistry">{result}</p>
        </div>
      )}
    </div>
  );
};

export const PHCalc = () => {
  const [val, setVal] = useState("");
  const [type, setType] = useState<"pH" | "pOH" | "[H+]" | "[OH-]">("pH");
  const [result, setResult] = useState<{ [key: string]: string } | null>(null);

  const calc = () => {
    const n = parseFloat(val);
    if (isNaN(n)) return;

    let ph: number, poh: number, h: number, oh: number;

    try {
      if (type === "pH") {
        ph = n;
        poh = 14 - n;
        h = 10 ** -n;
        oh = 10 ** -poh;
      } else if (type === "pOH") {
        poh = n;
        ph = 14 - n;
        oh = 10 ** -n;
        h = 10 ** -ph;
      } else if (type === "[H+]") {
        h = n;
        ph = -Math.log10(n);
        poh = 14 - ph;
        oh = 10 ** -poh;
      } else {
        oh = n;
        poh = -Math.log10(n);
        ph = 14 - poh;
        h = 10 ** -ph;
      }

      setResult({
        pH: ph.toFixed(2),
        pOH: poh.toFixed(2),
        "[H+]": h.toExponential(3) + " M",
        "[OH-]": oh.toExponential(3) + " M",
      });
    } catch (e) {
      setResult({ error: "Invalid input" });
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chemistry">
          <FlaskConical className="h-5 w-5 text-primary-foreground" />
        </div>
        <h3 className="font-semibold text-foreground">pH / pOH Calculator</h3>
      </div>
      <div className="flex gap-2 mb-3">
        {(["pH", "pOH", "[H+]", "[OH-]"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${type === t ? "bg-chemistry text-white" : "bg-muted"}`}
          >
            {t}
          </button>
        ))}
      </div>
      <input
        type="number"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder={`Enter ${type}...`}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring mb-3"
      />
      <button
        onClick={calc}
        className="w-full rounded-lg bg-chemistry py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        Calculate
      </button>
      {result && !result.error && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {Object.entries(result).map(([k, v]) => (
            <div key={k} className="p-2 bg-chemistry/5 border border-chemistry/10 rounded-md">
              <p className="text-[10px] text-muted-foreground uppercase">{k}</p>
              <p className="font-mono font-bold text-chemistry">{v}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const PeriodicTrends = () => {
  const trends = [
    {
      name: "Electronegativity",
      period: "Increases →",
      group: "Decreases ↓",
      desc: "Atom's ability to attract shared electrons.",
    },
    {
      name: "Atomic Radius",
      period: "Decreases →",
      group: "Increases ↓",
      desc: "Distance from nucleus to valence shell.",
    },
    {
      name: "Ionization Energy",
      period: "Increases →",
      group: "Decreases ↓",
      desc: "Energy required to remove an electron.",
    },
    {
      name: "Metallic Character",
      period: "Decreases →",
      group: "Increases ↓",
      desc: "Likelihood of losing electrons.",
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chemistry">
          <Atom className="h-5 w-5 text-primary-foreground" />
        </div>
        <h3 className="font-semibold text-foreground">Periodic Trends Reference</h3>
      </div>
      <div className="space-y-3">
        {trends.map((t) => (
          <div key={t.name} className="p-3 bg-muted/30 rounded-xl border border-border/50">
            <h4 className="text-xs font-black text-chemistry uppercase tracking-wider">{t.name}</h4>
            <div className="flex justify-between mt-1 text-[11px] font-bold">
              <span>
                Across Period: <span className="text-primary">{t.period}</span>
              </span>
              <span>
                Down Group: <span className="text-primary">{t.group}</span>
              </span>
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground italic">{t.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function ChemistryTools() {
  return (
    <div className="space-y-6">
      <PeriodicTable />
      <div className="grid gap-6 md:grid-cols-2">
        <PHCalc />
        <MolesCalc />
        <ConcCalc />
        <PeriodicTrends />
      </div>
    </div>
  );
}
