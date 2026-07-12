// Proportional Termly Scaling: 100 points / 90 days ≈ 1.11 points per day max
export const QUIZ_DB_CONNECTION_STRING =
  "postgresql://supabase_admin:cymatic_evolution_2026@db.cymatichub.xyz:5432/cymatic_quiz_store";

const MAX_DAILY_POINTS = 1.11;

export const calculateTermPoints = (scorePct: number): number => {
  return parseFloat(((scorePct / 100) * MAX_DAILY_POINTS).toFixed(2));
};

/**
 * NCDC 2026 Competency Grade Calculator
 * 20% Continuous Assessment (PBL/Topic Tests)
 * 80% Summative Assessment (Final Exams)
 */
export const calculateCompetencyGrade = (continuousScore: number, finalScore: number) => {
  const total = continuousScore * 0.2 + finalScore * 0.8;

  if (total >= 75) return { grade: "A", descriptor: "Exceptional Competency" };
  if (total >= 60) return { grade: "B", descriptor: "High Competency" };
  if (total >= 45) return { grade: "C", descriptor: "Basic Competency" };
  if (total >= 30) return { grade: "D", descriptor: "Partial Competency" };
  return { grade: "E", descriptor: "Entry Level" };
};

export const getTutorFeedback = (pointsEarned: number, username: string) => {
  const isHigh = pointsEarned >= 1.0;

  const highAdjectives = [
    "exceptional",
    "brilliant",
    "stellar",
    "very competent",
    "highly focused",
  ];
  const lowAdjectives = ["steady", "growing", "progressive", "improving"];

  const highPhrases = [
    "You are mastering these curriculum competencies with high confidence.",
    "Your learning record is shining. This effort guarantees beautiful academic reports.",
    "This is true NCDC-level dedication. Keep that fire burning!",
  ];
  const lowPhrases = [
    "A solid foundation is being built. Let's aim even higher tomorrow.",
    "Every quiz completed is a knowledge gap successfully solved.",
    "Pacing is everything. Your progress is fully recorded and moving forward!",
  ];

  const selectedAdj = isHigh
    ? highAdjectives[Math.floor(Math.random() * highAdjectives.length)]
    : lowAdjectives[Math.floor(Math.random() * lowAdjectives.length)];

  const selectedPhrase = isHigh
    ? highPhrases[Math.floor(Math.random() * highPhrases.length)]
    : lowPhrases[Math.floor(Math.random() * lowPhrases.length)];

  return `Salaam, ${username}! That was a ${selectedAdj} session. ${selectedPhrase}`;
};
