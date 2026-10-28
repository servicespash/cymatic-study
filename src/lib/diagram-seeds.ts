/**
 * Built-in Scientific Diagram Seed Assets
 * High-resolution SVG technical illustrations with virtual directory paths.
 */

import { DiagramAsset, getDiagramAssets, saveDiagramAsset } from "@/lib/curriculum-store";

export const SAMPLE_DIAGRAMS: DiagramAsset[] = [
  {
    id: "diag-bio-cell",
    name: "Ultrastructure of a Generalized Plant Cell",
    virtualPath: "curriculum/biology/cytology/plant_cell_organelles.svg",
    subject: "biology",
    level: 3,
    caption:
      "Diagram 1.1: Detailed cross-section showing chloroplasts, vacuole, cell wall, and mitochondria.",
    createdAt: new Date().toISOString(),
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="100%" height="100%">
        <rect width="100%" height="100%" fill="#091410"/>
        <rect x="50" y="40" width="500" height="320" rx="30" fill="#0d2818" stroke="#10b981" stroke-width="4"/>
        <rect x="65" y="55" width="470" height="290" rx="22" fill="#143622" stroke="#34d399" stroke-width="2"/>
        <!-- Central Vacuole -->
        <ellipse cx="250" cy="200" rx="140" ry="90" fill="#065f46" stroke="#6ee7b7" stroke-width="2" stroke-dasharray="4,4"/>
        <text x="250" y="205" fill="#a7f3d0" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">Large Central Vacuole</text>
        <!-- Nucleus -->
        <circle cx="430" cy="140" r="45" fill="#047857" stroke="#10b981" stroke-width="3"/>
        <circle cx="430" cy="140" r="18" fill="#064e3b"/>
        <text x="430" y="145" fill="#ecfdf5" font-family="sans-serif" font-size="11" font-weight="bold" text-anchor="middle">Nucleolus</text>
        <!-- Chloroplasts -->
        <ellipse cx="120" cy="100" rx="25" ry="14" fill="#15803d" stroke="#86efac" stroke-width="2"/>
        <text x="120" y="104" fill="#dcfce7" font-family="sans-serif" font-size="9" text-anchor="middle">Chloroplast</text>
        <ellipse cx="130" cy="300" rx="25" ry="14" fill="#15803d" stroke="#86efac" stroke-width="2"/>
        <ellipse cx="380" cy="300" rx="25" ry="14" fill="#15803d" stroke="#86efac" stroke-width="2"/>
        <!-- Mitochondria -->
        <ellipse cx="450" cy="240" rx="24" ry="12" fill="#b45309" stroke="#fcd34d" stroke-width="2"/>
        <text x="450" y="244" fill="#fef3c7" font-family="sans-serif" font-size="8" text-anchor="middle">Mitochondria</text>
        <!-- Labels -->
        <text x="70" y="30" fill="#6ee7b7" font-family="sans-serif" font-size="13" font-weight="bold">CELL WALL (Cellulose)</text>
        <text x="360" y="380" fill="#9ca3af" font-family="sans-serif" font-size="11">Virtual Path: curriculum/biology/cytology/plant_cell_organelles.svg</text>
      </svg>
    `)}`,
  },
  {
    id: "diag-phys-circuit",
    name: "Wheatstone Bridge & Balanced Resistance Circuit",
    virtualPath: "curriculum/physics/circuits/wheatstone_bridge.svg",
    subject: "physics",
    level: 4,
    caption: "Figure 3.2: Balanced circuit where R1/R2 = R3/Rx with null galvanometer deflection.",
    createdAt: new Date().toISOString(),
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="100%" height="100%">
        <rect width="100%" height="100%" fill="#0a0f1d"/>
        <!-- Bridge diamond -->
        <polygon points="300,70 450,200 300,330 150,200" fill="none" stroke="#3b82f6" stroke-width="3"/>
        <!-- Resistor blocks -->
        <rect x="200" y="120" width="45" height="20" fill="#1e3a8a" stroke="#60a5fa" stroke-width="2"/>
        <text x="222" y="135" fill="#dbeafe" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">R1</text>
        <rect x="355" y="120" width="45" height="20" fill="#1e3a8a" stroke="#60a5fa" stroke-width="2"/>
        <text x="377" y="135" fill="#dbeafe" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">R2</text>
        <rect x="200" y="260" width="45" height="20" fill="#1e3a8a" stroke="#60a5fa" stroke-width="2"/>
        <text x="222" y="275" fill="#dbeafe" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">R3</text>
        <rect x="355" y="260" width="45" height="20" fill="#b91c1c" stroke="#f87171" stroke-width="2"/>
        <text x="377" y="275" fill="#fee2e2" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">Rx</text>
        <!-- Galvanometer in middle -->
        <line x1="300" y1="70" x2="300" y2="330" stroke="#f59e0b" stroke-width="2" stroke-dasharray="3,3"/>
        <circle cx="300" cy="200" r="28" fill="#1e293b" stroke="#f59e0b" stroke-width="3"/>
        <text x="300" y="206" fill="#fde68a" font-family="sans-serif" font-size="16" font-weight="black" text-anchor="middle">G</text>
        <!-- Null condition banner -->
        <rect x="180" y="355" width="240" height="30" rx="8" fill="#1e293b" stroke="#334155"/>
        <text x="300" y="375" fill="#93c5fd" font-family="monospace" font-size="13" font-weight="bold" text-anchor="middle">R1 / R2 = R3 / Rx (I_g = 0)</text>
      </svg>
    `)}`,
  },
  {
    id: "diag-chem-electrolysis",
    name: "Electrolytic Extraction of Copper",
    virtualPath: "curriculum/chemistry/electrochemistry/copper_electrolysis.svg",
    subject: "chemistry",
    level: 4,
    caption:
      "Figure 4.1: Impure copper anode dissolving into aqueous CuSO4; pure copper deposits on cathode.",
    createdAt: new Date().toISOString(),
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="100%" height="100%">
        <rect width="100%" height="100%" fill="#120c18"/>
        <!-- Beaker container -->
        <rect x="150" y="100" width="300" height="240" rx="8" fill="#1e102e" stroke="#a855f7" stroke-width="3"/>
        <!-- Electrolyte solution -->
        <rect x="153" y="140" width="294" height="196" rx="4" fill="#1e3a8a" fill-opacity="0.45"/>
        <text x="300" y="310" fill="#93c5fd" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle">Aqueous CuSO4 (Copper(II) Sulfate)</text>
        <!-- Anode (+ Impure) -->
        <rect x="210" y="60" width="30" height="180" fill="#92400e" stroke="#d97706" stroke-width="2"/>
        <text x="225" y="48" fill="#fcd34d" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">Anode (+)</text>
        <text x="225" y="255" fill="#fde68a" font-family="sans-serif" font-size="9" text-anchor="middle">Impure Cu</text>
        <!-- Cathode (- Pure) -->
        <rect x="360" y="60" width="30" height="180" fill="#b45309" stroke="#f59e0b" stroke-width="2"/>
        <text x="375" y="48" fill="#fcd34d" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">Cathode (-)</text>
        <text x="375" y="255" fill="#fde68a" font-family="sans-serif" font-size="9" text-anchor="middle">Pure Cu</text>
        <!-- Power Source -->
        <line x1="225" y1="60" x2="225" y2="25" stroke="#fbbf24" stroke-width="2"/>
        <line x1="375" y1="60" x2="375" y2="25" stroke="#fbbf24" stroke-width="2"/>
        <line x1="225" y1="25" x2="280" y2="25" stroke="#fbbf24" stroke-width="2"/>
        <line x1="320" y1="25" x2="375" y2="25" stroke="#fbbf24" stroke-width="2"/>
        <line x1="280" y1="15" x2="280" y2="35" stroke="#fbbf24" stroke-width="3"/>
        <line x1="320" y1="18" x2="320" y2="32" stroke="#fbbf24" stroke-width="4"/>
        <text x="300" y="380" fill="#c084fc" font-family="monospace" font-size="11">Cu²⁺(aq) + 2e⁻ → Cu(s)</text>
      </svg>
    `)}`,
  },
  {
    id: "diag-agri-soil",
    name: "Ugandan Soil Horizon Profile & Layers",
    virtualPath: "curriculum/agriculture/soils/soil_horizon_profile.svg",
    subject: "agriculture",
    level: 2,
    caption:
      "Figure 2.1: Master soil horizons (O, A, B, C) determining agricultural fertility in Uganda.",
    createdAt: new Date().toISOString(),
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="100%" height="100%">
        <rect width="100%" height="100%" fill="#0c170d"/>
        <!-- Soil cross section -->
        <rect x="120" y="50" width="360" height="40" fill="#2d1b09" stroke="#4ade80" stroke-width="1"/>
        <text x="300" y="75" fill="#86efac" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">O Horizon: Organic Matter / Humus</text>
        <rect x="120" y="90" width="360" height="70" fill="#452a12" stroke="#4ade80" stroke-width="1"/>
        <text x="300" y="130" fill="#fef08a" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle">A Horizon: Topsoil (Root Zone)</text>
        <rect x="120" y="160" width="360" height="100" fill="#78350f" stroke="#4ade80" stroke-width="1"/>
        <text x="300" y="215" fill="#fde68a" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle">B Horizon: Subsoil (Mineral Accumulation)</text>
        <rect x="120" y="260" width="360" height="90" fill="#57534e" stroke="#4ade80" stroke-width="1"/>
        <text x="300" y="310" fill="#e7e5e4" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle">C Horizon: Weathered Parent Material (Bedrock)</text>
        <text x="300" y="380" fill="#86efac" font-family="sans-serif" font-size="11">Virtual Path: curriculum/agriculture/soils/soil_horizon_profile.svg</text>
      </svg>
    `)}`,
  },
];

export function ensureSampleDiagramsSeeded() {
  if (typeof window === "undefined") return;
  const current = getDiagramAssets();
  if (current.length === 0) {
    for (const d of SAMPLE_DIAGRAMS) {
      saveDiagramAsset(d);
    }
  }
}
