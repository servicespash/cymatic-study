/**
 * Dynamic SEO metadata generation for TanStack Router routes.
 * Provides consistent OpenGraph, Twitter, canonical, and JSON-LD support.
 */

export interface SEOMetadata {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: "website" | "article" | "profile";
  twitterCard?: "summary" | "summary_large_image" | "app" | "player";
  keywords?: string[];
  author?: string;
  publishedDate?: string;
  modifiedDate?: string;
}

export interface JSONLDSchema {
  "@context": string;
  "@type": string;
  [key: string]: unknown;
}

const BASE_URL = "https://study.cymatichub.xyz";
const DEFAULT_AUTHOR = "Isabirye Latif";
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.jpg`;

/**
 * Generate meta tags array for TanStack Router head() function
 */
export function generateMetaTags(seo: SEOMetadata) {
  const {
    title,
    description,
    canonicalUrl = `${BASE_URL}`,
    ogTitle = title,
    ogDescription = description,
    ogImage = DEFAULT_OG_IMAGE,
    ogType = "website",
    twitterCard = "summary_large_image",
    keywords = [],
    author = DEFAULT_AUTHOR,
  } = seo;

  const meta = [
    { charSet: "utf-8" },
    {
      name: "viewport",
      content: "width=device-width, initial-scale=1, viewport-fit=cover",
    },
    { title },
    { name: "description", content: description },
    { name: "author", content: author },
    ...(keywords.length > 0 ? [{ name: "keywords", content: keywords.join(", ") }] : []),

    // Open Graph
    { property: "og:title", content: ogTitle },
    { property: "og:description", content: ogDescription },
    { property: "og:type", content: ogType },
    { property: "og:url", content: canonicalUrl },
    { property: "og:image", content: ogImage },
    { property: "og:image:alt", content: ogTitle },

    // Twitter
    { name: "twitter:card", content: twitterCard },
    { name: "twitter:title", content: ogTitle },
    { name: "twitter:description", content: ogDescription },
    { name: "twitter:image", content: ogImage },

    // Additional
    { name: "theme-color", content: "#0a1628" },
    { httpEquiv: "x-ua-compatible", content: "IE=edge" },
  ];

  return meta;
}

/**
 * Generate canonical link for TanStack Router head() function
 */
export function getCanonicalLink(url: string) {
  return { rel: "canonical", href: url };
}

/**
 * Generate JSON-LD schema for structured data
 */
export function generateJSONLD(schema: JSONLDSchema) {
  return {
    __html: JSON.stringify(schema),
  };
}

/**
 * Person schema for identity verification
 */
export function getPersonSchema(): JSONLDSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Isabirye Latif",
    url: "https://www.cymatichub.xyz",
    sameAs: [
      "https://www.cymatichub.xyz",
      "https://resonance.cymatichub.xyz",
      "https://study.cymatichub.xyz",
    ],
    jobTitle: "Educational Technologist & Systems Architect",
    worksFor: {
      "@type": "Organization",
      name: "Latty's Cymatic Study",
    },
    email: "latifisabirye123@gmail.com",
  };
}

/**
 * Organization schema for consistent branding across pages
 */
export function getOrganizationSchema(): JSONLDSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Latty's Cymatic Study",
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description: "Interactive study companion for Uganda Secondary Curriculum (NCDC Aligned)",
    sameAs: ["https://www.cymatichub.xyz", "https://resonance.cymatichub.xyz"],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Support",
      email: "cymatichubevolution@gmail.com",
    },
  };
}

/**
 * Article schema for blog/content pages
 */
export function getArticleSchema(data: {
  headline: string;
  description: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  articleBody?: string;
}): JSONLDSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: data.headline,
    description: data.description,
    image: data.image || DEFAULT_OG_IMAGE,
    datePublished: data.datePublished,
    dateModified: data.dateModified || data.datePublished,
    author: {
      "@type": "Person",
      name: data.author || DEFAULT_AUTHOR,
    },
    ...(data.articleBody && { articleBody: data.articleBody }),
  };
}

/**
 * Course schema for lesson/curriculum pages
 */
export function getCourseSchema(data: {
  name: string;
  description: string;
  provider: string;
  educationLevel?: string;
  courseCode?: string;
}): JSONLDSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: data.name,
    description: data.description,
    provider: {
      "@type": "Organization",
      name: data.provider,
      url: BASE_URL,
    },
    ...(data.educationLevel && { educationLevel: data.educationLevel }),
    ...(data.courseCode && { courseCode: data.courseCode }),
  };
}

/**
 * WebPage schema with generic content
 */
export function getWebPageSchema(data: {
  name: string;
  description: string;
  datePublished?: string;
  dateModified?: string;
}): JSONLDSchema {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: data.name,
    description: data.description,
    url: BASE_URL,
    ...(data.datePublished && { datePublished: data.datePublished }),
    ...(data.dateModified && { dateModified: data.dateModified }),
  };
}
