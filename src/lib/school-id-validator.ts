/**
 * NCDC Boarding Institution School ID Validation & Generation Utility
 */

export interface OrgIdValidationResult {
  isValid: boolean;
  error?: string;
  formatted?: string;
}

/**
 * Extracts a clean 2 to 5 letter uppercase acronym/short code from a school name.
 * e.g. "Cymatic Study Ecosystem" -> "CSE"
 * e.g. "Kampala Secondary School" -> "KSS"
 * e.g. "Cymatic" -> "CYM"
 */
export function getSchoolShortCode(schoolName?: string | null): string {
  if (!schoolName || !schoolName.trim()) {
    return "CSE";
  }

  const clean = schoolName.trim().toUpperCase();
  // If already a clean short code (2-5 uppercase letters)
  if (/^[A-Z]{2,5}$/.test(clean)) {
    return clean;
  }

  // Remove punctuation, split into words
  const words = clean
    .replace(/[^A-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0);

  if (words.length === 0) return "CSE";

  // Filter out minor stop words if we have at least 2 other words
  const stopWords = new Set(["OF", "AND", "THE", "FOR", "IN", "AT", "TO", "A", "AN"]);
  const significantWords = words.filter((w) => !stopWords.has(w));
  const activeWords = significantWords.length >= 2 ? significantWords : words;

  if (activeWords.length >= 2) {
    // Take first letter of each word (up to 5 letters)
    const acronym = activeWords
      .map((w) => w[0])
      .join("")
      .slice(0, 5);
    return acronym.length >= 2 ? acronym : clean.slice(0, 3);
  }

  // Single word: take first 3-4 letters
  const single = activeWords[0];
  return single.slice(0, Math.min(4, Math.max(3, single.length)));
}

/**
 * Validates whether an Organization/School ID complies with standard formats.
 * Accepts:
 * - Acronym + Year + Suffix: e.g. CSE-2026-97EZ, SHC-UG-2026-XXXX, SCH-UG-2026-XXXX
 * - Standard 4-letter + 4-digit: e.g. LCSS-4128
 * - Short form code: e.g. CSE-2026, CSE-97EZ
 */
export function validateOrgId(id: string): OrgIdValidationResult {
  if (!id || !id.trim()) {
    return {
      isValid: false,
      error:
        "Institutional ID cannot be empty. Enter your institutional code or click Auto-Generate.",
    };
  }

  const cleanId = id.trim().toUpperCase();

  // Explicitly reject UUIDs
  const uuidRegex = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;
  if (uuidRegex.test(cleanId)) {
    return {
      isValid: false,
      error:
        "UUIDs are not permitted as public Organization IDs. Please use a clean acronym format (e.g., CSE-2026-97EZ or LCSS-4128).",
    };
  }

  // Pattern 1: Acronym-Year-Suffix (e.g., CSE-2026-97EZ, CSE_2026_97EZ, SCH-UG-2026-97EZ, SHC_UG)
  const acronymYearSuffixRegex = /^[A-Z]{2,6}(?:[-_][A-Z]{2,4})?[-_][0-9]{4}[-_][A-Z0-9]{3,6}$/;

  // Pattern 2: standard XXXX-0000 (e.g., LCSS-4128, CSE_2026) or Acronym-Year
  const standardRegex = /^[A-Z]{2,6}[-_][0-9]{4}$/;

  // Pattern 3: Acronym-Code or Acronym_unique_code (e.g., CSE-97EZ, CSE_97EZ, CSE_UNIQUE_CODE, SHC_UG)
  const shortCodeRegex = /^[A-Z]{2,6}[-_][A-Z0-9_-]{2,20}$/;

  // Pattern 4: Simple clean alphanumeric institutional identifier
  const generalCodeRegex = /^[A-Z]{2,8}(?:[-_][A-Z0-9]+)+$/;

  if (
    acronymYearSuffixRegex.test(cleanId) ||
    standardRegex.test(cleanId) ||
    shortCodeRegex.test(cleanId) ||
    generalCodeRegex.test(cleanId)
  ) {
    return {
      isValid: true,
      formatted: cleanId,
    };
  }

  return {
    isValid: false,
    error:
      "Invalid format. Institutional ID should follow standard 'CSE-2026-97EZ', 'CSE_unique_code', or 'XXXX-0000' format.",
  };
}

// Aliases for backward compatibility during migration
export const validateNcdcSchoolId = validateOrgId;

/**
 * Auto-generates a standard Institution School ID based on school name.
 * Example for "Cymatic Study Ecosystem": CSE-2026-97EZ or CSE_2026_97EZ
 */
export function generateNcdcBoardingSchoolId(
  schoolName?: string | null,
  targetYear?: number,
  separator: "-" | "_" = "-",
): string {
  const year = targetYear || Math.max(2026, new Date().getFullYear());
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No confusing 0, 1, I, O
  let randomSuffix = "";
  for (let i = 0; i < 4; i++) {
    randomSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const shortCode = getSchoolShortCode(schoolName || "Cymatic Study Ecosystem");
  return `${shortCode}${separator}${year}${separator}${randomSuffix}`;
}
