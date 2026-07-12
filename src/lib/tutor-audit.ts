/**
 * Tutor Engine Audit System
 * Monitors, validates, and audits all tutor responses for quality and safety
 * Ensures responses are accurate, curriculum-compliant, and helpful
 */

export interface TutorResponse {
  id: string;
  question: string;
  response: string;
  model: string;
  timestamp: Date;
  userId: string;
  subject: string;
  curriculum: string;
  responseTime: number; // ms
}

export interface AuditResult {
  responseId: string;
  isValid: boolean;
  qualityScore: number; // 0-100
  accuracyScore: number; // 0-100
  helpfulnessScore: number; // 0-100
  complianceScore: number; // 0-100
  issues: string[];
  suggestions: string[];
  timestamp: Date;
  auditedBy: string;
}

export interface AuditMetrics {
  totalResponses: number;
  validResponses: number;
  averageQualityScore: number;
  averageAccuracyScore: number;
  averageHelpfulnessScore: number;
  averageComplianceScore: number;
  failedAudits: number;
  systemHealthScore: number; // 0-100
  lastAuditTime: Date;
  performanceMetrics: {
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
  };
}

/**
 * Valid curriculum subjects for Uganda secondary education
 */
const VALID_SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "History",
  "Geography",
  "Economics",
  "Literature",
];

const VALID_CURRICULUMS = ["S1", "S2", "S3", "S4", "Advanced"];

/**
 * Audit a tutor response for quality and compliance
 */
export function auditTutorResponse(response: TutorResponse): Omit<AuditResult, "auditedBy"> {
  const issues: string[] = [];
  let qualityScore = 100;
  let accuracyScore = 100;
  let helpfulnessScore = 100;
  let complianceScore = 100;

  // 1. Check response structure and completeness
  if (!response.response || response.response.length < 50) {
    issues.push("Response is too short or incomplete");
    qualityScore -= 30;
    helpfulnessScore -= 25;
  }

  if (response.response.length > 5000) {
    issues.push("Response is excessively long");
    qualityScore -= 10;
  }

  // 2. Check response time (should be reasonable)
  if (response.responseTime > 10000) {
    issues.push("Response took longer than 10 seconds");
    qualityScore -= 5;
  }

  if (response.responseTime < 100) {
    issues.push("Response time suspiciously fast (possible cached/generic response)");
    qualityScore -= 10;
  }

  // 3. Validate subject and curriculum
  if (!VALID_SUBJECTS.includes(response.subject)) {
    issues.push(`Invalid subject: ${response.subject}`);
    complianceScore -= 20;
  }

  if (!VALID_CURRICULUMS.includes(response.curriculum)) {
    issues.push(`Invalid curriculum: ${response.curriculum}`);
    complianceScore -= 20;
  }

  // 4. Check for plagiarism indicators (repetition)
  if (hasPlagiarismIndicators(response.response)) {
    issues.push("High repetition detected - possible plagiarism");
    accuracyScore -= 30;
    qualityScore -= 20;
  }

  // 5. Check for harmful content
  if (containsHarmfulContent(response.response)) {
    issues.push("Harmful or inappropriate content detected");
    qualityScore -= 50;
    complianceScore -= 50;
  }

  // 6. Verify educational relevance
  if (!isEducationallyRelevant(response.response, response.subject)) {
    issues.push("Response lacks educational relevance to subject");
    accuracyScore -= 25;
    helpfulnessScore -= 20;
  }

  // 7. Check for spam or irrelevant content
  if (isSpamContent(response.response)) {
    issues.push("Content appears to be spam or marketing");
    qualityScore -= 40;
    complianceScore -= 40;
  }

  // 8. Validate proper grammar and language
  if (hasGrammarIssues(response.response)) {
    issues.push("Multiple grammar or language structure issues");
    qualityScore -= 15;
    helpfulnessScore -= 10;
  }

  // Calculate overall score
  const suggestions: string[] = [];

  if (qualityScore < 70) {
    suggestions.push(
      "Improve response comprehensiveness and structure for better user understanding",
    );
  }

  if (accuracyScore < 70) {
    suggestions.push(
      "Verify response accuracy against curriculum standards and educational materials",
    );
  }

  if (helpfulnessScore < 70) {
    suggestions.push("Add more practical examples or step-by-step explanations");
  }

  if (complianceScore < 70) {
    suggestions.push(
      "Ensure response aligns with Uganda curriculum standards for the subject and level",
    );
  }

  const avgScore = (qualityScore + accuracyScore + helpfulnessScore + complianceScore) / 4;

  return {
    responseId: response.id,
    isValid: avgScore >= 70 && issues.length <= 2,
    qualityScore: Math.max(0, Math.min(100, qualityScore)),
    accuracyScore: Math.max(0, Math.min(100, accuracyScore)),
    helpfulnessScore: Math.max(0, Math.min(100, helpfulnessScore)),
    complianceScore: Math.max(0, Math.min(100, complianceScore)),
    issues,
    suggestions,
    timestamp: new Date(),
  };
}

/**
 * Check for plagiarism indicators (excessive repetition)
 */
function hasPlagiarismIndicators(text: string): boolean {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  // Check for repeated sentences
  const sentenceSet = new Set<string>();
  let repeatedCount = 0;

  for (const sentence of sentences) {
    const normalized = sentence.trim().toLowerCase();
    if (sentenceSet.has(normalized)) {
      repeatedCount++;
    }
    sentenceSet.add(normalized);
  }

  const repetitionRatio = repeatedCount / sentences.length;
  return repetitionRatio > 0.2; // More than 20% repeated sentences
}

