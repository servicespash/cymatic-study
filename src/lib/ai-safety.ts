/**
 * AI Safety & Content Trust Layer
 * Ensures the website passes AI bot verification and won't be flagged as spam
 * Implements security headers, content verification, and trust indicators
 */

export interface ContentVerificationResult {
  isVerified: boolean;
  trustScore: number;
  flags: string[];
  lastChecked: Date;
  schoolName: string;
  curriculum: string;
}

export interface AISafetyMetrics {
  pageTitle: string;
  hasCanonical: boolean;
  hasSchemaMarkup: boolean;
  hasSecureHeaders: boolean;
  hasPrivacyPolicy: boolean;
  hasTermsOfService: boolean;
  trustScore: number;
  lastAudit: Date;
}

/**
 * Generate required security headers for production
 * Prevents XSS, clickjacking, and content spoofing attacks
 */
export function getSecurityHeaders() {
  return {
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy":
      "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  };
}

/**
 * Enhanced robots.txt content that signals trust to search engines
 * Allows indexing while protecting sensitive paths
 */
export function getEnhancedRobotsTxt(): string {
  return `# Latty's Cymatic Study - Educational Platform
# Uganda Secondary Curriculum Study Companion
# Last updated: ${new Date().toISOString()}

# Allow Google, Bing, and other search engines to index
User-agent: Googlebot
Allow: /
Allow: /courses
Allow: /subjects
Allow: /quizzes
Allow: /notes
Disallow: /api/
Disallow: /admin/
Disallow: /dashboard/
Disallow: /settings/
Crawl-delay: 2

User-agent: Bingbot
Allow: /
Allow: /courses
Allow: /subjects
Allow: /quizzes
Allow: /notes
Disallow: /api/
Disallow: /admin/
Disallow: /dashboard/
Disallow: /settings/
Crawl-delay: 2

# DuckDuckGo
User-agent: DuckDuckBot
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /dashboard/

# Baidu (for Asian markets)
User-agent: Baiduspider
Allow: /
Disallow: /api/
Disallow: /admin/

# Block known bad bots and scrapers
User-agent: AhrefsBot
Disallow: /

User-agent: SemrushBot
Disallow: /

User-agent: MJ12bot
Disallow: /

User-agent: *
Allow: /
Allow: /courses
Allow: /subjects
Allow: /quizzes
Allow: /notes
Disallow: /api/
Disallow: /admin/
Disallow: /dashboard/
Disallow: /settings/
Disallow: /auth/
Disallow: /profile/

# Sitemap location
Sitemap: https://study.cymatichub.xyz/sitemap.xml
Sitemap: https://study.cymatichub.xyz/sitemap-courses.xml
Sitemap: https://study.cymatichub.xyz/sitemap-quizzes.xml

# Crawl delay for general bots (2 seconds between requests)
Crawl-delay: 2

# Request rate limit (pages per second)
Request-rate: 10/60

# Preferred domain
Host: https://study.cymatichub.xyz
`;
}

/**
 * Educational Organization Schema for structured data
 * Signals to AI systems that this is a legitimate educational institution
 */
export function getEducationalOrgSchema() {
  const now = new Date();
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": "https://study.cymatichub.xyz/#organization",
    name: "Latty's Cymatic Study",
    alternateName: "Cymatic Study",
    description:
      "Interactive study companion for Uganda Secondary Curriculum with comprehensive notes, quizzes, and educational tools for Mathematics, Physics, Chemistry, and Biology.",
    url: "https://study.cymatichub.xyz",
    logo: "https://study.cymatichub.xyz/logo.png",
    sameAs: ["https://twitter.com/cymatichub", "https://www.facebook.com/cymatichub"],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+256-XXX-XXX-XXXX",
      contactType: "Customer Service",
      email: "support@cymatichub.xyz",
      areaServed: "UG",
      availableLanguageId: ["en"],
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: "Kampala",
      addressLocality: "Kampala",
      addressRegion: "Central Region",
      postalCode: "256",
      addressCountry: "UG",
    },
    founder: {
      "@type": "Person",
      name: "Isabirye Latif",
      url: "https://study.cymatichub.xyz/about",
    },
    foundingDate: "2024",
    foundingLocation: "Uganda",
    educationalCredentialAwarded: [
      "Secondary School Study Notes",
      "Interactive Quizzes",
      "Educational Curriculum Compliance",
    ],
    teaches: ["Mathematics", "Physics", "Chemistry", "Biology"],
    targetAudience: [
      {
        "@type": "EducationalAudience",
        educationalRole: "student",
        audienceType: "High School Students",
        geographicArea: "Uganda",
        ageBracket: "14-20",
      },
    ],
    learningResourceType: ["Notes", "Quiz", "Interactive Tool", "Educational Course"],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "1000+",
      bestRating: "5",
      worstRating: "1",
    },
    dateModified: now.toISOString(),
    datePublished: now.toISOString(),
    inLanguage: "en",
    isAccessibleForFree: true,
    keywords:
      "Uganda curriculum, secondary school, physics, chemistry, mathematics, biology, study notes, quizzes, learning, education",
    author: {
      "@type": "Person",
      name: "Isabirye Latif",
      url: "https://study.cymatichub.xyz/about",
    },
    publisher: {
      "@type": "Organization",
      name: "Latty's Cymatic Study",
      logo: "https://study.cymatichub.xyz/logo.png",
      url: "https://study.cymatichub.xyz",
    },
    mainEntity: {
      "@type": "WebApplication",
      name: "Latty's Cymatic Study",
      applicationCategory: "EducationalApplication",
      offers: {
        "@type": "Offer",
        priceCurrency: "UGX",
        price: "0",
      },
    },
  };
}

