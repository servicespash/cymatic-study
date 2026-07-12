import type { TutorPersona } from "./TutorService";

export type { TutorPersona };

const GREETING_STORAGE_KEY = "lattys-last-greeting-date";

export function shouldGreet(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const today = new Date().toISOString().slice(0, 10);
    return window.localStorage.getItem(GREETING_STORAGE_KEY) !== today;
  } catch {
    return false;
  }
}

export function markGreeted(): void {
  if (typeof window === "undefined") return;

  try {
    const today = new Date().toISOString().slice(0, 10);
    window.localStorage.setItem(GREETING_STORAGE_KEY, today);
  } catch {
    // Ignore storage failures so greetings never crash the app shell.
  }
}
