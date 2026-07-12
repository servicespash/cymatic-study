# Tutor Engine Audit Findings

## Weaknesses Spotted

- **TTS Failure Handling**: The `speak` function logs failures to the console but lacks user-facing feedback or recovery mechanisms when TTS fails.
- **Concurrency/Race Conditions**: While `speak` calls `stopSpeaking` before starting, `ttsSpeak` is an asynchronous operation that may introduce race conditions if multiple `speak` requests are triggered rapidly.
- **Persona Hardcoding**: Voice, pitch, and rate settings are hardcoded in `buildPersona` within `TutorService.tsx`. These parameters should be externalized to allow for easier tuning or user-customization.
- **Connection Reliability**: `connectSession` and `disconnectSession` interact with `liveTools` without implementing explicit retry logic or robust connectivity status handling, which may be fragile in flaky network conditions.
- **Audio Overlap**: If `ttsSpeak` takes time to stop or start, there is a risk of audio overlap or stuttering during quick consecutive interactions.
