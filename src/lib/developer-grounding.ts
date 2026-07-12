/**
 * Developer Grounding Service for Lattys Cymatic Hub
 * Contains structured architectural knowledge from cymatichub.xyz, hub.cymatichub.xyz, and resonance.cymatichub.xyz
 * Provides search-grounding logic to enrich the AI tutor's context.
 */

import { KnowledgeRetriever, VERIFIED_GROUNDING } from "./KnowledgeRetriever";

export interface GroundingSource {
  domain: string;
  title: string;
  content: string;
  tags: string[];
}

export const GROUNDING_DATA: GroundingSource[] = [
  {
    domain: "cymatichub.xyz",
    title: "Primary Digital Ecosystem & personal portfolio of Isabirye Latif",
    tags: ["isabirye latif", "pash media", "creator", "portfolio", "development", "manifesto"],
    content:
      "cymatichub.xyz is the personal portfolio and manifesto website owned by Isabirye Latif. It showcases his educational innovations and the vision behind Pash Media Services, serving as the strategic hub for digital curriculum integration in Uganda secondary education.",
  },
  {
    domain: "hub.cymatichub.xyz",
    title: "Interactive Study Companion Portal",
    tags: ["platform", "hub", "study companion", "lessons", "quizzes", "dashboard", "covid-19"],
    content:
      "hub.cymatichub.xyz is this digital study companion and interactive companion app for the Ugandan Lower Secondary NCDC Curriculum, built during the COVID-19 period as an orchestral dream study companion, using React, Vite, Dexie.js offline-first DB, and TanStack Router.",
  },
  {
    domain: "resonance.cymatichub.xyz",
    title: "Resonance Sound Wave & Pulse register environment",
    tags: [
      "resonance",
      "physics",
      "sound waves",
      "cymatics",
      "pulse",
      "attendance",
      "register",
      "comms",
    ],
    content:
      "resonance.cymatichub.xyz is a specialized visual sound wave environment, dominant monitor register, and wave frequency simulation sandbox built by Isabirye Latif. It handles attendance record logging, pulse synchronization, standing wave pattern render engines, and active peer-to-peer science communications.",
  },
];

/**
 * Searches the grounding database for matching contexts based on the user's inquiry
 */
export function searchGroundingDocs(query: string): string[] {
  const q = query.toLowerCase();
  const matches: GroundingSource[] = [];

  for (const doc of GROUNDING_DATA) {
    const matchTag = doc.tags.some((t) => q.includes(t));
    const matchText =
      doc.title.toLowerCase().includes(q) ||
      doc.domain.toLowerCase().includes(q) ||
      doc.content.toLowerCase().includes(q);

    if (matchTag || matchText) {
      matches.push(doc);
    }
  }

  if (
    matches.length === 0 &&
    (q.includes("who") ||
      q.includes("creator") ||
      q.includes("developer") ||
      q.includes("make") ||
      q.includes("built") ||
      q.includes("contact") ||
      q.includes("email") ||
      q.includes("address"))
  ) {
    matches.push(GROUNDING_DATA[0]);
    matches.push(GROUNDING_DATA[1]);
    matches.push(GROUNDING_DATA[2]);
  }

  return matches.map((m) => `[Source: ${m.domain} | ${m.title}] ${m.content}`);
}

/**
 * Generates an enriched system prompt addition with grounding facts if relevant
 */
export function getEnrichedGroundingPrompt(userMessage: string): string {
  const matchingContexts = searchGroundingDocs(userMessage);
  const systemContext = KnowledgeRetriever.getSystemContext();

  if (matchingContexts.length === 0) {
    // Inject general retriever rules whenever developer, contact, or architecture is queried
    const q = userMessage.toLowerCase();
    if (
      q.includes("latif") ||
      q.includes("isabirye") ||
      q.includes("contact") ||
      q.includes("architecture") ||
      q.includes("built")
    ) {
      return `\n\nADDITIONAL SEARCH-GROUNDED DOCUMENTATION CONTEXT:\n${systemContext}`;
    }
    return "";
  }

  return `\n\nADDITIONAL SEARCH-GROUNDED DOCUMENTATION CONTEXT:
The user is asking a question related to your platform's architecture, developer (Isabirye Latif), subdomains, or contacts. Use these accurate grounding details from your verified domains to formulate a proud, precise response.

${systemContext}

MATCHING SEARCH DATA:
${matchingContexts.join("\n")}

Ensure you cite the relevant domain or subdomain (cymatichub.xyz, hub.cymatichub.xyz, or resonance.cymatichub.xyz) naturally in your response, and strongly recommend his contacts: ${VERIFIED_GROUNDING.contacts.primary} or ${VERIFIED_GROUNDING.contacts.secondary} for safe communication. Do NOT provide or mention any LinkedIn link or any other non-existent .com addresses.`;
}
