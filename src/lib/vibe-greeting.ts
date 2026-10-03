/**
 * Dynamic Vibe Greeting & Patois Slang Engine
 * Cycles through warm localized Ugandan hooks ("Wagwan", "weebale", absence duration) upon opening new chat windows.
 */

export interface VibeGreetingOptions {
  userName: string;
  userRole?: string;
  lastActiveTimestamp?: number;
  persona?: "male" | "female";
}

export function generateVibeGreeting(options: VibeGreetingOptions): string {
  const isAdams = options.persona === "male";
  const cleanName = (options.userName || "Scholar").trim();
  const firstName = cleanName.split(/\s+/)[0];
  const normalizedRole = (options.userRole || "student").toLowerCase();

  const honorific =
    normalizedRole === "teacher"
      ? "Teacher"
      : normalizedRole === "admin" || normalizedRole === "administrator" || normalizedRole === "org_admin"
        ? "Administrator"
        : "Scholar";

  const addressedName =
    normalizedRole === "teacher"
      ? `Teacher ${firstName}`
      : normalizedRole === "admin" || normalizedRole === "administrator" || normalizedRole === "org_admin"
        ? `Administrator ${firstName}`
        : firstName;

  // Calculate absence duration
  let absenceMessage = "It's wonderful to see you today!";
  if (options.lastActiveTimestamp) {
    const diffHours = (Date.now() - options.lastActiveTimestamp) / (1000 * 60 * 60);
    if (diffHours > 48) {
      absenceMessage =
        "Weebale for returning! It has been a couple of days since your last study session.";
    } else if (diffHours > 12) {
      absenceMessage = "Welcome back for another productive session!";
    } else {
      absenceMessage = "Great to have you right back in the zone!";
    }
  }

  const adamsHooks = [
    `Wagwan, ${addressedName}! ${absenceMessage} Ready to conquer today's physics and mathematics equations?`,
    `Salaam, ${addressedName}! ${absenceMessage} Let's dive straight into first principles and solve some hard problems, kale!`,
    `Hey there, ${addressedName}! ${absenceMessage} Time to put in that high-precision study energy.`,
  ];

  const haawaHooks = [
    `Wagwan, ${addressedName}! ${absenceMessage} May peace and deep focus guide our explorations today.`,
    `Salaam, ${addressedName}! ${absenceMessage} So glad you're here. Shall we explore complexities together?`,
    `Greetings, dear ${addressedName}! ${absenceMessage} Let's cultivate excellence step by step.`,
  ];

  const pool = isAdams ? adamsHooks : haawaHooks;
  return pool[Math.floor(Math.random() * pool.length)];
}
