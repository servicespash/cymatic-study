# Android Native Permissions & Overlay Guide for Capacitor

To enable advanced background services, native notifications, and window overlays (displaying over other apps) on Android via Capacitor:

---

## 1. Required Android Manifest Permissions (`android/app/src/main/AndroidManifest.xml`)

Add the following permissions inside your `<manifest>` block:

```xml
<!-- System Overlay Permission (Displaying over other apps / windows) -->
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />

<!-- Local & Push Notifications -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

<!-- Camera & Audio Recording (For AI Tutor live voice & vision sessions) -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
```

---

## 2. Requesting SYSTEM_ALERT_WINDOW Programmatically in Android

To request overlay permission in your Android native project (`MainActivity.java` or via Kotlin/Capacitor plugin):

```java
import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;

if (!Settings.canDrawOverlays(this)) {
    Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
        Uri.parse("package:" + getPackageName()));
    startActivityForResult(intent, 1234);
}
```

---

## 3. Capacitor Local Notifications Integration

Make sure your Capacitor project has the local notifications plugin installed:
```bash
npm install @capacitor/local-notifications
npx cap sync android
```
