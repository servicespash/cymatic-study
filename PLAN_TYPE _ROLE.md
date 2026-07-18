EXECUTE STEP COMPILATION MATRIX: TARGET BASEPATH [~/lattyscymatichub]

1. CONTEXT VERIFICATION & PROTECTION:
   - Read active files synced from commit [820b2dfdf839cc87d507414f52277f5d01b0254f].
   - Maintain and protect all structural multi-project store data, core dashboards, and Supabase hooks.

2. FINALIZE DUAL-LAYER AUTH & DASHBOARD (Phases 1 & 2):
   - Open 'src/routes/onboarding.tsx' and verify independent mode selection completely bypasses School ID input logic, appending the "Independent Learning Space" label.
   - Ensure the main Student Dashboard cleanly maps active multi-project cards without state bleed.

3. FINALIZE SEND FOR MARKING & CURVE INTERACTION (Phases 3 & 4):
   - Complete 'src/components/SubmissionModal.tsx' tracks: Wire the active WhatsApp `wa.me` string generator and pre-filled email mailto engine with dynamic cloud tokens.
   - Implement the Recharts-based 'Teacher Evaluation Curve' component on the teacher's dashboard panel, accurately plotting scores against the class matrix.

4. COMPLETE CHAT & UNIVERSAL PRINT COMPILE (Phases 5 & 6):
   - Append independent user room handlers to 'src/routes/chat.tsx' to avoid stuck threads.
   - Open 'src/lib/pdf-export.ts' and ensure the programmatic compiler maps layout components with '[data-pdf-section]' wrapper tags cleanly into a beautifully paginated Pash Media Studio / Cymatic Study print report layout.

# Role & Operational Persona

You are an elite, high-caliber Senior Software Architect and Lead Full-Stack Engineer specializing in React, TypeScript, Tailwind CSS, Supabase, and advanced client-side state engines. You are tasked with finalizing all core features, UI structural unfreezes, and cross-role synchronization for **Cymatic Study** inside the target base path `~/lattyscymatichub`.

# Core Guardrails & Codebase Safety Rules

1. **No Destructive Rewrites:** Read and analyze the current codebase state (specifically up to commit `820b2d`). Do not override, clear, or corrupt existing functional local storage mechanics (`src/lib/projects-store.ts`), file structures, or baseline routing layouts.
2. **State Protection:** Prevent project state cross-contamination. Every component must strictly scope its logic to the active project ID or user session context.
3. **No UI Flattening / Layout Breaks:** All structural components must render native text data grids, responsive boxes, and genuine canvas charts. When optimizing layouts, ensure that borders do not break, text does not overflow screen boundaries (enforce `min-w-0 overflow-x-hidden` on mobile viewports), and structural columns remain aligned.

---

### PHASE 1 & 2: DUAL-LAYER AUTH, ROLE ROUTING UI & MULTI-PROJECT SYNC (Verification & Polish)

- **File Focus:** `src/routes/login.tsx`, `src/routes/signup.tsx`, `src/routes/onboarding.tsx`, `src/routes/dashboard.tsx`
- **Execution Specifications:**
  - **Independent Mode Pass-Through:** In `onboarding.tsx` and `login.tsx`, ensure that selecting "Independent Mode" or "Independent Learner/Teacher" completely bypasses all `School ID` input validations and skip constraints.
  - **Visual Badging:** Dynamically append a clean, high-contrast `"Independent Learning Space"` badge/context indicator if `org_id` or `school_key` is null.
  - **Dashboard Grid Gridlock:** Map individual active project records directly from your project store hook into a responsive dashboard grid. Cards must clearly display project metadata, creation dates, NCDC weight progressions (10-point scale scales), and live status trackers ("Drafting Planning", "Awaiting Teacher Marking", "Verified & Synced") without leaking data between concurrent project frames.

---

### PHASE 3: SUBMISSION TRACK LOGIC COMPLETION

