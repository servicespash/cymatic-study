# Mobile App Installation Prompt Implementation Guide

## Overview

After successful login on web or desktop, users are prompted to install the native mobile app. The prompt displays a QR code for easy scanning and a direct download link to the latest APK release from GitHub.

## Features

### 1. Post-Login Modal Prompt

- Shows only to authenticated users on web/desktop
- Automatically fetches latest APK from GitHub
- Displays QR code for instant setup
- Provides direct download link
- Includes release notes and version info
- Respects user dismissal (24-hour cooldown)

### 2. QR Code Generation

- Real-time generation from latest APK download URL
- Uses free QR code API (qrserver.com)
- Direct mobile browser scanning support
- No additional dependencies needed

### 3. GitHub Release Integration

- Automatically fetches latest release
- Extracts APK filename and size
- Caches release info (configurable)
- Handles API rate limiting gracefully
- Falls back gracefully if GitHub is unavailable

### 4. Installation Detection

- Detects if app already installed
- Skips prompt for native app users
- Detects PWA installation
- Detects Capacitor/Cordova environments

## API Reference

### Hook: `useMobileInstallPrompt(isAuthenticated: boolean)`

Main hook for managing mobile install prompts.

```typescript
import { useMobileInstallPrompt } from '@/hooks/use-mobile-install-prompt';

export function MyPage() {
  const { user } = useAuth();
  const {
    show,              // Display the prompt?
    loading,           // Currently fetching?
    error,             // Error message
    releaseInfo,       // GitHub release data
    dismissPrompt,     // Dismiss function
    installDetected,   // App already installed?
  } = useMobileInstallPrompt(!!user);

  if (!show) return null;

  return (
    <div>
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      {releaseInfo && (
        <>
          <img src={releaseInfo.qrCodeUrl} alt="Download QR" />
          <a href={releaseInfo.downloadUrl}>Download APK</a>
          <button onClick={dismissPrompt}>Not Now</button>
        </>
      )}
    </div>
  );
}
```

**Parameters:**

- `isAuthenticated` (boolean): User is logged in

**Returns:**

```typescript
{
  show: boolean;              // Show prompt?
  loading: boolean;           // Loading release info?
  error: string | null;       // Error message
  releaseInfo: MobileReleaseInfo | null;  // GitHub release data
  installDetected: boolean;   // App already installed?
  dismissPrompt: () => void;  // Hide prompt
  resetPrompt: () => void;    // Reset for testing
}
```

### Hook: `useInstallationState()`

Tracks app installation state.

```typescript
import { useInstallationState } from '@/hooks/use-mobile-install-prompt';

export function App() {
  const { isInstalled } = useInstallationState();

  return (
    <>
      {isInstalled ? <NativeApp /> : <WebApp />}
    </>
  );
}
```

### Utility: `generateQRCode(url: string): string`

Manually generate QR code URLs.

```typescript
import { generateQRCode } from "@/hooks/use-mobile-install-prompt";

const qrUrl = generateQRCode("https://example.com/app.apk");
// Returns: https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=...
```

### Component: `<MobileInstallPrompt />`

Complete modal component, ready to use.

```typescript
import { MobileInstallPrompt } from '@/components/MobileInstallPrompt';

export function RootLayout() {
  return (
    <>
      <Header />
      <Main />
      <MobileInstallPrompt />
    </>
  );
}
```

**Features:**

- Automatic modal rendering
- QR code display
- Direct download button
- Copy-link button
- Version and size info
- Release notes expandable section
- Responsive design
- Dark mode support

## Installation

The component is already integrated into the root layout. No additional setup needed!

### Already Included

✅ `src/components/MobileInstallPrompt.tsx` - Modal component
✅ `src/hooks/use-mobile-install-prompt.ts` - Hook and utilities
✅ `src/routes/__root.tsx` - Already integrated

## Usage

### 1. Basic Integration (Already Done)

The component is automatically rendered in your root layout and shows when:

- User is authenticated
- Not dismissed in last 24 hours
- App not already installed
- Running on web/desktop (not native)

### 2. Custom Implementation

For advanced use cases:

```typescript
import { useMobileInstallPrompt } from '@/hooks/use-mobile-install-prompt';

export function CustomInstallPrompt() {
  const { user } = useAuth();
  const {
    show,
    loading,
    releaseInfo,
    dismissPrompt,
  } = useMobileInstallPrompt(!!user);

  if (!show || !releaseInfo) return null;

  return (
    <div className="custom-modal">
      <h2>Get the app on your phone</h2>

      {loading ? (
        <Spinner />
      ) : (
        <>
          <img
            src={releaseInfo.qrCodeUrl}
            alt="Scan to download"
            className="qr-code"
          />

          <a
            href={releaseInfo.downloadUrl}
            className="btn-primary"
            download
          >
            Download v{releaseInfo.version}
          </a>

          <p className="text-sm text-gray-500">
            Size: {releaseInfo.apkSize}
          </p>

          <button
            onClick={dismissPrompt}
            className="btn-secondary"
          >
            Maybe later
          </button>
        </>
      )}
    </div>
  );
}
```

### 3. Testing

```typescript
import { useMobileInstallPrompt } from '@/hooks/use-mobile-install-prompt';

export function TestComponent() {
  const prompt = useMobileInstallPrompt(true);

  // Force show prompt for testing
  const handleTest = () => {
    prompt.resetPrompt();
  };

  return (
    <div>
      <button onClick={handleTest}>Test Install Prompt</button>
      {prompt.show && <MobileInstallPrompt />}
    </div>
  );
}
```

## Data Flow

