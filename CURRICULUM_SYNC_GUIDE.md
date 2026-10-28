# Curriculum Database Synchronization & GitHub Open-Source Sync Guide

This guide details how to transition your application away from hardcoded or local-storage curriculum seed data and synchronize lesson content directly into the **Supabase** database, supporting open-source contributions via **GitHub**.

---

## 1. Prerequisites

Ensure you have configured your Supabase environment variables in `.env`:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key
```

---

## 2. Database Schema Setup

Execute the following SQL migration in your Supabase SQL Editor to create the required relational curriculum tables:

```sql
-- Subjects Table
CREATE TABLE IF NOT EXISTS public.curriculum_subjects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  uneb_code TEXT NOT NULL,
  level_category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Topics Table
CREATE TABLE IF NOT EXISTS public.curriculum_topics (
  id TEXT PRIMARY KEY,
  subject_id TEXT,
  level INTEGER NOT NULL,
  title TEXT NOT NULL,
  overview_concept TEXT,
  subtopics JSONB DEFAULT '[]'::jsonb,
  competencies JSONB DEFAULT '[]'::jsonb,
  formulas JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sections Table (Study Content Notes)
CREATE TABLE IF NOT EXISTS public.curriculum_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id TEXT REFERENCES public.curriculum_topics(id) ON DELETE CASCADE,
  heading TEXT NOT NULL,
  content TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);
```

---

## 3. Running the Synchronization Script

A Node.js synchronization script is provided at `scripts/sync-curriculum.js`. It reads a structured JSON curriculum file and upserts topics, formulas, subtopics, and study sections directly into Supabase.

To run the script with the sample curriculum file:
```bash
node scripts/sync-curriculum.js ./scripts/sample-curriculum.json
```

---

## 4. GitHub Open-Source Integration & CI/CD Workflow

To allow open-source contributors to update lessons via GitHub pull requests:

1. **Repository Structure:** Store curriculum notes in a public GitHub repository (e.g., `latty/uganda-secondary-curriculum`) in JSON or Markdown format.
2. **GitHub Action Workflow (`.github/workflows/sync-curriculum.yml`):**
   ```yaml
   name: Sync Curriculum to Supabase
   on:
     push:
       branches: [ main ]

   jobs:
     sync:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: 18
         - name: Install Dependencies
           run: npm install @supabase/supabase-js dotenv
         - name: Run Sync Script
           env:
             SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
             SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
           run: node scripts/sync-curriculum.js ./curriculum-data.json
   ```