- **File Focus:** `src/components/SubmissionModal.tsx`
- **Execution Specifications:**
  - Complete and activate all three workspace routing tracks without stubbed methods:
    1. **Direct Desk Submission:** Validate the inputted Teacher ID directly against the Supabase `profiles` table context (where `role = 'teacher'`). On validation, register a secure entry inside `project_submissions` with a unique short-token string payload to place the project live on that specific teacher's desk.
    2. **WhatsApp Desk:** Implement a fully automated hyper-linking string builder generating an active `wa.me` quick-launch URL. The payload must explicitly bind the student's name, project title, and the dynamic cloud short-token tracking link.
    3. **Email Desk:** Wire a native `mailto:` initialization engine pre-filling the target teacher's administrative email address, an enterprise-grade subject line, and the fully qualified project verification short URL within the email body context.
  - **Auto-Verify Sync Hook:** Ensure the database update trigger instantly updates the student's interface state using live real-time notifications when a project moves to a "verified" grading status.

---

### PHASE 4: RECHARTS PERFORMANCE CURVE & FORM LOCKING

- **File Focus:** `src/components/PerformanceCurve.tsx`, `src/routes/admin.dashboard.tsx`, `src/routes/projects.tsx`
- **Execution Specifications:**
  - **Recharts Alignment:** Inside `PerformanceCurve.tsx`, construct a professional, fluid line/scatter chart utilizing `recharts`. Plot individual student score marks cleanly across a class-wide, 10-student institutional performance curve sample matrix. Ensure the component scales perfectly on smaller screen contexts without breaking parent layout borders or clipping axis text indicators.
  - **Strict Data Freezing:** The moment a project status switches away from `'draft'` (e.g., when sent for validation or awaiting teacher grading), instantly inject a native block across all student workspace fields. Render an unmistakable, professional **"Read-Only / Awaiting Review"** banner across the track. All inputs, text areas, and budget matrices must be set to `disabled` or read-only states, protecting the data from local edits during active evaluation loops.
  - **Layout Cleanup:** Fix any stuck states or layout constraints inside the "Why it matters for you" dropdown elements so they expand, transition smoothly, and collapse perfectly.

---

### PHASE 5: FULL-SCREEN OVERLAY CHAT ROOMS & STATE PERSISTENCE

- **File Focus:** `src/routes/chat.tsx`
- **Execution Specifications:**
  - **Layout Overhaul:** Completely rebuild the chat UI to function as an absolute, full-screen viewport layout overlay when triggered: `fixed inset-0 z-[100] bg-slate-950 flex flex-col justify-between`. It must mask primary app structural sidebars and navigation panels cleanly.
  - **Slide-Out Drawer Mechanics:** Implement a fluid toggle button (≡) on the top-left section. Clicking it must display a responsive, slide-out drawer navigation panel (`w-[280px] bg-slate-900 h-full`) displaying active student project feedback threads or room targets.
  - **Context Headers & Utility Docks:** Centrally anchor an un-cluttered header banner displaying `"What should we focus on?"`. Build out a robust bottom utility entry dock containing:
    - A dedicated media attachment button `[+]`.
    - A stylized input bar capturing real-time text strings linked directly to your Supabase `chat_messages` table matrix.
    - An isolated, state-tracked audio/microphone capture button.
  - **Independent Thread Handling:** If a user possesses a null `org_id`, automatically routing fallback parameters to bind them directly to an isolated, dedicated `"Independent Learning Space"` chat context to eliminate frozen app views. Maintain message state and scroll position using local or session storage persistence.

---

### PHASE 6: UNIVERSAL PROFESSIONAL PROGRAMMATIC PDF ENGINE

