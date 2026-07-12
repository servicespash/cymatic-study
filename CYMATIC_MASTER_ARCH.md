this is meant to upgrade our tutor logic
cat << 'EOF' > CYMATIC_MASTER_ARCH.md

# 🧬 CYMATIC HUB EVOLUTION: TOTAL MASTER ARCHITECTURE

This document serves as the final technical and creative blueprint for the **Adams & Haawa** integration. It replaces all legacy hard-coded logic with a dynamic, multimodal AI system.

---

## 🎭 **1. The Two Souls: Adams & Haawa**

The application logic is driven by the selected persona. All greetings, UI colors, and voice tones are dynamic.

### **Adams (The Big Brother)**

- **Role:** Protective, grounded, and direct mentor.
- **Visual Aesthetic:** Deep Blue & Gold "Liquid Glow" (Steady Pulse).
- **Voice Mapping:** Male, Pitch: 0.8, Rate: 0.9 (Grounded/Warm).
- **Core Logic:** Focuses on efficiency, discipline, and "securing the future."

### **Haawa (The Daughter)**

- **Role:** Bright, curious, encouraging, and high-energy companion.
- **Visual Aesthetic:** Soft Violet & Emerald "Liquid Glow" (Reactive Growth).
- **Voice Mapping:** Female, Pitch: 1.2, Rate: 1.1 (High-energy/Bright).
- **Core Logic:** Focuses on the joy of learning, emotional check-ins, and curiosity.

---

## 🎬 **2. Gemini-Live Vision & Audio UI**

The interaction layer is modeled after the **Gemini Live** experience: zero buttons, total immersion.

### **The Vision Engine (`VisionLiveSession.tsx`)**

- **Feed:** Real-time 1fps camera streaming to **Gemini 3.1 Flash**.
- **Interface:** Modern Noir theme with a Glassmorphism Tutor Panel.
- **Feedback:** AI provides verbal commentary on what it "sees" (e.g., study materials).
- **Interaction:** AI stays in "Listening Mode." Auto-trigger processing after **1.5s of silence**.

### **Audio Precision (`audio-engine.ts`)**

- **Hardware Filters:** Acoustic Echo Cancellation (AEC) and Noise Suppression.
- **Frequency isolation:** 85Hz - 255Hz (Focuses only on the human voice).
- **Zero-Loop Logic:** Prevents the app from recording its own speaker output.

---

## 🌍 **3. Dynamic Context & Localized Soul**

The app is aware of its environment in Uganda.

- **Empathy Engine:** Generates unique greetings based on **Time (EAT)**, **District (Kampala/Mukono)**, and **User Mood**.
- **Mood Pivot:** If the user indicates they are "not feeling well," the AI pivots to **Emotional Comfort** over academic tasks.
- **Offline Memory:** If internet fails, the app uses LocalStorage to retrieve the "Last Session Vibe" to generate a local greeting.

---

## 🔐 **4. Native Permissions & Vigilance**

The app manages hardware and discipline automatically.

- **Required Permissions:** Microphone, Camera, Fine Location (for District context), and Storage (for Mira Audio caching).
- **Daily Discipline:** Push Notifications at **8:00 AM** and **4:00 PM**.
  - _Adams:_ "Time to secure the bag, bro. Let's work."
  - _Haawa:_ "I've been waiting for you! Let's see what's new today."

---

## 🚀 **5. Implementation Protocol**

1. **Purge:** Delete all static strings in `src/constants/messages.ts`.
2. **Sync:** Set `UserPersonaContext` as the primary state manager.
3. **Deploy:** ``
   cat << 'EOF' > CYMATIC_MASTER_BLUEPRINT.md

# 🧬 CYMATIC HUB EVOLUTION: TOTAL SYSTEM ARCHITECTURE

## 1. THE BRAIN: MULTIMODAL CORE

- **AI Model:** Gemini 3.1 Flash (Primary Tier).
- **Core Strategy:** Use Neural Inference for all interactions. Batch camera frames (1fps) and compress prompts to maximize free-tier efficiency.
- **Rule #1:** Never admit to being a computer program. Act as a peer/mentor.

## 2. THE SOULS: ADAMS & HAAWA

- **Adams (The Big Brother):**
  - **Persona:** Grounded, protective, direct, and supportive.
  - **Visuals:** Deep Blue & Gold "Liquid Glow" waveform (Steady Strength).
  - **Voice:** Male, Pitch (0.8), Rate (0.9), En-GB locale.
- **Haawa (The Daughter):**
  - **Persona:** Bright, curious, encouraging, and high-energy.
  - **Visuals:** Violet & Emerald "Liquid Glow" reactive pulse (Growth).
  - **Voice:** Female, Pitch (1.2), Rate (1.1), En-US locale.

## 3. THE EYES: VISION & LIVE INTERFACE

