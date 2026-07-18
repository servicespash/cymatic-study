# SEO Implementation Guide

This guide explains how to implement route-level SEO on every page of the application for better search engine indexing.

## Overview

The SEO system provides:

- Dynamic page titles and descriptions
- Open Graph (OG) tags for social sharing
- Twitter Card tags
- Canonical URLs for duplicate prevention
- JSON-LD structured data (Organization, Article, Course, WebPage)
- Automatic meta tag generation

## Quick Start

### 1. Basic Page with generateMetaTags

```typescript
import { createFileRoute } from "@tanstack/react-router";
import { generateMetaTags, getCanonicalLink } from "@/lib/seo";

export const Route = createFileRoute("/lessons")({
  head: () => {
    const meta = generateMetaTags({
      title: "Interactive Lessons - Latty's Cymatic Study",
      description:
        "Explore interactive lessons for Mathematics, Physics, Chemistry, and Biology aligned with Uganda's Senior 1-4 curriculum.",
      canonicalUrl: "https://study.cymatichub.xyz/lessons",
      keywords: ["lessons", "interactive learning", "Uganda curriculum"],
    });

    return {
      meta,
      links: [getCanonicalLink("https://study.cymatichub.xyz/lessons")],
    };
  },
  component: LessonsPage,
});
```

### 2. Article Page with JSON-LD Schema

```typescript
import { generateMetaTags, getArticleSchema } from "@/lib/seo";

export const Route = createFileRoute("/blog/$postId")({
  head: ({ params }) => {
    const meta = generateMetaTags({
      title: `${post.title} - Latty's Cymatic Study Blog`,
      description: post.excerpt,
      canonicalUrl: `https://study.cymatichub.xyz/blog/${params.postId}`,
      ogImage: post.featuredImage,
      ogType: "article",
    });

    const schema = getArticleSchema({
      headline: post.title,
      description: post.excerpt,
      image: post.featuredImage,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      author: post.author,
      articleBody: post.content,
    });

    return {
      meta,
      links: [getCanonicalLink(`https://study.cymatichub.xyz/blog/${params.postId}`)],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(schema),
        },
      ],
    };
  },
  component: BlogPost,
});
```

### 3. Course/Curriculum Page with Course Schema

```typescript
import { generateMetaTags, getCourseSchema } from "@/lib/seo";