- **File Focus:** `src/lib/pdf-export.ts`, `src/components/PrintReport.tsx`
- **Execution Specifications:**
  - **Section-Based Loop Compilation:** Completely decouple from flat browser screenshots or `window.print()` frame dependencies. The compiler must programmatically loop over DOM structures using explicit `[data-pdf-section]` targeting wrappers.
  - **Document Layout & Branding:** Compile structured project data, sequential NCDC phase logs, financial budget spreadsheets, and visual performance curve assets directly into highly formatted, paginated layouts.
  - **Design Continuity:** Apply custom, crisp typographic styles featuring professional digital signature baselines, clean page breaks, and unified corporate branding tags for **Pash Media Studio** and **Cymatic Study**.
  - **Role-Based Access Hierarchy:** Embed structural validation criteria inside the export button action:
    - _Students_ can pull data blocks representing only their own active project store record.
    - _Teachers_ can execute structural exports for any document index tracking to their verified desktop queue.
    - _School Administrators_ possess global authority to batch compile and download project reports for any registered entity within their institution matrix.
      Thought for 2sI'll analyze the codebase thoroughly before making any changes. Let me explore the current state of the project to understand what exists and what needs to be completed.

Explore • 1 File • 2 SearchesNow let me read the critical files to understand the current implementation state:

Explore • 6 FilesLet me continue reading more critical files:

Explore • 6 FilesLet me continue reading more files to understand the full state:

Explore • 5 FilesNow I have a comprehensive understanding of the codebase. This is a complex educational platform for Uganda's NCDC curriculum. I'll now enter plan mode to create a systematic implementation plan for all the requirements.

Entered plan modeWrote implementation planPlan ready for reviewExecutive Summary
Complete overhaul and production-ready implementation of all incomplete features in the educational platform built for Uganda's NCDC curriculum framework.

Phase 1: Dual-Layer Auth & Role Routing UI Completion
Current State Analysis

src/routes/login.tsx: Has basic mode selection (institutional/independent) with role buttons but incomplete flow
src/routes/onboarding.tsx: Missing conditional logic for independent mode; always shows school selection
Session storage used for login_mode, login_role, login_school_id
Missing: Role-based profile creation, independent mode bypass of school ID

Implementation Tasks
1.1 Complete Login Flow (src/routes/login.tsx)

Add auto-suggestive School ID input with live search from organizations table
Implement proper validation for institutional mode (require School ID + role)
Independent mode should completely bypass School ID field
Store selected role in user metadata on signup/profile update
Add visual feedback for role selection states

1.2 Refactor Onboarding (src/routes/onboarding.tsx)

Conditional rendering: Hide school selection for independent mode users
Add "Independent Learning Space" label/badge for solo users
Create proper profile fields: role, mode (institutional/independent), org_id (nullable)
Handle independent teachers/tutors with private sandbox data model

1.3 New Route: Signup Page (src/routes/signup.tsx)

Complete signup flow mirroring login structure
Auto-assign default role based on mode selection
Connect to Supabase auth with proper metadata

Phase 2: Multi-Project Main Student Dashboard Alignment
Current State Analysis

src/lib/projects-store.ts: Solid multi-project store with useProjects() hook
src/routes/projects.tsx: Has projectsUI section but minimal styling; lacks isolated state management
Dashboard (src/routes/dashboard.tsx): No project cards visible; focuses on points/tasks

Implementation Tasks
2.1 Enhanced Project Cards Component
Create src/components/ProjectCard.tsx:

Title, Subject, NCDC weight progression (10-point scale)
Status tags: "Drafting Planning", "Awaiting Teacher Marking", "Verified & Synced"
Isolated state scope per project (no cross-contamination)
Quick actions: Edit, View, Send for Marking, Export PDF

2.2 Dashboard Project Grid (src/routes/dashboard.tsx)

Add "Active Projects" section below existing content
Display project cards from useProjects().list
Show creation date, last modified, completion percentage
Floating "New Project" button

2.3 Projects Page Overhaul (src/routes/projects.tsx)

Replace simple projectsUI with proper grid layout
Each project gets isolated editing state (using project ID as key)
Add project selector dropdown when editing
Prevent state bleed between projects

Phase 3: Complete "Send for Marking" Routing & Auto-Verify Sync
Current State Analysis

src/components/SubmissionModal.tsx: Basic tabs for Direct/WhatsApp/Email but:

