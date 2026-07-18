# Quick Reference Guide

Quick commands and snippets for SEO, deployment, and APK building.

## SEO on Any Route

### Minimal SEO Setup

```typescript
import { createFileRoute } from "@tanstack/react-router";
import { generateMetaTags } from "@/lib/seo";

export const Route = createFileRoute("/path")({
  head: () => ({
    meta: generateMetaTags({
      title: "Page Title - Latty's Cymatic Study",
      description: "Your page description here",
    }),
  }),
  component: Component,
});
```

### Full SEO Setup with Schema

```typescript
import { generateMetaTags, getCanonicalLink, getArticleSchema } from "@/lib/seo";

export const Route = createFileRoute("/blog/$postId")({
  head: () => ({
    meta: generateMetaTags({
      title: "Post Title - Latty's Cymatic Study",
      description: "Post description for search results",
      canonicalUrl: "https://study.cymatichub.xyz/blog/slug",
      ogImage: "https://study.cymatichub.xyz/og-image.jpg",
      keywords: ["keyword1", "keyword2", "keyword3"],
    }),
    links: [getCanonicalLink("https://study.cymatichub.xyz/blog/slug")],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          getArticleSchema({
            headline: "Post Title",
            description: "Post excerpt",
            datePublished: "2026-07-07T09:30:00Z",
          }),
        ),
      },
    ],
  }),
  component: BlogPost,
});
```

## Release Management

### Check Current Version

```javascript
// In browser console
window.__BUILD_VERSION__; // "1.2.3"
window.__BUILD_COMMIT__; // "abc123..."
window.__BUILD_TIMESTAMP__; // "2026-07-07T09:30:00Z"
```

### Get Release History

```javascript
import { getReleases, getCurrentRelease } from "@/lib/releases";

getReleases(); // Array of all releases
getCurrentRelease(); // Current active release
```

### Rollback to Previous Version

```javascript
import { rollbackToRelease } from "@/lib/releases";

rollbackToRelease("1.2.2"); // Rollback to v1.2.2
// Page reloads automatically
```

### Manual Git Rollback

```bash
# Revert last commit (creates new commit)
git revert HEAD
git push origin main

# Or checkout previous tag
git checkout v1.2.2
git push -f origin main
```

## APK Building

### Automatic Build (on Main Push)

```bash
git push origin main
# GitHub Actions automatically:
# 1. Builds web assets (npm run build)
# 2. Syncs to Android (npx cap sync android)
# 3. Compiles APK (./gradlew assembleRelease)
# 4. Uploads to GitHub Actions
```

### Download APK

1. Go to **Actions** tab
2. Find **Build Production APK** workflow
3. Scroll to **Artifacts**
4. Download **cymatichub-apk**

### Install on Device

```bash
# Android Debug Bridge
adb install cymatichub-v*.apk

# Or send via email/cloud storage and tap on device
```

### Manual Build (Local)

```bash
# 1. Build web
npm run build
# Output: dist/client/

# 2. Sync to Android
npx cap sync android

# 3. Compile APK
cd android
./gradlew assembleRelease

# APK location: app/build/outputs/apk/release/app-release.apk
```

### Trigger Manual Build

```bash
# Via GitHub CLI
gh workflow run build-apk.yml -b main

# Or via web: Actions > Build Production APK > Run workflow
```

## Build Metadata

### Inject Version Info

```bash
# Automatic when building
npm run build
# Runs: vite build && node scripts/inject-build-metadata.mjs

# Inject into existing build
node scripts/inject-build-metadata.mjs --output-dir dist/client
```

### Access Build Info in Code

```javascript
import { getBuildVersion, getBuildCommit, getCurrentRelease } from "@/lib/releases";

getBuildVersion(); // "1.2.3"
getBuildCommit(); // "abc123def456..."
getCurrentRelease(); // Full release object
```

## Deployment Checklist

```bash
# 1. Update version
npm version patch  # or minor/major
# Updates package.json and creates git tag

# 2. Verify changes
npm run lint:ci
npm run test

# 3. Push to main
git push origin main
git push origin v1.2.3

# 4. Monitor build
# Go to: Actions tab in GitHub
# Watch: "Build Production APK" workflow

# 5. Verify deployment
# Visit: study.cymatichub.xyz
# Check: window.__BUILD_VERSION__ in console

# 6. If issues - rollback
git revert HEAD
git push origin main
```

