/**
  * Utility to format raw user names or email handles into clean professional display names.
  * Prevents raw email handles (e.g. latifisabirye123) from appearing as names.
  */
export function formatUserName(rawName?: string | null, email?: string | null): string {
  if (rawName && rawName.trim() && !rawName.includes("@") && !rawName.match(/^[a-z0-9._-]+[0-9]{3,}$/i)) {
    return rawName.trim();
  }
  if (email) {
    const prefix = email.split("@")[0];
    const cleaned = prefix.replace(/[0-9]+$/, "").replace(/[._-]/g, " ");
    const words = cleaned.split(/\s+/).filter(Boolean);
    if (words.length > 0) {
      return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }
  }
  if (rawName && rawName.trim()) {
    // If rawName was passed like latifisabirye123, clean it up
    const cleaned = rawName.replace(/[0-9]+$/, "").replace(/[._-]/g, " ");
    const words = cleaned.split(/\s+/).filter(Boolean);
    if (words.length > 0) {
      return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }
  }
  return "Scholar";
}

export function getAddressedName(fullName?: string | null, email?: string | null, role?: string | null): { firstName: string; addressedName: string; roleLabel: string } {
  const clean = formatUserName(fullName, email);
  const firstName = clean.split(/\s+/)[0];
  const normalizedRole = (role || "student").toLowerCase();

  let roleLabel = "Scholar";
  let addressedName = firstName;

  if (normalizedRole === "admin" || normalizedRole === "administrator" || normalizedRole === "org_admin") {
    roleLabel = "Administrator";
    addressedName = `Administrator ${firstName}`;
  } else if (normalizedRole === "teacher") {
    roleLabel = "Teacher";
    addressedName = `Teacher ${firstName}`;
  }

  return { firstName, addressedName, roleLabel };
}