export const Route = createFileRoute("/curriculum/$subject")({
  head: ({ params }) => {
    const meta = generateMetaTags({
      title: `${subject.name} Curriculum - Latty's Cymatic Study`,
      description: `Complete ${subject.name} curriculum for Uganda Senior 1-4 with interactive notes and quizzes.`,
      canonicalUrl: `https://study.cymatichub.xyz/curriculum/${params.subject}`,
      keywords: ["curriculum", params.subject.toLowerCase(), "Uganda", "notes", "quizzes"],
    });

    const schema = getCourseSchema({
      name: `${subject.name} Course`,
      description: subject.description,
      provider: "Latty's Cymatic Study",
      educationLevel: "Secondary",
      courseCode: subject.code,
    });

    return {
      meta,
      links: [getCanonicalLink(`https://study.cymatichub.xyz/curriculum/${params.subject}`)],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(schema),
        },
      ],
    };
  },
  component: CurriculumPage,
});
```

## API Reference

### generateMetaTags(options)

Generates an array of meta tags for TanStack Router's `head()` function.

**Parameters:**

```typescript
interface SEOMetadata {
  title: string; // Page title (required)
  description: string; // Meta description (required)
  canonicalUrl?: string; // Canonical URL (defaults to base)
  ogTitle?: string; // OpenGraph title (defaults to title)
  ogDescription?: string; // OpenGraph description (defaults to description)
  ogImage?: string; // OpenGraph image URL
  ogType?: "website" | "article" | "profile"; // OpenGraph type
  twitterCard?: "summary" | "summary_large_image" | "app" | "player";
  keywords?: string[]; // SEO keywords (comma-separated in meta)
  author?: string; // Author name
  publishedDate?: string; // Publication date
  modifiedDate?: string; // Last modified date
}
```

**Returns:** Meta tag objects array

**Example:**

```typescript
const meta = generateMetaTags({
  title: "My Page",
  description: "A great page",
  keywords: ["seo", "example"],
  ogImage: "https://study.cymatichub.xyz/og-image.jpg",
});
```

### getCanonicalLink(url)

Generates a canonical link tag to prevent duplicate content penalties.

**Parameters:**

- `url: string` - The canonical URL

**Returns:** Link tag object

**Example:**

```typescript
const link = getCanonicalLink("https://study.cymatichub.xyz/page");
// Returns: { rel: 'canonical', href: 'https://study.cymatichub.xyz/page' }
```

### getOrganizationSchema()

Generates Organization schema for structured data.

**Returns:** JSON-LD schema object

**Usage:**

```typescript
scripts: [
  {
    type: "application/ld+json",
    children: JSON.stringify(getOrganizationSchema()),
  },
];
```

### getArticleSchema(data)

Generates Article schema for blog posts and news content.

**Parameters:**

```typescript
{
  headline: string;           // Article title
  description: string;        // Article excerpt
  image?: string;             // Featured image URL
  datePublished: string;      // ISO 8601 date
  dateModified?: string;      // ISO 8601 date
  author?: string;            // Author name
  articleBody?: string;       // Article content (plain text)
}
```

**Example:**

```typescript
const schema = getArticleSchema({
  headline: "Advanced Physics Concepts",
  description: "Learn about quantum mechanics",
  datePublished: "2026-07-07T09:30:00Z",
  author: "Dr. Adams",
});
```

### getCourseSchema(data)

Generates Course schema for educational content.

**Parameters:**

```typescript
{
  name: string;               // Course name
  description: string;        // Course description
  provider: string;           // Organization providing the course
  educationLevel?: string;    // e.g., "Secondary", "University"
  courseCode?: string;        // Course code/identifier
}
```

**Example:**

```typescript
const schema = getCourseSchema({
  name: "Mathematics for Senior 2",
  description: "Complete mathematics curriculum",
  provider: "Latty's Cymatic Study",
  educationLevel: "Secondary",
  courseCode: "MATH-S2",
});
```

### getWebPageSchema(data)

Generates generic WebPage schema.

**Parameters:**

```typescript
{
  name: string;               // Page name/title
  description: string;        // Page description
  datePublished?: string;     // ISO 8601 date
  dateModified?: string;      // ISO 8601 date
}
```

## Implementation Checklist

For every route, ensure:

- [ ] Import SEO utilities from `@/lib/seo`
- [ ] Add `head()` function to route definition
- [ ] Provide unique title (under 60 characters for search results)
- [ ] Provide unique description (under 160 characters)
- [ ] Include relevant keywords for SEO
- [ ] Set canonical URL to prevent duplicates
- [ ] Add OG tags for social sharing
- [ ] Include appropriate JSON-LD schema
- [ ] Test with [Google Rich Results Test](https://search.google.com/test/rich-results)
- [ ] Verify in browser DevTools

## Best Practices

### Titles

- Keep between 30-60 characters
- Include primary keyword near the beginning
- Be descriptive and click-worthy
- Include brand name at the end

**Good:** "Physics Lessons - Interactive Tutorials | Latty's Cymatic Study"
**Bad:** "Page 1"

### Descriptions

- Keep between 120-160 characters
- Include primary and secondary keywords
- Be compelling and action-oriented
- Don't just repeat the title

**Good:** "Master physics with interactive lessons, real-world examples, and practice quizzes designed for Uganda's Senior 1-4 curriculum."
**Bad:** "Physics page with lessons and quizzes"

### Keywords

- Include 5-10 relevant keywords per page
- Focus on user intent
- Mix broad and specific terms
- Avoid keyword stuffing

**Good:** `["physics", "lessons", "Uganda curriculum", "interactive learning", "S2"]`
**Bad:** `["physics", "physics lessons", "learn physics", "physics learning", "physics physics physics"]`

### Canonical URLs

- Always include full domain
- Use HTTPS
- Ensure it's a real, accessible URL
- Keep consistent casing

**Good:** `https://study.cymatichub.xyz/lessons`
**Bad:** `lessons` or `study.cymatichub.xyz/lessons` or `HTTPS://HUB.CYMATICHUB.XYZ/LESSONS`

