export type TutorVoice = "male" | "female";
export type TutorPersona = {
  voice: TutorVoice;
  name: "Adams" | "Haawa";
  pitch: number;
  rate: number;
  voiceName?: string; // Optional specific voice name for the TTS engine
  theme: { primary: string; secondary: string; glow: string };
};

export const DEFAULT_PERSONA_CONFIGS: Record<TutorVoice, TutorPersona> = {
  female: {
    voice: "female",
    name: "Haawa",
    pitch: 1.2,
    rate: 0.85,
    theme: { primary: "#4C1D95", secondary: "#10B981", glow: "Violet-Emerald" },
  },
  male: {
    voice: "male",
    name: "Adams",
    pitch: 0.9,
    rate: 1.0,
    theme: { primary: "#1E3A8A", secondary: "#D4AF37", glow: "Blue-Gold" },
  },
};
