# Deployment & Rollback Strategy

This document outlines the deployment process, version management, and rollback procedures for Latty's Cymatic Hub.

## Table of Contents

- [Versioning](#versioning)
- [Release Management](#release-management)
- [Rollback Procedures](#rollback-procedures)
- [APK Building](#apk-building)
- [Monitoring](#monitoring)

## Versioning

We use semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes or significant new features
- **MINOR**: New features that are backwards compatible
- **PATCH**: Bug fixes and minor improvements

### Build Metadata

During the build process, the following metadata is injected:

```javascript
window.__BUILD_VERSION__ = "1.2.3";
window.__BUILD_COMMIT__ = "abc123def456";
window.__BUILD_TIMESTAMP__ = "2026-07-07T09:30:00Z";
```

This information is automatically captured and stored in localStorage for rollback capabilities.

## Release Management

### Creating a Release

1. Update version in `package.json`:

   ```json
   {
     "version": "1.2.3"
   }
   ```

2. Create a git tag:

   ```bash
   git tag -a v1.2.3 -m "Release v1.2.3: Description of changes"
   git push origin v1.2.3
   ```

3. Push to main branch:

   ```bash
   git push origin main
   ```

4. The GitHub Actions workflow automatically:
   - Builds the web assets
   - Syncs to Android native folder
   - Compiles the APK
   - Creates a release record in the system

### Release History

All releases are tracked in localStorage under the key `releases-history`. Each release contains:

- `version`: Semantic version string
- `timestamp`: Unix timestamp of when the release was created
- `commit`: Full Git commit SHA
- `tag`: Git tag name
- `status`: 'active', 'archived', or 'failed'
- `buildUrl`: URL to the GitHub Actions build
- `notes`: Optional release notes

Maximum of 10 releases are kept in history. Older releases are automatically purged.

## Rollback Procedures

### Automated Rollback (In-App)

If a deployment breaks the site, users can trigger a rollback:

```javascript
import { rollbackToRelease, getReleases } from "@/lib/releases";

// Get available releases
const releases = getReleases();

// Rollback to a specific version
rollbackToRelease("1.2.2");
```

**What happens:**

1. The target release is marked as active in localStorage
2. A rollback request is stored in sessionStorage with:
   - Source version (current)
   - Target version (destination)
   - Timestamp
   - Initiator

3. The app triggers a full reload or redirect to apply the rollback

### Manual Rollback (Git/CI/CD)

For critical issues:

1. **Identify the last working version:**

   ```bash
   git tag -l --sort=-version:refname | head -5
   ```

2. **Revert to the previous commit:**

   ```bash
   git revert HEAD
   git push origin main
   ```

3. **Or force-push to previous tag:**

   ```bash
   git checkout v1.2.2
   git push -f origin main
   ```

4. **GitHub Actions automatically:**
   - Detects the push
   - Rebuilds with the previous code
   - Deploys the new build

### Emergency Rollback (CI/CD Override)

In `vercel.json` or deployment settings:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist/client",
  "env": {
    "ROLLBACK_ENABLED": "true"
  }
}
```

Set `ROLLBACK_ENABLED=false` to temporarily disable deployments.

## APK Building

### Automatic Builds

Every push to `main` automatically triggers an APK build via GitHub Actions:

1. **Workflow**: `.github/workflows/build-apk.yml`
2. **Trigger**: Push to main branch or manual workflow dispatch
3. **Duration**: ~15-30 minutes
4. **Output**: APK available in Actions > Artifacts

### Build Process

```bash
# 1. Install dependencies
npm ci

# 2. Build web assets
npm run build
# Output: dist/client/

# 3. Sync to Android
npx cap sync android

# 4. Compile APK
cd android
./gradlew assembleRelease

# 5. APK artifact
# Output: android/app/build/outputs/apk/release/*.apk
```

### Download APK

1. Go to **Actions** tab in the repository
2. Select the latest **"Build Production APK"** workflow
3. Scroll to **Artifacts** section
4. Download **cymatichub-apk**

The APK is named: `cymatichub-v{BUILD_NUMBER}-{COMMIT_SHORT}-{TIMESTAMP}.apk`

Example: `cymatichub-v42-abc123-20260707_093000.apk`

### Install APK

**On local device:**

```bash
adb install cymatichub-v*.apk
```

**On remote device:**

1. Transfer APK to device (email, cloud storage, etc.)
2. Tap the APK file in file manager
3. Allow installation from unknown sources
4. Tap "Install"

## Monitoring

### Release Tracking API

```javascript
import { getCurrentRelease, getReleases, getBuildVersion } from "@/lib/releases";

// Get current version
const version = getBuildVersion(); // "1.2.3"

// Get active release
const current = getCurrentRelease();
console.log(`Running: v${current.version}`);

// Get release history
const history = getReleases();
history.forEach((r) => {
  console.log(`${r.version} - ${new Date(r.timestamp).toLocaleString()}`);
});
```

### Error Tracking

All rollback and release events are logged to console with `[v0]` prefix:

```javascript
// Initialization
[v0] Release tracking initialized: v1.2.3

// Rollback
[v0] Rollback request queued: 1.2.2

// Pending rollback
[v0] Pending rollback detected: 1.2.3 → 1.2.2
```

### Deployment Checklist

Before deploying to production:

- [ ] All tests pass: `npm run test`
- [ ] No lint errors: `npm run lint:ci`
- [ ] Version updated in `package.json`
- [ ] Git tag created: `git tag v1.2.3`
- [ ] Changelog updated
- [ ] Release notes prepared
- [ ] Previous version tested and verified
- [ ] Rollback plan documented

### Deployment Steps

1. **Create release branch** (optional):

   ```bash
   git checkout -b release/v1.2.3
   ```

2. **Update version**:

   ```bash
   npm version patch  # or minor/major
   ```

3. **Create tag**:

   ```bash
   git tag -a v1.2.3 -m "Release v1.2.3: Brief description"
   ```

4. **Push to main**:

   ```bash
   git push origin main
   git push origin v1.2.3
   ```

5. **Monitor Actions**:
   - GitHub Actions automatically starts building
   - Check status at: `https://github.com/servicespash/lattyscymatichub/actions`

6. **Verify deployment**:
   - Visit: `https://hub.cymatichub.xyz`
   - Check version: Open DevTools → Console → `window.__BUILD_VERSION__`
   - Test core features

7. **If issues detected**:
   ```bash
   npm run build:revert  # Custom script (to be created)
   # OR
   git revert HEAD
   git push origin main
   ```

## Troubleshooting

### APK Build Fails

1. **Check build logs**: GitHub Actions > Build step > View logs
2. **Common issues**:
   - Android SDK not installed: `sdkmanager` will auto-install
   - Gradle cache corrupted: Add `--no-build-cache` flag
   - Out of memory: Increase Java heap: `-Xmx2g`

3. **Manual rebuild**:
   ```bash
   cd android
   ./gradlew clean
   ./gradlew assembleRelease
   ```

### Rollback Doesn't Work

1. **Check localStorage**: `localStorage.getItem('releases-history')`
2. **Verify release exists**: Ensure target version is in history
3. **Clear cache**: Ctrl+Shift+Delete (Chrome) or similar
4. **Manual rollback**: Use Git revert method above

### Version Mismatch

If displayed version doesn't match `package.json`:

1. **Clear browser cache**: Hard refresh (Ctrl+Shift+R)
2. **Check build metadata**: `window.__BUILD_VERSION__`
3. **Rebuild**: Push to main to trigger new build

## Related Files

- **Build workflow**: `.github/workflows/build-apk.yml`
- **Release library**: `src/lib/releases.ts`
- **Release index**: `releases-history` in localStorage
- **Capacitor config**: `capacitor.config.ts`
- **Android build**: `android/app/build.gradle`

## Support

For deployment issues, check:

1. GitHub Actions logs: `.github/workflows/build-apk.yml`
2. Build artifacts: Actions > Latest run > Artifacts
3. Console errors: DevTools > Console
4. Release status: DevTools > Console > `getCurrentRelease()`
