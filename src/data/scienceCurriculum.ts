import {
  Calculator,
  Zap,
  Atom,
  Leaf,
  Sprout,
  Compass,
  Landmark,
  BookOpen,
  Briefcase,
  Languages,
} from "lucide-react";

export interface ScienceSubjectDef {
  id: "math" | "physics" | "chemistry" | "biology" | "agriculture";
  title: string;
  shortTitle: string;
  icon: any;
  color: string;
  badgeColor: string;
  description: string;
  levels: number[]; // 1 to 6
  unebCode: string;
  coreCompetencies: string[];
}

export const SCIENCE_SUBJECTS: ScienceSubjectDef[] = [
  {
    id: "math",
    title: "Mathematics",
    shortTitle: "Math",
    icon: Calculator,
    color: "from-blue-600 to-indigo-600",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    description:
      "Numerical concepts, algebra, geometry, trigonometry, vectors, calculus & statistics.",
    levels: [1, 2, 3, 4, 5, 6],
    unebCode: "UCE 456 / UACE P425",
    coreCompetencies: [
      "Mathematical modeling of real-world phenomena",
      "Statistical inference & continuous data evaluation",
      "Calculus and geometric problem-solving",
    ],
  },
  {
    id: "physics",
    title: "Physics",
    shortTitle: "Physics",
    icon: Zap,
    color: "from-amber-500 to-orange-600",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    description: "Mechanics, thermodynamics, wave optics, electricity, magnetism & modern physics.",
    levels: [1, 2, 3, 4, 5, 6],
    unebCode: "UCE 535 / UACE P510",
    coreCompetencies: [
      "Empirical experimentation and laboratory measurement",
      "Energy conservation and thermodynamics in Uganda",
      "Electromagnetic principles and circuit architectures",
    ],
  },
  {
    id: "chemistry",
    title: "Chemistry",
    shortTitle: "Chemistry",
    icon: Atom,
    color: "from-purple-600 to-pink-600",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    description:
      "Stoichiometry, chemical kinetics, organic synthesis, periodic periodicity & laboratory analysis.",
    levels: [1, 2, 3, 4, 5, 6],
    unebCode: "UCE 545 / UACE P525",
    coreCompetencies: [
      "Qualitative and quantitative chemical analysis",
      "Chemical bonding and organic synthesis pathways",
      "Industrial chemical extraction & environmental safety",
    ],
  },
  {
    id: "biology",
    title: "Biology",
    shortTitle: "Biology",
    icon: Leaf,
    color: "from-emerald-600 to-teal-600",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    description: "Cytology, genetics, human anatomy, ecology, microbiology & evolutionary biology.",
    levels: [1, 2, 3, 4, 5, 6],
    unebCode: "UCE 553 / UACE P530",
    coreCompetencies: [
      "Microscopic specimen observation and anatomy",
      "Genetics, inheritance and biotechnology principles",
      "Ecosystem biodiversity and physiological systems",
    ],
  },
  {
    id: "agriculture",
    title: "Agriculture",
    shortTitle: "Agriculture",
    icon: Sprout,
    color: "from-green-600 to-lime-600",
    badgeColor: "bg-green-500/10 text-green-400 border-green-500/20",
    description: "Soil science, agronomy, livestock husbandry, farm mechanization & agribusiness.",
    levels: [1, 2, 3, 4, 5, 6],
    unebCode: "UCE 527 / UACE P515",
    coreCompetencies: [
      "Sustainable soil conservation and crop management",
      "Modern livestock nutrition and disease prevention",
      "Agribusiness value addition & climate resilience",
    ],
  },
];

export const MASKED_ARTS_AND_HUMANITIES = [
  {
    id: "history",
    title: "History & Political Education",
    icon: Landmark,
    room: "Humanities",
    status: "Coming Soon",
    releasePhase: "Term 2 Expansion",
  },
  {
    id: "geography",
    title: "Geography",
    icon: Compass,
    room: "Humanities",
    status: "Coming Soon",
    releasePhase: "Term 2 Expansion",
  },
  {
    id: "entrepreneurship",
    title: "Entrepreneurship",
    icon: Briefcase,
    room: "Arts",
    status: "Coming Soon",
    releasePhase: "Term 2 Expansion",
  },
  {
    id: "literature",
    title: "Literature in English",
    icon: BookOpen,
    room: "Arts",
    status: "Coming Soon",
    releasePhase: "Term 2 Expansion",
  },
  {
    id: "languages",
    title: "Kiswahili & Luganda",
    icon: Languages,
    room: "Humanities",
    status: "Coming Soon",
    releasePhase: "Term 2 Expansion",
  },
];

export const CLASS_LEVELS_SCIENCE = [
  { level: 1, label: "Senior 1", short: "S.1", phase: "Lower Secondary (NLSC)" },
  { level: 2, label: "Senior 2", short: "S.2", phase: "Lower Secondary (NLSC)" },
  { level: 3, label: "Senior 3", short: "S.3", phase: "Lower Secondary (NLSC)" },
  { level: 4, label: "Senior 4", short: "S.4", phase: "UCE Candidate (NLSC)" },
  { level: 5, label: "Senior 5", short: "S.5", phase: "A-Level Pioneer (UACE)" },
  { level: 6, label: "Senior 6", short: "S.6", phase: "UACE Candidate (Advanced)" },
];
