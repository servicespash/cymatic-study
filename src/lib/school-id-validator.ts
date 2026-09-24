/**
 * NCDC Boarding Institution School ID Validation & Generation Utility
 */

export interface OrgIdValidationResult {
  isValid: boolean;
  error?: string;
  formatted?: string;
}

/**
 * Validates whether an Organization/School ID complies with the standard format.
 */
export function validateOrgId(id: string): OrgIdValidationResult {
  if (!id || !id.trim()) {
    return {
      isValid: false,
      error: "Institutional ID cannot be empty. Enter your institutional code or click Auto-Generate.",
    };
  }

  const cleanId = id.trim().toUpperCase();

  // Explicitly reject UUIDs
  const uuidRegex = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;
  if (uuidRegex.test(cleanId)) {
    return {
      isValid: false,
      error:
        "UUIDs are not permitted. Please use a valid alphanumeric Institutional ID format (e.g., SCH-UG-2026-97EZ or LCSS-4128).",
    };
  }

  // Pattern 1: standard XXXX-0000 (e.g., LCSS-4128)
  const standardRegex = /^[A-Z]{3,4}-[0-9]{4}$/;

  // Pattern 2: Uganda School format SCH-UG-[YEAR]-[4 ALPHANUMERIC CHARACTER CODE] (e.g., SCH-UG-2026-97EZ)
  const ugandaSchoolRegex = /^SCH-UG-[0-9]{4}-[A-Z0-9]{4}$/;

  if (standardRegex.test(cleanId) || ugandaSchoolRegex.test(cleanId)) {
    return {
      isValid: true,
      formatted: cleanId,
    };
  }

  return {
    isValid: false,
    error:
      "Invalid format. Institutional ID must follow standard 'SCH-UG-2026-97EZ' or 'XXXX-0000' style formats.",
  };
}

// Aliases for backward compatibility during migration
export const validateNcdcSchoolId = validateOrgId;

/**
 * Auto-generates a standard Institution School ID.
 * Example result: SCH-UG-2026-97EZ
 */
export function generateNcdcBoardingSchoolId(shortName?: string): string {
  if (shortName && shortName.toUpperCase().includes("UG")) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No confusing 0, 1, I, O
    let randomSuffix = "";
    for (let i = 0; i < 4; i++) {
      randomSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `SCH-UG-2026-${randomSuffix}`;
  }

  // Default to the premium Uganda school format:
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomSuffix = "";
  for (let i = 0; i < 4; i++) {
    randomSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SCH-UG-2026-${randomSuffix}`;
}
