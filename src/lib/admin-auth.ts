/**
 * Institutional Admin Authentication & Credential Verification Service
 * Handles password-protected administrative access (Passcode: 290350)
 * ensuring student role accounts are not locked out from admin oversight.
 */

export const ADMIN_STRUCTURED_PASSCODE = "290350";
export const PRIMARY_ADMIN_EMAIL = "latifisabirye123@gmail.com";

const STORAGE_KEY_AUTHORIZED = "cymatic_admin_verified";
const STORAGE_KEY_EMAIL = "cymatic_admin_email";
const STORAGE_KEY_TIMESTAMP = "cymatic_admin_timestamp";

/**
 * Check if the active session has been verified with admin credentials.
 */
export function isAdminSessionAuthorized(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const verified = sessionStorage.getItem(STORAGE_KEY_AUTHORIZED);
    return verified === "true";
  } catch {
    return false;
  }
}

/**
 * Retrieve the verified administrator email from the active session.
 */
export function getVerifiedAdminEmail(): string {
  if (typeof window === "undefined") return "";
  try {
    return sessionStorage.getItem(STORAGE_KEY_EMAIL) || "";
  } catch {
    return "";
  }
}

/**
 * Authorize the administrator session with the verified email.
 */
export function setAdminSessionAuthorized(email: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY_AUTHORIZED, "true");
    sessionStorage.setItem(STORAGE_KEY_EMAIL, email.trim().toLowerCase());
    sessionStorage.setItem(STORAGE_KEY_TIMESTAMP, Date.now().toString());
  } catch (err) {
    console.error("Failed to store admin authorization in session", err);
  }
}

/**
 * Revoke administrator authorization for the current session.
 */
export function clearAdminSession(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY_AUTHORIZED);
    sessionStorage.removeItem(STORAGE_KEY_EMAIL);
    sessionStorage.removeItem(STORAGE_KEY_TIMESTAMP);
  } catch (err) {
    console.error("Failed to clear admin session", err);
  }
}

/**
 * Verify administrative email and structured password.
 */
export function verifyAdminCredentials(
  email: string,
  passcode: string,
): { success: boolean; message: string } {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPasscode = passcode.trim();

  if (!cleanEmail || !cleanEmail.includes("@")) {
    return {
      success: false,
      message: "Please enter a valid administrator email address.",
    };
  }

  if (cleanPasscode !== ADMIN_STRUCTURED_PASSCODE) {
    return {
      success: false,
      message: "Invalid security key. Please provide the authorized developer passcode.",
    };
  }

  return {
    success: true,
    message: "Admin credentials successfully verified.",
  };
}