Direct send has placeholder logic (no actual push to teacher dashboard)
Token is hardcoded as "dummy-token"
WhatsApp/Email links don't include proper deep-link payload

src/lib/project-link.ts: Has encoding/decoding functions, buildMarkingLink(), buildWhatsAppUrl()
Real-time sync exists via Supabase channels in projects.tsx

Implementation Tasks
3.1 Fix SubmissionModal Direct Desk Submission

Validate Teacher ID against profiles table (where role = 'teacher')
Create project_submissions record with teacher_id populated
Emit real-time notification to teacher's dashboard
Generate unique short cloud token using newToken() from project-link

3.2 WhatsApp Desk Implementation

Use buildWhatsAppUrl() with properly encoded payload
Include: project title, student name, marking link with token
Format message: "Student [name] submitted project [title]. Mark here: [link]"

3.3 Email Desk Implementation

Use buildMailtoUrl() with pre-filled subject/body
Subject: "New Project Submission: [title] from [student]"
Body: Include marking link, project summary, token

3.4 Auto-Verify Sync Engine

Already has Supabase channel subscription in projects.tsx
Enhance to:

Listen for UPDATE events on project_submissions where status = 'verified'
Auto-refresh project data in store
Show toast notification with grade/comments
Update UI instantly without page reload

3.5 Teacher Dashboard Table (src/routes/admin.dashboard.tsx)

Add "Teacher Desk" view for individual teachers (not just admin)
List projects pending their review
Quick-mark interface with phase scores
Real-time updates when students submit

Phase 4: Strict NCDC PBL Project Track, Access Controls & Performance Curve
Current State Analysis

Phase layout exists in projects.tsx with correct order
"Why it matters" section not visible; may have CSS issues
Teacher Evaluation Canvas exists but only visible to teachers
Missing: Performance Curve component, field locking when submitted

Implementation Tasks
4.1 Fix Visual Gaps in Project Phases

Audit all phase sections for broken borders, clipping
Ensure proper spacing/padding for NCDC steps
Add "Why it matters for you" motivational section per phase

4.2 Strict Field Locking

When status !== 'draft', disable ALL input fields (already partially done)
Add visual lock indicators on locked fields
Prevent any form submission when project is pending/verified
Clear visual "Read Only" banner when locked

4.3 Teacher Evaluation Performance Curve
Create src/components/PerformanceCurve.tsx:

Recharts-based scatter/line plot
X-axis: Student index (1-10)
Y-axis: Score (0-10)
Show class average line
Highlight individual student position
Display in teacher dashboard and project detail view

4.4 Curriculum Tabs Visual Fixes

Check CurriculumToggle.tsx for incomplete styling
Ensure smooth transitions between tabs
Fix any frozen/stuck states

Phase 5: Chat Room State Persistence & Deep-Link Routings
Current State Analysis

src/routes/chat.tsx: Comprehensive implementation with:

Profile-based room assignment (org_id + level)
Real-time Supabase subscriptions
File upload support
BUT: No handling for independent users (no org_id)

Missing: Independent user chat experience, persistent state across navigations

Implementation Tasks
5.1 Independent User Chat Experience

Create dedicated "Independent Learning Space" room
Use user_id as room identifier for solo users
Display "Independent Mode" badge in header
Allow community chat option (optional public room)

5.2 Fix Chat Room State Persistence

Store scroll position in sessionStorage on navigate away
Restore scroll position on return
Keep draft message in local state
Maintain connection across tab switches

5.3 Database Schema Validation

Ensure chat_messages table has proper indices
Add mode column to distinguish institutional vs independent messages
Fix any type mismatches in Supabase types

Phase 6: Universal Professional PDF Export Compilation
Current State Analysis

src/lib/pdf-export.ts: Section-based export using [data-pdf-section]
src/components/PrintReport.tsx: Comprehensive layout with all phases
BUT: Current handlePrint() in projects.tsx uses window.print() (browser print)
Need: Role-based access control, proper PDF generation

