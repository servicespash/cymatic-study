import { useEffect } from "react";
import { BRAND } from "@/lib/constants";

export interface DynamicSEOPayload {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: "website" | "article" | "profile" | "book" | "educational_tool";
  keywords?: string[];
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  locale?: string;
  siteName?: string;
  noIndex?: boolean;
  twitterHandle?: string;
}

export const BASE_SITE_URL = "https://study.cymatichub.xyz";
export const DEFAULT_OG_IMAGE = `${BASE_SITE_URL}/og-image.jpg`;
export const DEFAULT_SITE_NAME = `${BRAND.name} — NCDC Aligned Study Platform`;
export const DEFAULT_AUTHOR = "Isabirye Latif";

/**
 * Generates an array of structured meta tags and canonical links
 * compliant with TanStack Router head() function, Facebook Open Graph,
 * WhatsApp/Telegram/Twitter Card rich sharing standards.
 */
export function generateDynamicSEO(config: DynamicSEOPayload) {
  const {
    title,
    description,
    path = "",
    image = DEFAULT_OG_IMAGE,
    type = "website",
    keywords = [
      "Uganda Education",
      "NCDC Curriculum",
      "O-Level",
      "A-Level",
      "Cymatic Study",
      "UNEB Past Papers",
      "Uganda Secondary School Notes",
    ],
    author = DEFAULT_AUTHOR,
    publishedTime,
    modifiedTime,
    section,
    tags,
    locale = "en_UG",
    siteName = DEFAULT_SITE_NAME,
    noIndex = false,
    twitterHandle = "@cymatichub",
  } = config;

  const fullUrl = path.startsWith("http")
    ? path
    : `${BASE_SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const formattedTitle = title.includes(BRAND.name) ? title : `${title} | ${BRAND.name}`;

  const metaList: Array<Record<string, string>> = [
    { charSet: "utf-8" },
    {
      name: "viewport",
      content: "width=device-width, initial-scale=1, viewport-fit=cover",
    },
    { title: formattedTitle },
    { name: "description", content: description },
    { name: "author", content: author },
    { name: "theme-color", content: "#0a1628" },

    // Search Engine Directives
    {
      name: "robots",
      content: noIndex
        ? "noindex, nofollow"
        : "index, follow, max-image-preview:large, max-snippet:-1",
    },

    // Open Graph / Facebook / LinkedIn / WhatsApp
    { property: "og:site_name", content: siteName },
    { property: "og:type", content: type === "educational_tool" ? "website" : type },
    { property: "og:url", content: fullUrl },
    { property: "og:title", content: formattedTitle },
    { property: "og:description", content: description },
    { property: "og:image", content: image },
    { property: "og:image:secure_url", content: image },
    { property: "og:image:alt", content: formattedTitle },
    { property: "og:image:type", content: "image/jpeg" },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:locale", content: locale },

    // Twitter Cards
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:site", content: twitterHandle },
    { name: "twitter:creator", content: twitterHandle },
    { name: "twitter:title", content: formattedTitle },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
    { name: "twitter:image:alt", content: formattedTitle },
  ];

  if (keywords.length > 0) {
    metaList.push({ name: "keywords", content: keywords.join(", ") });
  }

  if (publishedTime) {
    metaList.push({ property: "article:published_time", content: publishedTime });
  }
  if (modifiedTime) {
    metaList.push({ property: "article:modified_time", content: modifiedTime });
  }
  if (section) {
    metaList.push({ property: "article:section", content: section });
  }
  if (tags && tags.length > 0) {
    tags.forEach((tag) => {
      metaList.push({ property: "article:tag", content: tag });
    });
  }

  return {
    meta: metaList,
    links: [{ rel: "canonical", href: fullUrl }],
  };
}

/**
 * Creates head definition for TanStack Router createFileRoute
 */
export function createRouteHead(config: DynamicSEOPayload) {
  const seo = generateDynamicSEO(config);
  return {
    meta: seo.meta,
    links: seo.links,
  };
}

/**
 * React hook to dynamically update DOM meta tags and OpenGraph tags in real-time
 * during client-side state changes (e.g. dynamic quiz selections, interactive lessons).
 */
export function useDynamicSEO(config: DynamicSEOPayload) {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const formattedTitle = config.title.includes(BRAND.name)
      ? config.title
      : `${config.title} | ${BRAND.name}`;
    document.title = formattedTitle;

    const fullUrl = config.path
      ? config.path.startsWith("http")
        ? config.path
        : `${BASE_SITE_URL}${config.path.startsWith("/") ? config.path : `/${config.path}`}`
      : window.location.href;

    const metaMap: Record<string, string> = {
      description: config.description,
      "og:title": formattedTitle,
      "og:description": config.description,
      "og:url": fullUrl,
      "og:image": config.image || DEFAULT_OG_IMAGE,
      "og:type": config.type || "website",
      "og:site_name": config.siteName || DEFAULT_SITE_NAME,
      "twitter:title": formattedTitle,
      "twitter:description": config.description,
      "twitter:image": config.image || DEFAULT_OG_IMAGE,
      "twitter:card": "summary_large_image",
    };

    if (config.keywords && config.keywords.length > 0) {
      metaMap["keywords"] = config.keywords.join(", ");
    }

    Object.entries(metaMap).forEach(([key, value]) => {
      // Check for property attribute (OG) or name attribute (standard/Twitter)
      let el =
        document.querySelector(`meta[property="${key}"]`) ||
        document.querySelector(`meta[name="${key}"]`);

      if (!el) {
        el = document.createElement("meta");
        if (key.startsWith("og:") || key.startsWith("article:")) {
          el.setAttribute("property", key);
        } else {
          el.setAttribute("name", key);
        }
        document.head.appendChild(el);
      }
      el.setAttribute("content", value);
    });

    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", fullUrl);
  }, [
    config.title,
    config.description,
    config.path,
    config.image,
    config.type,
    config.siteName,
    config.keywords,
  ]);
}

/**
 * Domain-specific preset builders for rapid routing SEO
 */
export const SEOPresets = {
  subject(subjectName: string, classLevel = "Secondary") {
    return generateDynamicSEO({
      title: `${subjectName} Studies & Revision — ${classLevel}`,
      description: `Master ${subjectName} for ${classLevel} Uganda curriculum with interactive notes, NCDC competencies, and AI tutor support.`,
      path: `/lessons?subject=${encodeURIComponent(subjectName)}`,
      section: "Academics",
      keywords: [subjectName, classLevel, "Uganda Curriculum", "NCDC", "UNEB Revision"],
    });
  },

  quiz(quizTitle: string, subject: string) {
    return generateDynamicSEO({
      title: `Practice Quiz: ${quizTitle} (${subject})`,
      description: `Test your understanding of ${quizTitle} in ${subject}. Instant scoring, detailed step explanations, and gamified study XP.`,
      path: `/quizzes?subject=${encodeURIComponent(subject)}`,
      type: "educational_tool",
      keywords: [quizTitle, subject, "Online Quiz", "Uganda Students", "Self-Assessment"],
    });
  },

  lesson(topicTitle: string, subject: string, snippet?: string) {
    return generateDynamicSEO({
      title: `${topicTitle} — ${subject} Study Notes`,
      description:
        snippet ||
        `Comprehensive study notes and activity guides on ${topicTitle} (${subject}). Aligned with current NCDC learning outcomes.`,
      path: `/curriculum`,
      type: "article",
      keywords: [topicTitle, subject, "Study Guide", "Secondary School Uganda"],
    });
  },

  teacher(toolName = "Teacher Management Desk") {
    return generateDynamicSEO({
      title: `${toolName} — Educator & Assessment Portal`,
      description: `Manage classroom performance, generate NCDC competence activities, and track student mastery metrics.`,
      path: "/teacher",
      noIndex: true, // Internal portal
    });
  },
};

export default generateDynamicSEO;
