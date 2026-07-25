/**
 * NCDC Boarding Institution School ID Validation & Generation Utility
 */

export interface SchoolIdValidationResult {
  isValid: boolean;
  error?: string;
  formatted?: string;
}

/**
 * Validates whether a School ID complies with the Uganda NCDC Boarding Institution standard format.
 * Acceptable formats:
 * - Standard NCDC Boarding: SCH-UG-YYYY-XXXX (e.g. SCH-UG-2026-B871)
 * - NCDC District Boarding: NCDC-[DISTRICT]-YYYY-XXXX (e.g. NCDC-KAMPALA-2026-0912)
 * - Custom Institutional Code: SCH-[INST]-YYYY-[CODE] (e.g. SCH-MAKERERE-2026-8812)
 */
export function validateNcdcSchoolId(id: string): SchoolIdValidationResult {
  if (!id || !id.trim()) {
    return {
      isValid: false,
      error: "School ID cannot be empty. Enter your institutional code or click Auto-Generate.",
    };
  }

  const cleanId = id.trim().toUpperCase();

  // Pattern checks
  // 1. Strict NCDC Boarding format: SCH-UG-202X-XXXX
  const ncdcStrictRegex = /^SCH-UG-(202[0-9]|203[0-9])-[A-Z0-9]{4,10}$/;
  // 2. Flexible NCDC Boarding/Institutional format: (SCH|NCDC|UG)-[A-Z0-9]{2,12}-(202[0-9]|203[0-9])-[A-Z0-9]{3,10}$
  const ncdcFlexRegex = /^(SCH|NCDC|UG)-[A-Z0-9]{2,12}-(202[0-9]|203[0-9])-[A-Z0-9]{3,10}$/;
  // 3. Simple alphanumeric code (for legacy migration)
  const legacyRegex = /^[A-Z0-9]{3,6}-[A-Z0-9]{3,8}$/;

  if (ncdcStrictRegex.test(cleanId) || ncdcFlexRegex.test(cleanId)) {
    return {
      isValid: true,
      formatted: cleanId,
    };
  }

  if (legacyRegex.test(cleanId)) {
    return {
      isValid: true,
      formatted: `SCH-${cleanId}`,
    };
  }

  return {
    isValid: false,
    error:
      "Invalid format. NCDC Boarding Institution School IDs must follow 'SCH-UG-2026-XXXX' (e.g., SCH-UG-2026-B871).",
  };
}

/**
 * Auto-generates a standard NCDC Boarding Institution School ID.
 * Example result: SCH-UG-2026-E4A9
 */
export function generateNcdcBoardingSchoolId(): string {
  const year = new Date().getFullYear();
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Omit confusing letters (O, I, 0, 1)
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SCH-UG-${year}-${code}`;
}
