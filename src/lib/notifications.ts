import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";

export async function scheduleDailyNudges(personaName: "Adams" | "Haawa") {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== "granted") {
      const req = await LocalNotifications.requestPermissions();
      if (req.display !== "granted") return;
    }

    // Clear existing to avoid duplicates
    await LocalNotifications.cancel({ notifications: [{ id: 600 }, { id: 1200 }, { id: 1800 }] });

    const messages = {
      Adams: [
        {
          id: 600,
          hour: 6,
          body: "Rise and shine, bro. The day belongs to those who work for it.",
        },
        { id: 1200, hour: 12, body: "Midday hustle! Keep that brain sharp." },
        { id: 1800, hour: 18, body: "Sun's setting, but the grind stays. One more quiz?" },
      ],
      Haawa: [
        { id: 600, hour: 6, body: "Sunrise, my dear. A beautiful day to seek knowledge." },
        { id: 1200, hour: 12, body: "High noon. Take a breath, then back to the light." },
        { id: 1800, hour: 18, body: "Evening reflection. You did well today. Rest now." },
      ],
    };

    const selected = messages[personaName];

    await LocalNotifications.schedule({
      notifications: selected.map((m) => ({
        title: "Cymatic Study",
        body: m.body,
        id: m.id,
        schedule: { on: { hour: m.hour, minute: 0 }, repeats: true, allowWhileIdle: true },
        sound: "res://raw/notification_sound", // Optional: needs to exist in android/res/raw
        smallIcon: "res://drawable/ic_stat_name", // Optional: needs to exist
      })),
    });

    console.log(`Scheduled daily nudges for ${personaName}`);
  } catch (e) {
    console.error("Failed to schedule notifications", e);
  }
}
