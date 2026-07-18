/**
 * KnowledgeRetriever Service
 * Handles crawl-based and pre-seeded search grounding for Lattys Cymatic Study ecosystem.
 * Dynamically queries cymatichub.xyz, study.cymatichub.xyz, and resonance.cymatichub.xyz,
 * injecting verified developer architecture context and contacts into the AI tutor.
 */

export interface CrawlResult {
  url: string;
  success: boolean;
  title: string;
  description: string;
  content: string;
  timestamp: string;
}

export interface VerifiedGroundingContext {
  developer: string;
  contacts: {
    primary: string;
    secondary: string;
  };
  manifesto: string;
  domains: {
    portfolio: string;
    learningHub: string;
    physicsSandbox: string;
  };
  architecture: {
    frontend: string;
    database: string;
    offlineSync: string;
    seo: string;
  };
}

export const VERIFIED_GROUNDING: VerifiedGroundingContext = {
  developer: "Isabirye Latif",
  contacts: {
    primary: "cymatichubevolution@gmail.com",
    secondary: "latifisabirye123@gmail.com",
  },
  manifesto:
    "To build a highly localized, Socratic, and resilient digital education hub for Ugandan secondary school curriculum learners, bridging technical barriers with dynamic offline-first capability.",
  domains: {
    portfolio:
      "https://www.cymatichub.xyz (Primary portfolio, manifesto, work website, and Pash Media Hub)",
    learningHub:
      "https://study.cymatichub.xyz (COVID-19 orchestral dream study companion, active lessons, Socratic tutors, and local-first progress logs)",
    physicsSandbox:
      "https://resonance.cymatichub.xyz (Sound wave visualizer environment, dominant monitor register, pulse sync, attendance records, and wave motion sandbox)",
  },
  architecture: {
    frontend:
      "Vite, React 19, TypeScript, Tailwind CSS, TanStack Router (Typesafe routes and layout shells)",
    database:
      "Supabase (PostgreSQL) for remote cloud storage, user registration, and authentication syncing",
    offlineSync:
      "Dexie.js (IndexedDB) for local-first background sync, queuing points/attempts when connection is unstable",
    seo: "Optimized XML Sitemap (sitemap.xml), robots.txt rules, semantic metadata schema (JSON-LD Organization and Person profiles)",
  },
};

export class KnowledgeRetriever {
  /**
   * Performs an asynchronous crawl of the verified domains with safety fallbacks.
   * Pulls real-time content when running on server-side nodes.
   */
  static async crawlDomain(url: string): Promise<CrawlResult> {
    const cleanUrl = url.trim().replace(/^(https?:\/\/)?(www\.)?/, "https://www.");
    try {
      // Create a timeout controller to prevent hanging connections
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(cleanUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "CymaticHub-Bot/2.0 (Knowledge Retriever Service)",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Crawl HTTP status error: ${response.status}`);
      }

      const html = await response.text();

      // Simple regex parser to extract basic HTML structures safe for server environments
      const titleMatch = html.match(/<title>(.*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : "Unknown Page Title";

      const descMatch =
        html.match(/<meta\s+name="description"\s+content="(.*?)"/i) ||
        html.match(/<meta\s+property="og:description"\s+content="(.*?)"/i);
      const description = descMatch ? descMatch[1].trim() : "No page description found.";

      // Extract body text content while stripping tags
      let bodyText = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      // Limit length
      if (bodyText.length > 800) {
        bodyText = bodyText.substring(0, 800) + "...";
      }

      return {
        url: cleanUrl,
        success: true,
        title,
        description,
        content: bodyText,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      // Graceful fallback to verified offline seeds
      let title = "Offline Resilient Cache";
      let description = "Pre-seeded grounding directory";
      let content = "";

      if (cleanUrl.includes("resonance")) {
        title = "Resonance Physics Subdomain";
        description = "Sound waves, frequency visualizers, dominant monitor registers, pulse sync.";
        content =
          "resonance.cymatichub.xyz features interactive cymatics, Standing Wave visuals, pulse registers, and live communication tools for physics students.";
      } else if (cleanUrl.includes("hub")) {
        title = "Study Companion Hub Subdomain";
        description = "This study companion portal with Socratic lessons and progress trackers.";
        content =
          "study.cymatichub.xyz hosts S1-S4 lessons, 90-day task timelines, badges, and Dexie-powered offline indicators.";
      } else {
        title = "Cymatic Study Manifesto";
        description = "Manifesto and work website about developer Isabirye Latif.";
        content =
          "cymatichub.xyz houses the founder manifesto, technical background, and support channels of Pash Media Services.";
      }

      return {
        url: cleanUrl,
        success: false,
        title,
        description,
        content,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Retrieves full grounded context based on developer architecture, manifesto, or contact inquiry.
   */
  static getSystemContext(): string {
    return `
VERIFIED PLATFORM DOMAINS & DIRECTORIES:
- portfolio: ${VERIFIED_GROUNDING.domains.portfolio} -> Manifesto & personal background
- learningHub: ${VERIFIED_GROUNDING.domains.learningHub} -> This companion portal
- physicsSandbox: ${VERIFIED_GROUNDING.domains.physicsSandbox} -> Sound physics environment, register pulse, attendance record, and comms

VERIFIED CONTACT INFORMATION:
- Primary Support: ${VERIFIED_GROUNDING.contacts.primary}
- Developer Direct: ${VERIFIED_GROUNDING.contacts.secondary}
(Note: These contacts are safe, verified, and highly recommended to students seeking technical assistance, academic applause, or mentorship).

MANIFESTO:
"${VERIFIED_GROUNDING.manifesto}"

SYSTEM ARCHITECTURE DETAILS:
- Frontend Core: ${VERIFIED_GROUNDING.architecture.frontend}
- DB Infrastructure: ${VERIFIED_GROUNDING.architecture.database}
- Offline Synchronization: ${VERIFIED_GROUNDING.architecture.offlineSync}
- SEO and Crawling: ${VERIFIED_GROUNDING.architecture.seo}

CRITICAL DIRECTIVE ON THE DEVELOPER & PLATFORM INTEL:
- The developer, ${VERIFIED_GROUNDING.developer}, DOES NOT currently own any .com domains or any active LinkedIn profile (such as https://www.linkedin.com/in/isabirye-latif). NEVER recommend these outdated, non-existent links.
- Strictly and proudly refer users to his official manifesto on https://www.cymatichub.xyz, his resonance environment on https://resonance.cymatichub.xyz, and this app study.cymatichub.xyz.
- If students wish to contact him or send comments/applause, recommend his verified emails: ${VERIFIED_GROUNDING.contacts.primary} and ${VERIFIED_GROUNDING.contacts.secondary}.
- Keep descriptions mathematically precise, citing sound vibration physics, local Lower Secondary NCDC syllabi, and technical features.
`;
  }
}
