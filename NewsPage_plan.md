# Master Protocol: Lattys Cymatic Interaction Podium

## 1. Locked Layout Constraints (Non-Negotiable)

- The existing Accordion-based layout must be preserved.
- All new features (CommentSection, Reaction buttons, Live status) must be nested _inside_ the existing AccordionContent containers.
- No new grids, spotlights, or external banners are permitted.

## 2. Interaction Podium Logic

- Like/Dislike Buttons: Must be added to every Accordion item with optimistic UI updates (instant visual toggle, background sync).
- Auth-Aware: Every interaction (Comment, Like) must be logged to the authenticated user_id.

## 3. Live Broadcast Integration

- Real-time listener: The app must watch for 'Active' status in the 'broadcast' table.
- UI: Display a pulsating 'LIVE' badge on the specific Accordion item that is live.
- Global Player: An overlay context bar at the bottom that activates ONLY when a live stream is detected.

## 4. Sharing & Referral Logic

- Share Button: Each Accordion item must have a 'Share' button that copies a deep link (?id=xyz) to the clipboard.
- Deep Link Handling: The NewsPage must read the URL param 'id' and auto-expand the corresponding Accordion item on load.

## 5. Simplified Postgres Workflow

- Use Supabase Realtime (postgres_changes) for all feed updates.
- Terminal as Source of Truth: All UI updates must map directly from database triggers, not hard-coded UI logic.