/**
 * Check for harmful content
 */
function containsHarmfulContent(text: string): boolean {
  const harmfulPatterns = [
    /(?:violence|harm|hurt|assault)/i,
    /(?:suicide|self-harm)/i,
    /(?:hate|discriminat|prejudic)/i,
    /(?:adult|sexual|explicit)/i,
  ];

  for (const pattern of harmfulPatterns) {
    if (pattern.test(text)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if response is educationally relevant
 */
function isEducationallyRelevant(text: string, subject: string): boolean {
  const subjectKeywords: Record<string, RegExp> = {
    Mathematics: /(?:math|number|equation|formula|algebra|calculus|geometry|ratio)/i,
    Physics: /(?:force|energy|motion|velocity|acceleration|wave|quantum|relativity)/i,
    Chemistry: /(?:element|compound|reaction|atom|molecule|bond|acid|base|oxidation)/i,
    Biology: /(?:organism|cell|dna|evolution|photosynthesis|respiration|gene)/i,
    English: /(?:grammar|literature|poem|novel|syntax|vocabulary|essay|writing)/i,
    History: /(?:event|year|century|period|war|revolution|civilization)/i,
    Geography: /(?:map|region|climate|terrain|border|natural|resource)/i,
    Economics: /(?:supply|demand|market|trade|economy|business|cost|profit)/i,
  };

  const pattern = subjectKeywords[subject];
  if (!pattern) return true; // Unknown subject, assume relevant

  return pattern.test(text);
}

/**
 * Check for spam content
 */
function isSpamContent(text: string): boolean {
  const spamPatterns = [
    /(?:click here|buy now|act now|limited offer|discount)/i,
    /(?:http|https):\/\/[^\s]+/g, // Excessive URLs
    /(?:casino|lottery|prize|win money)/i,
  ];

  let spamScore = 0;
  for (const pattern of spamPatterns) {
    if (pattern.test(text)) {
      spamScore++;
    }
  }

  // Count URL density
  const urlCount = (text.match(/https?:\/\//g) || []).length;
  if (urlCount > 3) {
    spamScore += 2;
  }

  return spamScore >= 2;
}

/**
 * Check for grammar and language issues
 */
function hasGrammarIssues(text: string): boolean {
  const issues: string[] = [];

  // Check for consecutive capitals (usually a sign of poor quality)
  if (/[A-Z]{4,}/.test(text)) {
    issues.push("excessive_caps");
  }

  // Check for balanced quotes and parentheses
  const openParens = (text.match(/\(/g) || []).length;
  const closeParens = (text.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    issues.push("unbalanced_punctuation");
  }

  // Check for very long sentences (hard to understand)
  const sentences = text.split(/[.!?]+/);
  const longSentences = sentences.filter((s) => s.split(" ").length > 40).length;
  if (longSentences > sentences.length * 0.3) {
    issues.push("too_many_long_sentences");
  }

  return issues.length >= 2;
}

/**
 * Generate aggregate audit metrics
 */
export function generateAuditMetrics(auditResults: AuditResult[]): AuditMetrics {
  if (auditResults.length === 0) {
    return {
      totalResponses: 0,
      validResponses: 0,
      averageQualityScore: 0,
      averageAccuracyScore: 0,
      averageHelpfulnessScore: 0,
      averageComplianceScore: 0,
      failedAudits: 0,
      systemHealthScore: 0,
      lastAuditTime: new Date(),
      performanceMetrics: {
        avgResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
      },
    };
  }

  const validCount = auditResults.filter((r) => r.isValid).length;
  const avgQuality = auditResults.reduce((sum, r) => sum + r.qualityScore, 0) / auditResults.length;
  const avgAccuracy =
    auditResults.reduce((sum, r) => sum + r.accuracyScore, 0) / auditResults.length;
  const avgHelpfulness =
    auditResults.reduce((sum, r) => sum + r.helpfulnessScore, 0) / auditResults.length;
  const avgCompliance =
    auditResults.reduce((sum, r) => sum + r.complianceScore, 0) / auditResults.length;

  const healthScore = (validCount / auditResults.length) * 50 + (avgQuality / 2) * 0.5;

  return {
    totalResponses: auditResults.length,
    validResponses: validCount,
    averageQualityScore: Math.round(avgQuality),
    averageAccuracyScore: Math.round(avgAccuracy),
    averageHelpfulnessScore: Math.round(avgHelpfulness),
    averageComplianceScore: Math.round(avgCompliance),
    failedAudits: auditResults.length - validCount,
    systemHealthScore: Math.min(100, Math.round(healthScore)),
    lastAuditTime: new Date(),
    performanceMetrics: {
      avgResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
    },
  };
}

/**
 * Validate tutor response quality before sending to user
 */
export function isResponseQualityAcceptable(auditResult: AuditResult): boolean {
  return (
    auditResult.qualityScore >= 70 &&
    auditResult.accuracyScore >= 70 &&
    auditResult.helpfulnessScore >= 65 &&
    auditResult.complianceScore >= 75 &&
    auditResult.issues.length <= 2
  );
}

/**
 * Get audit severity level
 */
export function getAuditSeverity(
  auditResult: AuditResult,
): "critical" | "warning" | "info" | "pass" {
  if (!auditResult.isValid || auditResult.qualityScore < 50) {
    return "critical";
  }
  if (auditResult.qualityScore < 70 || auditResult.issues.length > 2) {
    return "warning";
  }
  if (auditResult.issues.length > 0) {
    return "info";
  }
  return "pass";
}