## Schema Types

### Article (Blog Posts)

```typescript
getArticleSchema({
  headline: "Article Title",
  description: "Short excerpt",
  image: "https://...",
  datePublished: "2026-07-07T09:30:00Z",
  author: "Author Name",
});
```

### Course (Curriculum)

```typescript
getCourseSchema({
  name: "Mathematics S2",
  description: "Full curriculum",
  provider: "Latty's Cymatic Study",
  educationLevel: "Secondary",
  courseCode: "MATH-S2",
});
```

### WebPage (Generic)

```typescript
getWebPageSchema({
  name: "Lessons Page",
  description: "Browse all lessons",
});
```

### Organization (Global)

```typescript
// Automatically included in root route
getOrganizationSchema();
```

## File Locations

| Feature             | Files                                 |
| ------------------- | ------------------------------------- |
| SEO Utilities       | `src/lib/seo.ts`                      |
| Release Management  | `src/lib/releases.ts`                 |
| Release Dashboard   | `src/components/ReleaseDashboard.tsx` |
| Build Metadata      | `scripts/inject-build-metadata.mjs`   |
| APK Workflow        | `.github/workflows/build-apk.yml`     |
| SEO Guide           | `SEO_GUIDE.md`                        |
| Deployment Guide    | `DEPLOYMENT.md`                       |
| Implementation Docs | `IMPLEMENTATION_SUMMARY.md`           |

## Common Issues

### "Meta tags not appearing"

- Check route has `head()` function exported
- Verify return object structure: `{ meta: [...], links: [...] }`
- Hard refresh browser (Ctrl+Shift+R)

### "Build fails with Android SDK error"

- GitHub Actions auto-installs SDK
- Check logs: Actions > Build step > View logs
- Local fix: `sdkmanager --licenses`

### "Rollback doesn't work"

- Check localStorage: `localStorage.getItem('releases-history')`
- Verify version exists in history
- Clear cache: Ctrl+Shift+Delete

### "APK too large"

- Expected: ~100-150MB (includes web assets + native code)
- Check: `ls -lh cymatichub-v*.apk`
- No optimization issues (Gradle cache enabled)

### "Release metadata not injecting"

- Ensure build command runs: `npm run build`
- Check dist/client exists: `ls dist/client/`
- Verify script executes: `node scripts/inject-build-metadata.mjs`

## Environment Variables

### Build Metadata (Injected Automatically)

```javascript
window.__BUILD_VERSION__; // From package.json
window.__BUILD_COMMIT__; // From git
window.__BUILD_BRANCH__; // From git
window.__BUILD_TIMESTAMP__; // Current time
window.__BUILD_NUMBER__; // CI/CD run number
```

### GitHub Actions (For APK Build)

```yaml
JAVA_VERSION: "17"
GRADLE_VERSION: "8.0"
# No additional secrets required
```

## Testing

### SEO Validation

```bash
# Local validation
npm run build
open dist/client/index.html

# Check for:
# 1. Meta tags present in <head>
# 2. JSON-LD script tags in <head>
# 3. Canonical link tags
```

### Release Testing

```javascript
// In browser console
import { createRelease, getReleases, rollbackToRelease } from "@/lib/releases";

// Create test release
createRelease({
  version: "1.0.0-test",
  commit: "abc123",
  tag: "test-tag",
});

// View releases
console.log(getReleases());

// Test rollback
rollbackToRelease("1.0.0-test");
```

## Useful Links

- **Google Rich Results**: https://search.google.com/test/rich-results
- **Schema Validator**: https://validator.schema.org/
- **GitHub Actions**: https://github.com/servicespash/lattyscymatichub/actions
- **Documentation**:
  - SEO: `SEO_GUIDE.md`
  - Deployment: `DEPLOYMENT.md`
  - Implementation: `IMPLEMENTATION_SUMMARY.md`

## Need Help?

1. **SEO Issues**: See `SEO_GUIDE.md` - Troubleshooting section
2. **Deployment Issues**: See `DEPLOYMENT.md` - Troubleshooting section
3. **APK Build Issues**: Check `.github/workflows/build-apk.yml` comments
4. **Code**: Check inline comments in `src/lib/*.ts`
5. **Logs**: GitHub Actions > Latest run > View logs

---

**Version**: 1.0.0
**Last Updated**: 2026-07-07
**Status**: Production Ready ✅
