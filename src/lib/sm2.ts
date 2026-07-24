export interface SM2Card {
  id: string;
  subject: string;
  topicTitle: string;
  interval: number; // in days
  repetitions: number;
  easeFactor: number; // default 2.5
  lastReviewed: string; // ISO date string
  nextReview: string; // ISO date string
  masteryLevel: number; // 0 to 100%
}

export interface SM2Result {
  interval: number;
  repetitions: number;
  easeFactor: number;
  nextReview: string;
  masteryLevel: number;
}

/**
 * SuperMemo SM-2 Spaced Repetition Algorithm
 * @param quality Grade from 0 to 5 (0 = complete blackout, 5 = perfect response)
 * @param repetitions Current repetition count
 * @param interval Current interval in days
 * @param easeFactor Current ease factor (EF)
 */
export function calculateSM2(
  quality: number,
  repetitions: number,
  interval: number,
  easeFactor: number,
): SM2Result {
  // Ensure quality is between 0 and 5
  const q = Math.max(0, Math.min(5, quality));

  let newRepetitions = repetitions;
  let newInterval = interval;
  let newEaseFactor = easeFactor;

  if (q >= 3) {
    if (newRepetitions === 0) {
      newInterval = 1;
    } else if (newRepetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * easeFactor);
    }
    newRepetitions += 1;
  } else {
    newRepetitions = 0;
    newInterval = 1;
  }

  // Calculate new Ease Factor
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  newEaseFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (newEaseFactor < 1.3) {
    newEaseFactor = 1.3;
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  // Calculate mastery level (0-100) based on repetitions and interval
  const masteryLevel = Math.min(100, Math.round(newRepetitions * 20 + newInterval * 2));

  return {
    interval: newInterval,
    repetitions: newRepetitions,
    easeFactor: parseFloat(newEaseFactor.toFixed(2)),
    nextReview: nextReviewDate.toISOString(),
    masteryLevel,
  };
}
