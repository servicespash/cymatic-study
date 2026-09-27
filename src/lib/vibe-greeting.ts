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
  const honorific = options.userRole === "teacher" 
    ? "Teacher" 
    : options.userRole === "admin" 
    ? "Administrator" 
    : "Scholar";
  
  const name = options.userName || "family";

  // Calculate absence duration
  let absenceMessage = "It's wonderful to see you today!";
  if (options.lastActiveTimestamp) {
    const diffHours = (Date.now() - options.lastActiveTimestamp) / (1000 * 60 * 60);
    if (diffHours > 48) {
      absenceMessage = "Weebale for returning! It has been a couple of days since your last study session.";
    } else if (diffHours > 12) {
      absenceMessage = "Welcome back for another productive session!";
    } else {
      absenceMessage = "Great to have you right back in the zone!";
    }
  }

  const adamsHooks = [
    `Wagwan, ${honorific} ${name}! ${absenceMessage} Ready to conquer today's physics and mathematics equations?`,
    `Salaam, bro ${name}! ${absenceMessage} Let's dive straight into first principles and solve some hard problems, kale!`,
    `Hey there, ${honorific} ${name}! ${absenceMessage} Time to put in that high-precision study energy.`
  ];

  const haawaHooks = [
    `Wagwan, family ${name}! ${absenceMessage} May peace and deep focus guide our biology and chemistry explorations today.`,
    `Salaam, ${honorific} ${name}! ${absenceMessage} So glad you're here. Shall we explore life's cellular complexities together?`,
    `Greetings, dear ${name}! ${absenceMessage} Let's cultivate excellence step by step.`
  ];

  const pool = isAdams ? adamsHooks : haawaHooks;
  return pool[Math.floor(Math.random() * pool.length)];
}
