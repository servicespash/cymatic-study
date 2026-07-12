// Strict client-only module. The Capacitor TTS plugin and Web Speech API
// must never load or execute during SSR. Calling any export from the server
// is a no-op (returns immediately) — the module is safe to import from
// isomorphic code, but it does nothing until it runs in a real browser.

import { generateTts } from "./tts-service";

interface Persona {
  name: "Adams" | "Haawa";
  pitch: number;
  rate: number;
  voiceGender: "male" | "female";
}

const PERSONA_CONFIG: Record<string, Persona> = {
  Adams: { name: "Adams", pitch: 0.8, rate: 0.9, voiceGender: "male" },
  Haawa: { name: "Haawa", pitch: 1.2, rate: 1.1, voiceGender: "female" },
};

const isBrowser = (): boolean => typeof window !== "undefined" && typeof document !== "undefined";

const isNativeCapacitor = (): boolean =>
  isBrowser() && Boolean((window as unknown as { Capacitor?: unknown }).Capacitor);

const hasSpeechSynthesis = (): boolean =>
  isBrowser() && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";

// Lazy + browser-gated import so the Capacitor plugin's module code never
// runs on the server. Cached after first successful load.
let ttsModulePromise: Promise<typeof import("@capacitor-community/text-to-speech")> | null = null;
const loadTts = () => {
  if (!isBrowser()) return null;
  if (!ttsModulePromise) {
    ttsModulePromise = import("@capacitor-community/text-to-speech");
  }
  return ttsModulePromise;
};

let currentAudio: HTMLAudioElement | null = null;

export const speakText = async (text: string, personaName: "Adams" | "Haawa") => {
  if (!isBrowser()) return;

  // Stop any current audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  // Try High-Fidelity Edge TTS first (via Server Function)
  try {
    const response: any = await generateTts({ text, persona: personaName });
    if (response && "audioData" in response) {
      const audioSrc = `data:audio/mp3;base64,${response.audioData}`;
      currentAudio = new Audio(audioSrc);
      await currentAudio.play();
      return;
    }
  } catch (error) {
    console.warn("High-fidelity TTS failed, falling back to local TTS:", error);
  }

  const persona = PERSONA_CONFIG[personaName];

  if (isNativeCapacitor()) {
    const mod = await loadTts();
    if (!mod) return;
    await mod.TextToSpeech.speak({
      text,
      lang: "en-US",
      rate: persona.rate,
      pitch: persona.pitch,
      volume: 1.0,
      category: "playback",
    });
    return;
  }

  if (!hasSpeechSynthesis()) return;

  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();

  let targetVoice: SpeechSynthesisVoice | undefined;

  // Hardened Android and WebView system voice classification engine
  if (personaName === "Adams") {
    targetVoice = voices.find(
      (v) =>
        v.lang.startsWith("en") &&
        (v.name.toLowerCase().includes("male") ||
          v.name.includes("google-m") ||
          v.name.includes("en-us-x-iom") ||
          v.name.includes("en-gb-x-fis")),
    );
  } else {
    targetVoice = voices.find(
      (v) =>
        v.lang.startsWith("en") &&
        (v.name.toLowerCase().includes("female") ||
          v.name.includes("google-f") ||
          v.name.includes("en-us-x-sfg") ||
          v.name.includes("en-us-x-tpf")),
    );
  }

  // Absolute baseline fallback array sequence for limited devices
  if (!targetVoice) {
    const enVoices = voices.filter((v) => v.lang.startsWith("en"));
    targetVoice = personaName === "Adams" ? enVoices[1] || enVoices[0] : enVoices[0];
  }

  if (targetVoice) utterance.voice = targetVoice;
  utterance.pitch = persona.pitch;
  utterance.rate = persona.rate;

  window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = async () => {
  if (!isBrowser()) return;

  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  if (isNativeCapacitor()) {
    const mod = await loadTts();
    if (!mod) return;
    await mod.TextToSpeech.stop();
    return;
  }
  if (!hasSpeechSynthesis()) return;
  window.speechSynthesis.cancel();
};
