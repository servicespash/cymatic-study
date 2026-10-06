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

export function generateContextAwareGreeting(options: {
  fullName?: string | null;
  email?: string | null;
  role?: string | null;
  schoolName?: string | null;
}): string {
  const { firstName, addressedName, roleLabel } = getAddressedName(options.fullName, options.email, options.role);
  const school = options.schoolName || "Cymatic Study Ecosystem";
  
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (roleLabel === "Administrator") {
    return `${timeGreeting}, ${addressedName}. As administrator for ${school}, your institutional command center is fully synchronized and ready to guide academic excellence. What strategic initiative or department metric shall we focus on today?`;
  }
  if (roleLabel === "Teacher") {
    return `${timeGreeting}, ${addressedName}. Welcome back to your faculty assessment workspace. Your students across ${school} are progressing through NCDC curriculum modules. Shall we review recent student submissions or prepare today's instructional materials?`;
  }
  return `${timeGreeting}, ${addressedName}! Welcome back to your learning hub. Your personalized path in NCDC Lower and Upper Secondary subjects is ready. What topic in Mathematics, Physics, Chemistry, Biology, or History shall we explore and master together today?`;
}