### Open Graph Tags

- Use high-quality images (1200x630px or larger)
- Match OG title/description to page content
- Use relevant og:type (website, article, profile)
- Include Twitter Card tags for social sharing

### JSON-LD Schema

- Use appropriate schema type for content
- Keep schema data accurate and up-to-date
- Validate with [Google Rich Results Test](https://search.google.com/test/rich-results)
- Organization schema should be on every page

## Testing

### Browser DevTools

1. Open page in browser
2. Right-click → Inspect
3. Search for `<meta` and `<script type="application/ld+json"`
4. Verify tags match your configuration

### Google Rich Results Test

1. Visit https://search.google.com/test/rich-results
2. Paste page URL
3. Check for rich result types (Article, Course, etc.)
4. Review any warnings or errors

### Lighthouse

1. Open DevTools → Lighthouse tab
2. Run audit with "SEO" enabled
3. Address any SEO-related issues
4. Target score of 90+

### Open Graph Debugger

1. Visit https://www.facebook.com/sharer/dialog?u=YOUR_URL
2. Verify OG tags are correctly displayed
3. Check image preview and description

## Real-World Examples

### Basic Page

```typescript
export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: generateMetaTags({
      title: "Student Dashboard - Track Your Progress | Latty's Cymatic Study",
      description:
        "View your learning progress, earned points, completed quizzes, and personalized recommendations.",
      canonicalUrl: "https://study.cymatichub.xyz/dashboard",
    }),
    links: [getCanonicalLink("https://study.cymatichub.xyz/dashboard")],
  }),
  component: Dashboard,
});
```

### Dynamic Content Page

```typescript
export const Route = createFileRoute("/quizzes/$quizId")({
  head: ({ params }) => {
    const quiz = useLoaderData({ from: "/quizzes/$quizId" });

    return {
      meta: generateMetaTags({
        title: `${quiz.title} Quiz | Latty's Cymatic Study`,
        description: quiz.description,
        canonicalUrl: `https://study.cymatichub.xyz/quizzes/${params.quizId}`,
        keywords: [quiz.subject.toLowerCase(), "quiz", "practice"],
      }),
      links: [getCanonicalLink(`https://study.cymatichub.xyz/quizzes/${params.quizId}`)],
    };
  },
  component: QuizPage,
});
```

## Troubleshooting

### Meta tags not appearing

- Check `head()` function is returning proper object structure
- Verify route is exported with `export const Route = createFileRoute(...)`
- Check browser DevTools to see actual HTML

### Canonical URL shows wrong domain

- Ensure `canonicalUrl` parameter includes full domain
- Use `https://` not `http://`
- Check for hardcoded URLs if using environment variables

### JSON-LD schema not validating

- Use [Google Rich Results Test](https://search.google.com/test/rich-results)
- Ensure schema properties are valid JSON
- Check for required fields per schema type
- Validate with [Schema.org validator](https://validator.schema.org/)

### Title/description truncated in search results

- Keep title under 60 characters
- Keep description under 160 characters
- Use primary keywords early
- Avoid special characters that break display

## Additional Resources

- [Google Search Central - SEO Guide](https://developers.google.com/search/docs)
- [Schema.org Documentation](https://schema.org/)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Card Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [TanStack Router Head Documentation](https://tanstack.com/router/latest/docs/framework/react/api/router#head)
