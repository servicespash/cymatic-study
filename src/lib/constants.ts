export const BRAND = {
  name: "Latty's Cymatic Study",
  partner: "Pash Media",
  tagline: "Educate. Together we elevate. One love ✌️",
  flag: "🇺🇬",
  support: "latifisabirye123@gmail.com",
  whatsapp: "+256768715065",
  merchantId: "7064464",
  supportPrice: "5,000 UGX",
} as const;

export const subjectLabels: Record<string, string> = {
  math: "Mathematics",
  physics: "Physics",
  chemistry: "Chemistry",
  biology: "Biology",
  geography: "Geography",
  history: "History",
  english: "English Language",
  entrepreneurship: "Entrepreneurship",
  economics: "Economics",
  ict: "ICT (Information & Communications Tech)",
  divinity: "Divinity",
  swahili: "Kiswahili",
  luganda: "Luganda",
  literature: "Literature in English",
  agriculture: "Agriculture",
  art: "Fine Art",
  cre: "Christian Religious Education",
  ire: "Islamic Religious Education",
  commerce: "Commerce",
  submath: "Subsidiary Mathematics",
  gp: "General Paper",
};

export const subjectGradients: Record<string, any> = {
  math: "math",
  physics: "physics",
  chemistry: "chemistry",
  biology: "biology",
  geography: "biology",
  history: "physics",
  english: "math",
  entrepreneurship: "chemistry",
  economics: "math",
  ict: "chemistry",
  divinity: "physics",
  swahili: "biology",
  luganda: "history",
  literature: "english",
  agriculture: "biology",
  art: "chemistry",
  cre: "geography",
  ire: "geography",
  commerce: "math",
  submath: "math",
  gp: "physics",
};

export const classLevels = [
  { level: 1, label: "Senior 1" },
  { level: 2, label: "Senior 2" },
  { level: 3, label: "Senior 3" },
  { level: 4, label: "Senior 4" },
  { level: 5, label: "Senior 5 (A-Level)" },
  { level: 6, label: "Senior 6 (A-Level)" },
];

export const NCDC_GRADING_SCALE = [
  { grade: "A", label: "Excellent", min: 80 },
  { grade: "B", label: "Very Good", min: 70 },
  { grade: "C", label: "Good", min: 60 },
  { grade: "D", label: "Fair", min: 50 },
  { grade: "E", label: "Weak", min: 0 },
] as const;

export const ASSESSMENT_SPLIT = {
  CONTINUOUS: 0.2, // 20%
  FINAL: 0.8, // 80%
};
