/**
 * NCDC 2026 Competency Grading Engine
 * Handles the 20/80 split (Continuous vs Final) and A-E Scale.
 */

export type CompetencyGrade = "A" | "B" | "C" | "D" | "E";

export interface AssessmentData {
  continuousScore: number; // 0-20 (based on PBL and topic tests)
  finalScore: number; // 0-80 (based on end of term/year exam)
}

export const calculateCompetencyGrade = (data: AssessmentData): CompetencyGrade => {
  const total = data.continuousScore + data.finalScore;

  if (total >= 80) return "A";
  if (total >= 70) return "B";
  if (total >= 60) return "C";
  if (total >= 50) return "D";
  return "E";
};

export const getGradeDescription = (grade: CompetencyGrade): string => {
  const descriptions: Record<CompetencyGrade, string> = {
    A: "Distinction: Demonstrates exceptional understanding and application of competencies.",
    B: "Credit: Shows high-level achievement and consistent application of skills.",
    C: "Pass: Demonstrates required competencies with some areas for growth.",
    D: "Basic: Shows fundamental understanding but requires significant support.",
    E: "Below Basic: Has not yet met the minimum required competency standards.",
  };
  return descriptions[grade];
};

/**
 * Normalizes a percentage score to the NCDC weight.
 * @param scorePct 0-100 percentage
 * @param weight 20 or 80
 */
export const normalizeToWeight = (scorePct: number, weight: 20 | 80): number => {
  return (scorePct / 100) * weight;
};
