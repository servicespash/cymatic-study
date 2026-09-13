import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { Preferences } from "@capacitor/preferences";
import { Capacitor } from "@capacitor/core";

export function sanitizeText(text: string): string {
  return text
    .replace(/\*\*/g, "")
    .replace(/\/\//g, ", ")
    .replace(/["'`]/g, "")
    .replace(/_/g, " ")
    .replace(/[#*]/g, "")
    .trim();
}

export const HardwareBridge = {
  async ttsSpeak(
    text: string,
    options: {
      rate: number;
      pitch: number;
      lang: string;
      voiceName?: string;
      gender?: "male" | "female";
      volume?: number;
    },
  ): Promise<void> {
    const sanitizedText = sanitizeText(text);

    if (Capacitor.isNativePlatform()) {
      await TextToSpeech.speak({
        text: sanitizedText,
        lang: options.lang,
        rate: options.rate,
        pitch: options.pitch,
        volume: options.volume ?? 1.0,
        category: "playback",
      });
    } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
      return new Promise<void>((resolve, reject) => {
        window.speechSynthesis.cancel(); // Clear any ongoing speech

        const utter = new SpeechSynthesisUtterance(sanitizedText);
        utter.rate = options.rate;
        utter.pitch = options.pitch;
        utter.volume = options.volume ?? 1.0;

        // Find best matching voice if available
        if (window.speechSynthesis.getVoices) {
          const voices = window.speechSynthesis.getVoices();
          
          let targetVoice: SpeechSynthesisVoice | undefined;

          // 1. Try explicit voiceName if provided
          if (options.voiceName) {
            targetVoice = voices.find(v => v.name === options.voiceName);
          }

          // 2. Try gender-aware selection if no specific voice found
          if (!targetVoice && options.gender) {
            const maleHints = ["male", "google-m", "en-us-x-iom", "en-gb-x-fis", "david", "mark", "premium-m", "natural-m"];
            const femaleHints = ["female", "google-f", "en-us-x-sfg", "en-us-x-tpf", "zira", "samantha", "victoria", "premium-f", "natural-f"];
            
            const hints = options.gender === "male" ? maleHints : femaleHints;
            
            // Priority 1: Exact lang match + hint
            targetVoice = voices.find(v => 
              v.lang === options.lang && 
              hints.some(h => v.name.toLowerCase().includes(h))
            );

            // Priority 2: StartsWith lang match + hint
            if (!targetVoice) {
              targetVoice = voices.find(v => 
                v.lang.startsWith(options.lang.split('-')[0]) && 
                hints.some(h => v.name.toLowerCase().includes(h))
              );
            }
          }

          // 3. Fallback to just language matching
          if (!targetVoice) {
            targetVoice = voices.find(v => v.lang.startsWith(options.lang) || v.lang === options.lang);
          }

          if (targetVoice) utter.voice = targetVoice;
        }

        // Safety timeout to prevent getting stuck
        const wordsCount = text.split(/\s+/).length;
        const estimatedDurationMs = (wordsCount / (options.rate || 1)) * 60 * 1000 * 2; // generous estimate
        const timeoutId = setTimeout(
          () => {
            console.warn("Speech synthesis safety timeout reached.");
            resolve();
          },
          Math.max(5000, estimatedDurationMs),
        );

        utter.onend = () => {
          clearTimeout(timeoutId);
          resolve();
        };

        utter.onerror = (event) => {
          clearTimeout(timeoutId);
          // If interrupted by cancel(), just resolve
          if (event.error === "interrupted") {
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

  async getVoices(): Promise<{ name: string; lang: string; gender: "male" | "female" | "neutral" }[]> {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return [];
    }

    return new Promise((resolve) => {
      let voices = window.speechSynthesis.getVoices();

      const formatVoices = (vList: SpeechSynthesisVoice[]) => {
        const maleHints = ["male", "google-m", "en-us-x-iom", "en-gb-x-fis", "david", "mark"];
        const femaleHints = [
          "female",
          "google-f",
          "en-us-x-sfg",
          "en-us-x-tpf",
          "zira",
          "samantha",
          "victoria",
        ];

        return vList.map((v) => {
          let gender: "male" | "female" | "neutral" = "neutral";
          const nameLower = v.name.toLowerCase();
          if (maleHints.some((h) => nameLower.includes(h))) gender = "male";
          else if (femaleHints.some((h) => nameLower.includes(h))) gender = "female";

          return { name: v.name, lang: v.lang, gender };
        });
      };

      if (voices.length > 0) {
        resolve(formatVoices(voices));
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          voices = window.speechSynthesis.getVoices();
          resolve(formatVoices(voices));
        };
      }
    });
  },

  /**
   * Diagnostic check to ensure hardware TTS state matches desired configuration.
   */
  async diagnosticVoiceCheck(config: {
    personaName: string;
    expectedGender: "male" | "female";
    activeVoiceName?: string;
  }): Promise<{ status: "ok" | "sync_error"; message: string }> {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return { status: "sync_error", message: "Speech synthesis not supported on this device." };
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      return { status: "sync_error", message: "No hardware voices detected." };
    }

    if (config.activeVoiceName) {
      const found = voices.find((v) => v.name === config.activeVoiceName);
      if (!found) {
        return {
          status: "sync_error",
          message: `Stored voice '${config.activeVoiceName}' not found on this device.`,
        };
      }
    }

    return {
      status: "ok",
      message: `Voice engine synchronized for ${config.personaName}.`,
    };
  },
};
