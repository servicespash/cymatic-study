import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { Preferences } from "@capacitor/preferences";
import { Capacitor } from "@capacitor/core";

export const HardwareBridge = {
  async ttsSpeak(text: string, options: { rate: number; pitch: number; lang: string; voiceName?: string }): Promise<void> {
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
      return new Promise<void>((resolve, reject) => {
        window.speechSynthesis.cancel(); // Clear any ongoing speech

        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = options.rate;
        utter.pitch = options.pitch;
        
        // Find best matching voice if available
        if (window.speechSynthesis.getVoices) {
          const voices = window.speechSynthesis.getVoices();
          // Prioritize by voiceName if provided, then by lang
          const voice = voices.find(v => (options.voiceName && v.name === options.voiceName) || v.lang.startsWith(options.lang) || v.lang === options.lang);
          if (voice) utter.voice = voice;
        }

        // Safety timeout to prevent getting stuck
        const wordsCount = text.split(/\s+/).length;
        const estimatedDurationMs = (wordsCount / (options.rate || 1)) * 60 * 1000 * 2; // generous estimate
        const timeoutId = setTimeout(() => {
          console.warn("Speech synthesis safety timeout reached.");
          resolve();
        }, Math.max(5000, estimatedDurationMs));

        utter.onend = () => {
          clearTimeout(timeoutId);
          resolve();
        };

        utter.onerror = (event) => {
          clearTimeout(timeoutId);
          // If interrupted by cancel(), just resolve
          if (event.error === 'interrupted') {
            resolve();
          } else {
            reject(new Error(`Speech synthesis error: ${event.error}`));
          }
        };

        window.speechSynthesis.speak(utter);
      });
    } else {
      throw new Error("Speech synthesis is not supported.");
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
