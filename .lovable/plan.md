# Refactor Plan — Cymatic Hub

Scope confirmed: keep current Lovable Cloud backend (`cjoayorozpsrcupbekkj`). Do **not** touch `src/integrations/supabase/client.ts` or `.env`.

I'll ship in **3 phases** so each is reviewable. Tell me to start, or trim items.

---

## Phase A — Workspace Core (highest impact)

### 1. Project Workspace → Vertical Accordion (`src/routes/projects.tsx`)

- Remove existing tabs/segmented control.
- Replace with a single scroll page of 4 `<Accordion type="multiple">` panels:
  - **Phase 1 — Planning & Design:** Title input + live 12-word counter banner (amber when ≥12). BUBU Budget table; Local/Recycled rows wrapped in emerald-bordered card.
  - **Phase 2 — Implementation & Logbook:** Weekly grid (week/activity/challenges) + Generic Skills chip multi-select.
  - **Phase 3 — Output & Testing:** Uniqueness textarea + Input/Output efficiency calc.
  - **Phase 4 — Final Report:** Summary textarea + PDF export buttons.
- Inside each panel: **Self-Award slider (0–10)** sitting inline next to **Teacher Rubric Grade** (read-only display).
- **Lock-on-Grade:** when `project.teacherMark` (or per-phase `gradeN`) is present and valid, set every input in that panel to `disabled` with a `<Lock className="h-3 w-3"/>` badge. Driven off the existing `teacherMark` field already on `Project`.

### 2. Curriculum/A-Level Master Toggle + NCDC Scorecard

- `CurriculumToggle` already exists — promote it to a persistent top bar in `projects.tsx` and `curriculum.tsx`.
- New `<NCDCScorecard />` component: aggregates `grade1..grade4` (0–10 each) → mean out of 10, weight ×10% shown.
- Descriptor mapping: A ≥8.5, B 7.0–8.4, C 5.0–6.9, D 3.0–4.9, E <3.0.
- Permanent amber banner: "⚠️ UNEB Continuous Assessment Rule: …" rendered only in Lower-Secondary mode.

### 3. Multi-Project Registry + "Send for Marking"

- `StudentProjectsDashboard` already lists projects — add status badges (Draft / Submitted / Verified).
- Rename CTA "Commit to Teacher" → "Send for Marking". On click → existing `submitProjectForMarking` server fn → set local `status: "pending"` (already wired) and lock the card to read-only.

---

## Phase B — Companion Chat & Curriculum UI

### 4. Gemini-style Study Chat (`src/routes/tutor.tsx` + `TutorPage.tsx`)

- Install AI Elements: `bun x ai-elements@latest add conversation message prompt-input shimmer`.
- Switch to `useChat` against a new server route `src/routes/api/tutor.ts` that calls Lovable AI (`google/gemini-3-flash-preview`) via `@ai-sdk/openai-compatible`.
- Header: render **only** the selected subject name (drop "Mira / Gemini / Tutor" strings).
- Off-topic guardrail: server-side system prompt instructs model to emit `<offtopic/>` marker when the prompt is unrelated to S1–S6 curriculum; client renders an amber inline `<Alert>` card in the stream.
- Conversation shape: **one conversation per subject, localStorage persistence** (lightweight, no DB writes; matches existing offline-first design).

### 5. Curriculum View Glitch Fix (`src/routes/curriculum.tsx`)

- Audit overlapping text + duplicate containers; rebuild with `space-y-4`, proper `grid grid-cols-1 md:grid-cols-2`, `min-w-0` on flex children to prevent clipping.
- Theme chips: `flex-wrap gap-2`, fixed line-height.
- Mobile: ensure `<Card>` content uses `break-words` and `aspect-auto`.

---

## Phase C — Auth, PDF, Polish

### 6. Dual-Identifier Auth (Email / Username / Phone)

- Migration: add `username TEXT UNIQUE` and `phone TEXT UNIQUE` to `profiles`; backfill nullable.
- New server fn `resolveIdentifier({ identifier })` → looks up profile by exact match on email/username/phone → returns associated `auth.users.email`.
- Login form: single "Email, username or phone" field. On submit → resolve → `signInWithPassword({ email, password })`.
- Signup: capture optional username + phone, write to profile after signup.

### 7. Vector-only PDF (`src/lib/pdf-export.ts`, `src/lib/project-pdf.tsx`)

- Strip any `html2canvas`/`window.print` paths.
- Rewrite as pure jsPDF: header band, project metadata table, per-phase sections (text + budget table via `autoTable`), teacher mark block, footer page numbers.
- No DOM capture → no app chrome leaks.

### 8. Design Language Pass

- Verify dark, high-contrast tokens in `src/styles.css`; bump display font weight; ensure all new components use semantic tokens (no raw hex).

### 9. Runtime error cleanup

- `empathy-engine.ts` "Failed to fetch" warning is harmless (falls back to templates) — silence the noisy console.warn when offline.

---

## Out of Scope (won't touch)

- `src/integrations/supabase/client.ts`, `.env`, `supabase/config.toml`
- Existing Gemini Live (voice) wiring — text chat only this pass

---

## Technical notes

- Migration runs first (Phase C, item 6) since other code waits on it.
- All new server fns under `src/lib/*.functions.ts` with `requireSupabaseAuth` where user context needed.
- Real-time sync already implemented in `useProjectSubmissionSync` — no changes needed.

---

**Reply "go" to start Phase A**, or tell me to reorder / drop items.