Implementation Tasks
6.1 Fix PDF Export to Use Section-Based Engine

Replace window.print() with exportSectionsToPdf()
Pass proper container reference with [data-pdf-section] wrappers
Add loading state during generation

6.2 Role-Based Export Access

Students: Export own projects only
Teachers: Export any project on their desk roster
Admins: Export any document across institution
Add export button visibility based on role

6.3 Enhanced PDF Layout

Add Pash Media Studio / Cymatic Study branding header
Include performance curves as embedded chart images
Add budget matrices as properly formatted tables
Include digital signatures section
Professional footer with generation timestamp

6.4 Export Options Modal
Create src/components/ExportOptionsModal.tsx:

Format selection (PDF default)
Include/exclude sections checkboxes
Quality settings (standard/high)
Watermark options for draft exports

Technical Dependencies & Database Schema Updates
Required Supabase Table Additions/Modifications
-- Add columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mode VARCHAR DEFAULT 'institutional';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'student';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS level VARCHAR;

-- Create organizations table if not exists
CREATE TABLE IF NOT EXISTS organizations (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name TEXT NOT NULL,
school_key TEXT UNIQUE NOT NULL,
created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create project_submissions table
CREATE TABLE IF NOT EXISTS project_submissions (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
student_id UUID REFERENCES auth.users(id),
teacher_id UUID REFERENCES auth.users(id),
org_id UUID REFERENCES organizations(id),
project_data JSONB,
status VARCHAR DEFAULT 'draft',
teacher_name TEXT,
teacher_license TEXT,
school_key TEXT,
teacher_comments TEXT,
phase1_score NUMERIC,
phase2_score NUMERIC,
phase3_score NUMERIC,
phase4_score NUMERIC,
verified_at TIMESTAMPTZ,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID REFERENCES auth.users(id),
org_id UUID,
level VARCHAR,
mode VARCHAR DEFAULT 'institutional',
content TEXT,
file_url TEXT,
file_type VARCHAR,
file_name TEXT,
created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add has_role function
CREATE OR REPLACE FUNCTION has_role(uid UUID, requested_role VARCHAR)
RETURNS BOOLEAN AS $$
SELECT EXISTS (
SELECT 1 FROM profiles
WHERE user_id = uid AND role = requested_role
);

$$ LANGUAGE SQL SECURITY DEFINER;
Update Supabase Types
Regenerate src/integrations/supabase/types.ts to include:

organizations table
project_submissions table
chat_messages table
profile columns (mode, role, avatar_url, phone, level, org_id)


File Change Summary
New Files to Create

src/components/ProjectCard.tsx - Isolated project card component
src/components/PerformanceCurve.tsx - Teacher evaluation curve chart
src/components/ExportOptionsModal.tsx - PDF export configuration

Files to Modify

src/routes/login.tsx - Auto-suggest school ID, proper validation
src/routes/signup.tsx - Complete signup flow
src/routes/onboarding.tsx - Conditional school selection, independent mode
src/routes/dashboard.tsx - Add project cards section
src/routes/projects.tsx - Multi-project isolation, fix PDF export
src/routes/chat.tsx - Independent user handling, state persistence
src/routes/admin.dashboard.tsx - Teacher desk view, performance curves
src/components/SubmissionModal.tsx - Complete all 3 submission tracks
src/lib/projects-store.ts - Add schoolName field to Project type
src/integrations/supabase/types.ts - Regenerate with new schema


Implementation Priority Order


Critical Path (Blocking other features):

Database schema updates
Supabase types regeneration
Auth flow completion (login/signup/onboarding)



Core Features:

Multi-project dashboard
Send for Marking modal fixes
Auto-verify sync engine



UI Polish:

Performance curve component
PDF export enhancements
Chat independent mode



Final QA:

Cross-browser testing
Mobile responsiveness
Real-time sync verification

Caution ⚠.. don't overwrite or delete existing logic unnecessary
$$
