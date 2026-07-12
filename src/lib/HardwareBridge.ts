import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { Preferences } from "@capacitor/preferences";
import { Capacitor } from "@capacitor/core";

export const HardwareBridge = {
  async ttsSpeak(text: string, options: { rate: number; pitch: number; lang: string }) {
    if (Capacitor.isNativePlatform()) {
      await TextToSpeech.speak({
        text,
        lang: options.lang,
        rate: options.rate,
        pitch: options.pitch,
        volume: 1.0,
        category: "playback",
      });
    } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = options.rate;
      utter.pitch = options.pitch;
      window.speechSynthesis.speak(utter);
    }
  },

  async ttsStop() {
    if (Capacitor.isNativePlatform()) {
      await TextToSpeech.stop();
    } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  },

  async setPref(key: string, value: string) {
    await Preferences.set({ key, value });
  },

  async getPref(key: string): Promise<string | null> {
    const { value } = await Preferences.get({ key });
    return value;
  },

  async removePref(key: string) {
    await Preferences.remove({ key });
  },
};
