import { useEffect, useCallback, useRef } from "react";
import { useTutorStore } from "@/store/useTutorStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTutor } from "@/lib/TutorService";
import { HardwareBridge } from "@/lib/HardwareBridge";

/**
 * useTutorVoice Hook
 * Manages the selection and persistence of tutor personas (Adams/Haawa).
 * Choice is persisted in Supabase 'profiles' table and synced with both
 * useTutorStore (for chat) and useTutor (for Live/TTS service).
 */
export const useTutorVoice = () => {
  const { persona, setPersona } = useTutorStore();
  const tutor = useTutor();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Run a diagnostic check to ensure the hardware voice matches the persona selection
  const runDiagnostic = useCallback(async () => {
    const result = await HardwareBridge.diagnosticVoiceCheck({
      personaName: persona,
      expectedGender: persona === "Adams" ? "male" : "female",
      activeVoiceName: tutor.persona.voiceName,
    });

    if (result.status === "sync_error") {
      console.warn("[Tutor Voice Diagnostic]", result.message);
    }
  }, [persona, tutor.persona.voiceName]);

  // Load persisted persona and preferences from Supabase on mount
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from("profiles")
            .select("tutor_persona")
            .eq("user_id", user.id)
            .maybeSingle();

          if (!error && data && data.tutor_persona) {
            if (data.tutor_persona === "Adams" || data.tutor_persona === "Haawa") {
              setPersona(data.tutor_persona as "Adams" | "Haawa");
            }
          }
        }
      } catch (err) {
        console.warn("[TutorVoice] Profile preferences load bypassed:", err);
      }
    };

    loadPersistedData();
  }, [setPersona, tutor]);

  // Sync store persona with tutor service voice immediately
  useEffect(() => {
    const targetVoice = persona === "Adams" ? "male" : "female";
    tutor.setVoice(targetVoice);
    runDiagnostic();
  }, [persona, tutor, runDiagnostic]);

  const syncToSupabaseDebounced = useCallback(async (updates: any) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
          .from("profiles")
          .update({ tutor_persona: updates.tutor_persona })
          .eq("user_id", user.id);

        if (error) {
          console.warn("[Settings Sync] Failed to persist persona to Supabase:", error.message);
        } else {
          console.log("[Settings Sync] Persona successfully updated in cloud");
        }
      } catch (err) {
        console.warn("[Settings Sync] Error persisting settings:", err);
      }
    }, 1500); // 1.5s debounce to prevent database chatter
  }, []);

  const updatePersona = async (newPersona: "Adams" | "Haawa") => {
    setPersona(newPersona);
    // Immediate audio re-initialization
    tutor.setVoice(newPersona === "Adams" ? "male" : "female");

    syncToSupabaseDebounced({ tutor_persona: newPersona });
    toast.success(`Tutor persona set to ${newPersona}`);
    runDiagnostic();
  };

  const updateVoicePreference = async (updates: { volume?: number; speed?: number }) => {
    // Immediate engine update
    if (updates.volume !== undefined) tutor.setVolume(updates.volume);
    if (updates.speed !== undefined) tutor.setSpeed(updates.speed);
  };

  /**
   * Explicitly validates and returns the correct browser voice name mapped to a persona.
   */
  const getVoiceForPersona = useCallback(
    async (targetPersona: "Adams" | "Haawa") => {
      const voices = await HardwareBridge.getVoices();
      const expectedGender = targetPersona === "Adams" ? "male" : "female";

      // 1. Check for specific custom voice ID stored in service
      const customName = tutor.persona.voiceName;
      if (customName) {
        const found = voices.find((v) => v.name === customName);
        if (found) return found.name;
      }

      // 2. Fallback to best gendered match
      const bestMatch = voices.find((v) => v.gender === expectedGender && v.lang.startsWith("en"));
      return bestMatch?.name || voices[0]?.name || "Default";
    },
    [tutor.persona.voiceName],
  );

  return {
    persona,
    setPersona: updatePersona,
    voice: (persona === "Adams" ? "male" : "female") as const,
    volume: tutor.volume,
    speed: tutor.speed,
    voiceHistory: tutor.voiceHistory,
    updateVoicePreference,
    runDiagnostic,
    getVoiceForPersona,
  };
};
