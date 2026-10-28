# Architecture Plan: Decoupling Cohort Chat & AI Tutor Workspace

Decouple the collaborative Cohort Peer Chat (`/chat`) from the dedicated AI Tutor Workspace (`/tutor`), restoring multi-student peer channels with AI moderation in `/chat` while upgrading the Tutor Workspace drawer (`/tutor`) with the Google Gemini aesthetic, subject hubs, live transcript search, and 100% dynamic session history from `useTutorStore`.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The architectural separation between the multi-student Cohort Room (`/chat`) and the private AI Tutor Workspace (`/tutor`) is strictly enforced:
> - **`/chat` (Peer Cohort Network)**: Restored to multi-student channels (`#general-study`, `#stem-labs`, `#programming-projects`, `#exam-revision`), active student presence list, teacher announcement pins, and an AI co-moderator. Solo Gemini zero-states and solo drawer controls are removed.
> - **`/tutor` (AI Tutor Page)**: The designated home for all Gemini-style dynamic features: rotating greetings ("Your move, Latif!", "What should we focus on?", "What's next, Latif?"), adaptive suggestions across STEM/Coding/Design/Video/Docs, and the mobile Gemini Workspace Drawer (`ChatSidebar.tsx`) backed 100% dynamically by `useTutorStore` with pin toggles, search filtering, and subject hubs. Zero hardcoded session titles.

- **Confirmed Decision 1**: Cohort Chat room combines structured peer study channels with live student presence and teacher announcements, assisted by an AI co-facilitator.
- **Confirmed Decision 2**: Tutor Workspace drawer uses the Gemini mobile drawer pattern with real dynamic sessions from `useTutorStore`, live search filtering, pin actions, subject domain hubs, and user account status.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Cohort Chat (`/chat`)**: Multi-user collaboration environment where classmates and teachers interact across subject channels with live presence indicators, document/file sharing, and an in-room AI study facilitator.
  2. **AI Tutor Workspace (`/tutor`)**: Dedicated, highly personalized AI tutoring experience powered by multi-domain prompt intelligence (STEM, React/TypeScript/Docker, UI design, video editing, LaTeX/docs). Features rotating Gemini greetings, memory-driven adaptive suggestion cards, and a Gemini workspace drawer with real session history.
- **Target Audience**: Students, teachers, and school administrators engaging in both peer collaboration and deep 1-on-1 tutoring.
- **Key Value**: Eliminates confusion between group cohort interactions and solo AI tutoring while delivering an authentic Gemini-grade workspace experience without mock or hardcoded data.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Cohort Collaboration Flow (`/chat`)**:
   - User navigates to `/chat`.
   - Sees the peer channels sidebar (`#general-study`, `#stem-labs`, `#programming-projects`, `#exam-revision`) and online classmates list.
   - Switches channels, posts messages, shares attachments, or tags the AI co-moderator for collective explanations.
   - Pinned teacher announcements provide guidance at the top of the feed.

2. **AI Tutor Workspace Flow (`/tutor`)**:
   - User enters `/tutor`.
   - On zero-state: greeted with dynamic rotating salutations ("Your move, Latif!", "What should we focus on?") and interactive domain cards (STEM, Coding, UI Design, Video Editing, LaTeX Docs).
   - Clicking a card immediately inputs and streams the AI Tutor answer with optional voice read-aloud.
   - User opens the **Tutor Workspace Drawer** (via menu button):
     - Sees "+ New Session" primary pill.
     - Enters a search query to instantly filter past sessions in real time.
     - Explores subject hubs ("Students", "Images", "Videos", "Library", "Code & Docs").
     - Browses dynamic **Recents** loaded straight from `useTutorStore.sessions` (showing real titles, relative timestamps, and pin icons).
     - Clicks any session to immediately resume; clicks the pin icon to keep favorites on top.
     - Profile footer displays user avatar, name ("Latif Isabirye"), "Upgrade" badge, and audio/voice settings gear.

### Visual Styling & Theme

- **Aesthetic Direction**: Deep space obsidian theme (`#09090b` / `#000000`) matching Google Gemini mobile app.
- **Drawer Styling**: Full-height slide-over drawer with subtle hairline border (`border-white/10`), rounded-full pill buttons for primary actions, clean typography for recents with pin badges (`Pin` / `PinOff`), and no cluttered cards.
- **Typography**: `Plus Jakarta Sans` for clean, modern legibility; tabular numerals for timestamps.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Zero-Hardcoding Session Engine**:
  - *Chosen Approach*: `ChatSidebar.tsx` binds directly to `useTutorStore.sessions`, utilizing `loadSession(id)`, `createNewSession()`, `deleteSession(id)`, and a new `togglePinSession(id)` action.
  - *Why*: Eliminates static mock session names and ensures user's actual study sessions persist accurately across app restarts.
- **Decision 2: Strict Route Responsibility Separation**:
  - *Chosen Approach*: `/chat` handles peer cohort messaging with Supabase realtime & institutional controls; `/tutor` handles private Gemini AI tutoring with streaming responses, audio voice, and session management.
  - *Why*: Restores the architectural integrity of the platform and eliminates user confusion.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Cymatic Study Platform                          │
├──────────────────────────────────┬─────────────────────────────────────┤
│      Cohort Chat (/chat)         │       AI Tutor Workspace (/tutor)   │
├──────────────────────────────────┼─────────────────────────────────────┤
│ • Peer Study Channels            │ • GeminiZeroState                   │
│   - #general-study               │   - Dynamic rotating greetings      │
│   - #stem-labs                   │   - Adaptive suggestion cards       │
│   - #programming-projects        │ • ChatArea & MainContainer          │
│ • Student Online Presence List   │   - Streaming AI responses          │
│ • Teacher Pinned Announcements   │   - Web Speech audio read-aloud     │
│ • AI Co-Moderator Helper         │ • Gemini Workspace Drawer           │
│ • Realtime Supabase Broadcast    │   - useTutorStore.sessions (Dynamic)│
│                                  │   - Live search filter & Pin toggle │
│                                  │   - Subject hubs & User Profile     │
└──────────────────────────────────┴─────────────────────────────────────┘
```

### Data Model & State Mapping

- **`useTutorStore`**:
  - `sessions`: `Session[]` with `id`, `title`, `summary`, `timestamp`, `pinned`, `messages`.
  - `createNewSession()`: Instantiates fresh session and sets active.
  - `loadSession(id)`: Switches active session context.
  - `deleteSession(id)`: Removes session from state and localStorage.
  - `togglePinSession(id)`: Sets `pinned = !pinned` to float key sessions to the top.
- **`useAdaptiveSuggestions`**:
  - Dynamic rotating greetings and balanced suggestion cards across 5 disciplines (STEM, Coding, UI Design, Video Editing, Documentation).
  - Remembers recent selections via `localStorage`.
- **`useAuth`**:
  - Supplies student identity (`displayName`, `avatar_url`, `role`, `schoolName`) to both Cohort Chat and Tutor Workspace drawer footer.

---

## Verification & Execution Steps

1. **Revert `/chat`**: Replace solo Gemini drawer and zero-state with peer channels, student presence, and teacher announcement banner.
2. **Redesign `ChatSidebar.tsx`**: Implement the Gemini mobile drawer in the AI Tutor workspace, dynamically rendering `useTutorStore.sessions` with live search, pin toggles, subject hubs, and student profile footer.
3. **Verify `TutorPage.tsx`**: Ensure zero-state suggestion clicks seamlessly send prompts to the streaming AI engine.
4. **Compile & Test**: Run `compile_applet` to confirm zero TypeScript or bundling errors.