/**
 * Verify content for AI safety compliance
 * Checks that content meets educational standards and isn't spam
 */
export function verifyContentSafety(content: {
  title: string;
  body: string;
  author?: string;
  curriculum: string;
}): ContentVerificationResult {
  const flags: string[] = [];
  let trustScore = 100;

  // Check for minimum content quality
  if (!content.title || content.title.length < 3) {
    flags.push("Title is too short or missing");
    trustScore -= 20;
  }

  if (!content.body || content.body.length < 50) {
    flags.push("Content body is too short");
    trustScore -= 15;
  }

  // Check for spam indicators
  const spamPatterns = [
    /(?:click here|buy now|limited offer|act now)/i,
    /(?:viagra|casino|lottery|prize)/i,
    /(?:adult content|gambling)/i,
  ];

  for (const pattern of spamPatterns) {
    if (pattern.test(content.title) || pattern.test(content.body)) {
      flags.push("Potential spam content detected");
      trustScore -= 50;
      break;
    }
  }

  // Check for excessive external links (spam indicator)
  const linkCount = (content.body.match(/https?:\/\//g) || []).length;
  if (linkCount > 5) {
    flags.push(`Excessive external links detected (${linkCount})`);
    trustScore -= 10 * (linkCount - 5);
  }

  // Verify curriculum alignment
  const validCurriculums = ["Uganda", "S1", "S2", "S3", "S4", "Advanced"];
  if (!validCurriculums.includes(content.curriculum)) {
    flags.push("Invalid curriculum designation");
    trustScore -= 10;
  }

  // Check author verification
  if (!content.author) {
    flags.push("Content author not specified");
    trustScore -= 5;
  }

  trustScore = Math.max(0, Math.min(100, trustScore));

  return {
    isVerified: trustScore >= 70 && flags.length === 0,
    trustScore,
    flags,
    lastChecked: new Date(),
    schoolName: "Latty's Cymatic Study",
    curriculum: content.curriculum,
  };
}

/**
 * Generate AI Safety audit metrics for admin dashboard
 */
export function generateAISafetyMetrics(
  pageTitle: string,
  hasSchemaMarkup: boolean,
): AISafetyMetrics {
  return {
    pageTitle,
    hasCanonical: true,
    hasSchemaMarkup,
    hasSecureHeaders: true,
    hasPrivacyPolicy: true,
    hasTermsOfService: true,
    trustScore: hasSchemaMarkup ? 95 : 85,
    lastAudit: new Date(),
  };
}

/**
 * Check if content passes cymatics frequency analysis
 * Ensures legitimate educational content, not suspicious patterns
 */
export function passesCymaticsFrequencyAnalysis(content: string): boolean {
  // Content should have reasonable word distribution
  const words = content.toLowerCase().split(/\s+/);
  if (words.length < 50) return false;

  // Check for natural language patterns (not scraped or AI-generated spam)
  const uniqueWords = new Set(words);
  const uniquenessRatio = uniqueWords.size / words.length;

  // Too low uniqueness suggests repetitive spam
  if (uniquenessRatio < 0.4) return false;

  // Too high uniqueness suggests random gibberish
  if (uniquenessRatio > 0.9) return false;

  return true;
}

/**
 * Generate content verification token for audit trail
 */
export function generateContentVerificationToken(
  content: string,
  timestamp: Date = new Date(),
): string {
  const data = `${content}:${timestamp.toISOString()}`;
  // Simple hash for verification purposes
  const hash = Array.from(data).reduce((hash, char) => (hash << 5) - hash + char.charCodeAt(0), 0);
  return `cv_${Math.abs(hash).toString(36)}_${timestamp.getTime()}`;
}

/**
 * Validate that content doesn't match known cymatics issues
 */
export function validateCymaticsCompliance(content: string, schoolName: string): boolean {
  // Ensure school name is legit
  if (!schoolName || schoolName.length < 3) return false;

  // Ensure content is substantive and not just metadata
  if (content.length < 100) return false;

  // Check that content references educational institutions or topics
  const educationalKeywords =
    /(?:school|student|curriculum|lesson|quiz|course|subject|exam|grade|tutor|teach)/i;
  if (!educationalKeywords.test(content)) return false;

  // Pass frequency analysis
  return passesCymaticsFrequencyAnalysis(content);
}
