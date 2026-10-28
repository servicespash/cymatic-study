import {
  Calculator,
  Zap,
  Atom,
  Leaf,
  Compass,
  Landmark,
  BookOpen,
  Briefcase,
  Cpu,
  FileText,
  Sparkles,
  Globe,
  Languages,
  Sprout,
  Palette,
  Bookmark,
} from "lucide-react";

export interface CurriculumSubject {
  title: string;
  description: string;
  icon: any;
  gradient: string;
  category: string;
  level: "Senior 1–4 (O-Level)" | "Senior 5–6 (A-Level)";
  type: "Compulsory" | "Selectable" | "Optional";
  classRange: string;
  room: "Sciences" | "Arts" | "Humanities";
}

export const curriculumSubjects: CurriculumSubject[] = [
  // A-Level (Senior 5 & 6)
  {
    title: "Physics (Advanced)",
    description:
      "Advanced level mechanics, electricity, heat, and modern physics. Essential for engineering.",
    icon: Zap,
    gradient: "physics",
    category: "physics",
    level: "Senior 5–6 (A-Level)",
    type: "Selectable",
    classRange: "S.5 - S.6",
    room: "Sciences",
  },
  {
    title: "Chemistry (Advanced)",
    description:
      "Physical, inorganic, and organic chemistry. Core for medicine and chemical sciences.",
    icon: Atom,
    gradient: "chemistry",
    category: "chemistry",
    level: "Senior 5–6 (A-Level)",
    type: "Selectable",
    classRange: "S.5 - S.6",
    room: "Sciences",
  },
  {
    title: "Biology (Advanced)",
    description: "Advanced study of cytology, physiology, genetics, and environmental systems.",
    icon: Leaf,
    gradient: "biology",
    category: "biology",
    level: "Senior 5–6 (A-Level)",
    type: "Selectable",
    classRange: "S.5 - S.6",
    room: "Sciences",
  },
  {
    title: "Pure Mathematics (Advanced)",
    description: "Complex numbers, advanced calculus, vectors, and numerical analysis.",
    icon: Calculator,
    gradient: "math",
    category: "math",
    level: "Senior 5–6 (A-Level)",
    type: "Selectable",
    classRange: "S.5 - S.6",
    room: "Sciences",
  },
  {
    title: "Subsidiary Mathematics",
    description:
      "Essential statistics, probability, and basic mathematical operations for non-math combinations.",
    icon: Calculator,
    gradient: "math",
    category: "math",
    level: "Senior 5–6 (A-Level)",
    type: "Compulsory",
    classRange: "S.5 - S.6 (Subsidiary)",
    room: "Sciences",
  },
  {
    title: "Subsidiary ICT",
    description: "Applied computing, file management, spreadsheets, and database operations.",
    icon: Cpu,
    gradient: "entrepreneurship",
    category: "ict",
    level: "Senior 5–6 (A-Level)",
    type: "Compulsory",
    classRange: "S.5 - S.6 (Subsidiary)",
    room: "Sciences",
  },
  // O-Level
  {
    title: "Mathematics",
    description:
      "Number bases, algebra, commercial arithmetic, geometry, statistics, and trigonometry.",
    icon: Calculator,
    gradient: "math",
    category: "math",
    level: "Senior 1–4 (O-Level)",
    type: "Compulsory",
    classRange: "S.1 - S.4",
    room: "Sciences",
  },
  {
    title: "Physics",
    description: "Forces, motion, heat, waves, magnetism, simple circuits, and atomic physics.",
    icon: Zap,
    gradient: "physics",
    category: "physics",
    level: "Senior 1–4 (O-Level)",
    type: "Compulsory",
    classRange: "S.1 - S.4",
    room: "Sciences",
  },
  {
    title: "Chemistry",
    description: "Elements, periodic table, chemical bonding, acids, bases, and stoichiometry.",
    icon: Atom,
    gradient: "chemistry",
    category: "chemistry",
    level: "Senior 1–4 (O-Level)",
    type: "Compulsory",
    classRange: "S.1 - S.4",
    room: "Sciences",
  },
  {
    title: "Biology",
    description: "Cell structure, human anatomy, plant biology, nutrition, and ecology.",
    icon: Leaf,
    gradient: "biology",
    category: "biology",
    level: "Senior 1–4 (O-Level)",
    type: "Compulsory",
    classRange: "S.1 - S.4",
    room: "Sciences",
  },
  {
    title: "Information & Communications Tech",
    description:
      "Word processing, presentation software, simple spreadsheets, and computing theory.",
    icon: Cpu,
    gradient: "chemistry",
    category: "ict",
    level: "Senior 1–4 (O-Level)",
    type: "Selectable",
    classRange: "S.1 - S.4",
    room: "Sciences",
  },
  {
    title: "Agriculture",
    description:
      "Principles of soil science, crop husbandry, farm machinery, and livestock husbandry.",
    icon: Sprout,
    gradient: "biology",
    category: "agriculture",
    level: "Senior 1–4 (O-Level)",
    type: "Selectable",
    classRange: "S.1 - S.4",
    room: "Sciences",
  },
];
