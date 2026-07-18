import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.latifisabirye.cymatichub",
  appName: "Cymatic Study",
  webDir: "dist/client",
  server: {
    androidScheme: "https",
    cleartext: true,
  },
  plugins: {
    Camera: {
      androidPermissions: [
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
        "android.permission.READ_MEDIA_IMAGES",
        "android.permission.READ_MEDIA_VIDEO",
        "android.permission.READ_MEDIA_AUDIO",
      ],
    },
    TextToSpeech: {},
    LocalNotifications: {
      smallIcon: "ic_stat_icon",
      iconColor: "#7c3aed",
    },
    SpeechRecognition: {},
    Filesystem: {},
    Geolocation: {},
    Permissions: {},
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