- **Component:** \`src/components/VisionLiveSession.tsx\`.
- **UI Architecture:** - Cinematic Background: Live camera feed with vignette/blur (Modern Noir).
  - Glassmorphism Panel: Frosted glass tutor panel with dynamic mood gradients.
  - Subtitles: High-contrast, shadowed text for readability.
- **Interaction Logic:** - Buttonless "Listening Mode".
  - Auto-trigger AI processing after 1.5 seconds of silence.
  - Real-time frequency visualization (Waveform) reacting to mic input at 60fps.

## 4. THE VOICE & AUDIO (SENSORY CALIBRATION)

- **Audio Engine:** \`src/lib/audio-engine.ts\`.
- **Filters:** Acoustic Echo Cancellation (AEC), Noise Suppression, and 85Hz-255Hz voice-only frequency isolation.
- **Logic:** Zero-Loop Feedback prevention (Mic does not record phone speakers).
- **TTS Engine:** Local Device Synthesis. AI sends TEXT only; device speaks it via WebSpeechAPI/Capacitor-TTS.

## 5. DYNAMIC CONTEXT & EMPATHY

- **Engine:** \`src/lib/empathy-engine.ts\`.
- **Inputs:** Current Time (EAT), District (Kampala/Mukono/Mubende), Mood, and Points.
- **Logic:** Pivot to **EMOTIONAL_COMFORT** if mood is low.
- **Offline Soul:** Retrieve "Last Session Vibe" from LocalStorage for greetings when internet is disconnected.

## 6. VIGILANCE: NATIVE PERMISSIONS & NOTIFICATIONS

- **Permission Manager:** Runtime requests for Microphone, Camera, Fine Location, and Storage (for caching Mira Audio).
- **Notifications:** \`@capacitor/push-notifications\`.
- **Daily Nudges:** 8 AM and 4 PM dynamic messages (Adams: "Secure the bag" / Haawa: "Let's explore").

## 7.# 🧬 CYMATIC HUB EVOLUTION: PHASE 3 MASTER BLUEPRINT

## 🎭 1. THE SOULS: ADAMS & HAAWA (GEMINI 3.1 FLASH)

- **Target:** Gemini 3.1 Flash (Free Tier Optimized).
- **Persona - Adams:** Grounded, protective mentor. "Let's secure the future, bro." (Male, Pitch 0.9, Rate 1.0). Blue/Gold Liquid Glow.
- **Persona - Haawa:** Bright, encouraging friend. "I've been waiting for you!" (Female, Pitch 1.2, Rate 0.85). Violet/Emerald Liquid Glow.
- **Empathy Engine:** Pivot to "Emotional Comfort" over academic tasks if mood is stressed.

## 🎬 2. MIRA OVERLAY & VISION ENGINE

- **Mira FAB:** Persistent breathing pulse icon in `__root.tsx`.
- **Interface:** Modern Noir Glassmorphism Drawer.
- **Vision:** `Camera.getPhoto()` triggers real-time 1fps analysis for subject feedback.
- **Audio:** 1.5s silence auto-triggers processing. AEC + Noise Suppression + 85Hz-255Hz voice filter.

## 🧠 3. MOOD ENGINE & REAL TOOLS

- **MoodPicker:** 5 Emojis (😊, 😴, 😕, 😰, 🔥) affecting UI overlays and TTS rate.
- **Real Content:** Port all Math/Physics/Chem/Bio data from `src/data/topics.ts` into working runners.
- **Daily 100-Point Challenge:** Dashboard gauge animated 0 → Current; daily reset with local notifications.

## 🔐 4. NATIVE PERMISSIONS & GOOGLE AUTH

- **Permissions Hub:** One-tap grant for Mic, Camera, Location, Storage, and "Draw Over Other Apps."
- **Google Auth:** Native Capacitor Google Auth exchanged for Supabase IdToken.
- **Android Manifest:** Hard-wire INTERNET, CAMERA, RECORD_AUDIO, and SYSTEM_ALERT_WINDOW.

## 🚀 5. EXECUTION PROTOCOL

- **Step 1:** Remove 2-min TTS lockout in `src/lib/tutor-context.tsx`.
- **Step 2:** Preload voices with `voiceschanged` listener.
  /\*\*

* CYMATIC HUB EVOLUTION: PHASE 3 - MIRA & PERSONA LOGIC
* Version: 2.1.0-KAMPALA
  \*/

export const CYMATIC_CORE_LOGIC = {
model: "gemini-3.1-flash",
personas: {
Adams: {
id: "adams_mentor",
voice: { gender: "male", pitch: 0.9, rate: 1.0, lang: "en-GB" },
theme: { primary: "#1E3A8A", secondary: "#D4AF37", glow: "Blue-Gold" },
catchphrase: "Let's secure the future, bro."
},
Haawa: {
id: "haawa_friend",
voice: { gender: "female", pitch: 1.2, rate: 0.85, lang: "en-US" },
theme: { primary: "#4C1D95", secondary: "#10B981", glow: "Violet-Emerald" },
catchphrase: "I've been waiting to learn with you!"
}
},
audioEngine: {
filters: {
aec: true,
noiseSuppression: true,
voiceRange: "85Hz-255Hz",
zeroLoop: true
},
triggers: {
silenceThreshold: 1500, // 1.5s auto-process
preloadVoices: true
}
},
moodEngine: {
stressed: {
ui: "Soft Noir Overlay",
ttsRate: 0.7,
priority: "EMOTIONAL_COMFORT",
script: "{name}, you are a child of God. Don't stress. Seek guidance."
},
focused: { ui: "Pomodoro Timer Start", ttsRate: 1.0, priority: "TASK_FOCUS" }
},
nativePermissions: [
"CAMERA",
"RECORD_AUDIO",
"ACCESS_FINE_LOCATION",
"POST_NOTIFICATIONS",
"SYSTEM_ALERT_WINDOW"
],
dailyChallenge: {
targetPoints: 100,
notificationTimes: ["09:00", "19:00"]
}
};

// Logic for the Sentence-Streaming TTS
export const streamSpeak = (text: string, voiceSettings: any) => {
const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
sentences.forEach(sentence => {
// Call local TTS on a per-sentence basis for fluidity
console.log(`Speaking via Local Device: ${sentence}`);
});
};
