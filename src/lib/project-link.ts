import type { Project } from "./projects-store";

// Base64url encode/decode for JSON payloads (safe in URL hashes)
function b64urlEncode(str: string): string {
  // btoa handles latin1; encodeURIComponent → unescape pattern keeps unicode safe
  const bin = unescape(encodeURIComponent(str));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str: string): string {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  const b64 = (str + pad).replace(/-/g, "+").replace(/_/g, "/");
  return decodeURIComponent(escape(atob(b64)));
}

export function encodeProjectPayload(project: Project, token: string): string {
  const payload = { v: 1, t: token, p: project };
  return b64urlEncode(JSON.stringify(payload));
}

export function decodeProjectPayload(encoded: string): { token: string; project: Project } | null {
  try {
    const json = b64urlDecode(encoded);
    const obj = JSON.parse(json);
    if (obj && obj.v === 1 && obj.t && obj.p) {
      return { token: obj.t, project: obj.p as Project };
    }
  } catch {
    return null;
  }
  return null;
}

export function buildMarkingLink(projectOrToken: Project | string, token?: string): string {
  const shortToken = typeof projectOrToken === "string" ? projectOrToken : token;
  if (!shortToken) throw new Error("Missing marking token");
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://lattyscymatichub.lovable.app";
  return `${origin}/verify-assessment?token=${encodeURIComponent(shortToken)}`;
}

export function newToken(): string {
  return crypto.randomUUID();
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  // strip non-digits
  const clean = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export function buildMailtoUrl(email: string, subject: string, body: string): string {
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;
}