```
User Logs In
    ↓
useMobileInstallPrompt() initializes
    ↓
Check if dismissed (24h cooldown)
    ↓
Check if already installed
    ↓
Fetch latest GitHub release (cached)
    ↓
Generate QR code URL
    ↓
Display modal
    ↓
User scans QR or clicks download
    ↓
APK downloads
    ↓
User installs app
    ↓
Next login: Native app runs instead
```

## GitHub Release Integration

### How It Works

1. Hook fetches from GitHub API:

   ```
   GET https://api.github.com/repos/servicespash/lattyscymatichub/releases/latest
   ```

2. Extracts APK asset:

   ```json
   {
     "name": "app-release.apk",
     "browser_download_url": "https://github.com/.../releases/download/v1.0.0/app.apk",
     "size": 52428800
   }
   ```

3. Generates QR code:
   ```
   https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=<encoded-apk-url>
   ```

### Requirements

- GitHub repository: `servicespash/lattyscymatichub`
- Latest release must have an `.apk` asset
- Public repository access

### Customization

To use a different repository:

```typescript
// In src/hooks/use-mobile-install-prompt.ts
// Update the fetch URL:

const response = await fetch("https://api.github.com/repos/YOUR_ORG/YOUR_REPO/releases/latest");
```

## Storage & Persistence

### LocalStorage Keys

```typescript
// Dismissed flag (24h cooldown)
"mobile_install_prompt_dismissed";

// Last check timestamp
"mobile_last_install_check";
```

### Reset State

```typescript
// Clear dismissal
localStorage.removeItem("mobile_install_prompt_dismissed");
localStorage.removeItem("mobile_last_install_check");

// Or use the hook
const prompt = useMobileInstallPrompt(true);
prompt.resetPrompt();
```

## Customization

### Change Dismissal Duration

```typescript
// In src/hooks/use-mobile-install-prompt.ts
const dismissalWindow = 24 * 60 * 60 * 1000; // 24 hours
```

### Change Check Interval

```typescript
// In src/hooks/use-mobile-install-prompt.ts
const INSTALL_CHECK_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 days
```

### Change QR Code Size

```typescript
// In src/hooks/use-mobile-install-prompt.ts
const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodedUrl}`;
```

### Custom Modal Styling

Edit `src/components/MobileInstallPrompt.tsx` styles directly.

## Error Handling

### GitHub API Unreachable

If GitHub is down, the prompt gracefully fails:

- Error message displayed: "Failed to fetch latest release"
- Prompt will retry on next login
- User can manually visit GitHub releases

### Invalid APK Asset

If latest release has no APK:

- Warning logged to console
- Prompt doesn't show
- User can download from GitHub manually

### Network Errors

- Retry on next session
- Dismissal still honored
- Error logged for debugging

## Performance

### Optimization

- Release info cached per session
- QR code URL generated client-side
- No heavy dependencies
- ~2KB additional bundle size
- API calls cached by browser

### Cache Strategy

```
First login: Fetch from GitHub (5 requests)
Same session: Use cached release (0 requests)
After 7 days: Fetch again
After dismiss: Wait 24 hours for next prompt
```

## Mobile Download Flow

### Android User Journey

1. **Web login** → Installation prompt shows
2. **Scans QR** → Mobile browser downloads APK
3. **Installation begins** → System prompts for install
4. **App installed** → Next login uses native app
5. **Auto-updates** → Via GitHub Actions workflow

### Desktop User Journey

1. **Desktop login** → Installation prompt shows
2. **Clicks download** → APK saved to downloads
3. **Transfer to phone** → Manual transfer via USB/cloud
4. **Installation** → User opens APK on phone
5. **App installed** → Same as Android flow

## Analytics

### Track Installation Prompts

```typescript
// Add to MobileInstallPrompt component
useEffect(() => {
  if (show) {
    analytics.track("mobile_install_prompt_shown", {
      version: releaseInfo?.version,
      timestamp: new Date(),
    });
  }
}, [show]);

// Track downloads
const handleDownload = () => {
  analytics.track("mobile_app_downloaded", {
    version: releaseInfo?.version,
  });
};
```

## Best Practices

1. **Always provide fallback** for download failures
2. **Test QR codes** before release
3. **Monitor GitHub API** usage
4. **Include release notes** in GitHub releases
5. **Sign APK properly** for production
6. **Test prompt flow** on web and desktop
7. **Track download metrics** for engagement
8. **Update GitHub release** before web updates

## Troubleshooting

### QR Code Not Showing

**Check:**

- GitHub API is accessible
- Latest release has APK asset
- Browser allows image from qrserver.com

**Solution:**

```typescript
// Add error boundary
if (!releaseInfo?.qrCodeUrl) {
  return <fallbackUI />;
}
```

### Prompt Never Shows

**Check:**

- User is authenticated
- Not dismissed in last 24 hours
- Not running native app
- App not already installed

**Test:**

```typescript
const prompt = useMobileInstallPrompt(true);
prompt.resetPrompt(); // Force show
```

### Download Link Broken

**Check:**

- GitHub release still exists
- APK file still available
- Browser allows downloads

**Fallback:**

```
https://github.com/servicespash/lattyscymatichub/releases/latest
```

## Support

For issues or questions:

- Check console for error messages
- Verify GitHub release exists
- Test QR code generation
- Check network requests in DevTools

## References

- `src/components/MobileInstallPrompt.tsx` - Component
- `src/hooks/use-mobile-install-prompt.ts` - Hook implementation
- `src/routes/__root.tsx` - Integration point
- `.github/workflows/build-apk.yml` - APK build workflow
