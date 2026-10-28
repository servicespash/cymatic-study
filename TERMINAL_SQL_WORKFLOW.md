# Terminal SQL & Google Sheets Workflow Guide

This guide provides a step-by-step workflow for updating your curriculum subjects, topics, and lesson notes directly via the **PostgreSQL local terminal (`psql`)** or the **Supabase SQL Editor**, maintaining strict foreign key integrity.

---

## 1. Connecting to Your Supabase PostgreSQL Database

### Option A: Via Supabase Dashboard (Web SQL Editor)
1. Navigate to your Supabase Project Dashboard: [https://tffffvbaiccqndydsobg.supabase.co](https://tffffvbaiccqndydsobg.supabase.co)
2. Click on **SQL Editor** in the left navigation menu.
3. Create a new query and paste your SQL statements.

### Option B: Via Local Terminal (`psql`)
Open your local terminal and connect directly using your database connection string:
```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.tffffvbaiccqndydsobg.supabase.co:5432/postgres"
```

---

## 2. Maintaining Foreign Key Integrity (The Correct Order of Execution)

Because `curriculum_topics` references `curriculum_subjects`, and `curriculum_sections` references `curriculum_topics`, you must insert records in this exact chronological order:
1. **Subjects** (`curriculum_subjects`)
2. **Topics** (`curriculum_topics`)
3. **Study Content Sections** (`curriculum_sections`)

---

## 3. Step-by-Step Workflow: Google Sheets to CSV to Postgres SQL

### Step 1: Set Up Your Google Sheet
Create columns in your Google Sheet:
- Col A: `subject_id` (e.g., `physics`, `chemistry`, `biology`, `mathematics`, `agriculture`)
- Col B: `subject_title` (e.g., `Physics`)
- Col C: `uneb_code` (e.g., `535/1`)
- Col D: `level` (e.g., `1` for Senior 1)
- Col E: `topic_id` (e.g., `physics_s1_topic_1`)
- Col F: `topic_title` (e.g., `Measurement in Physics`)
- Col G: `overview_concept` (Summary text)
- Col H: `heading` (Section heading, e.g., `Fundamental Principles`)
- Col I: `content` (Detailed multi-paragraph textbook notes)

### Step 2: Generate SQL Insert Formula in Google Sheets
In an adjacent column (e.g., Column J), paste this Google Sheets formula to automatically generate Postgres `INSERT` statements for sections:

```excel
="INSERT INTO public.curriculum_sections (topic_id, heading, content) VALUES ('" & E2 & "', '" & SUBSTITUTE(H2, "'", "''") & "', '" & SUBSTITUTE(I2, "'", "''") & "');"
```
*(Dragging this formula down generates all SQL statements instantly for every row in your spreadsheet).*

---

## 4. Ready-to-Run Terminal SQL Templates

### 1. Insert Subject
```sql
INSERT INTO public.curriculum_subjects (id, title, uneb_code, level_category)
VALUES ('physics', 'Physics', '535/1', 'O-Level / A-Level')
ON CONFLICT (id) DO UPDATE 
SET title = EXCLUDED.title, uneb_code = EXCLUDED.uneb_code;
```

### 2. Insert Topic (Foreign Key to Subject)
```sql
INSERT INTO public.curriculum_topics (id, subject_id, level, title, overview_concept, subtopics, competencies, formulas)
VALUES (
  'physics_s1_mechanics_1',
  'physics',
  1,
  'Mechanics and Measurement',
  'Fundamental study of physical quantities and SI units.',
  '["Base SI Units", "Derived Units", "Error Analysis"]'::jsonb,
  '["Measure length with vernier calipers", "Calculate density"]'::jsonb,
  '["Density = Mass / Volume"]'::jsonb
)
ON CONFLICT (id) DO UPDATE 
SET title = EXCLUDED.title, overview_concept = EXCLUDED.overview_concept;
```

### 3. Insert Lesson Sections (Foreign Key to Topic)
```sql
INSERT INTO public.curriculum_sections (topic_id, heading, content, sort_order)
VALUES 
(
  'physics_s1_mechanics_1',
  'Introduction to Units',
  'Physics relies on precise quantitative measurements. All physical quantities consist of a numerical magnitude and a unit.',
  0
),
(
  'physics_s1_mechanics_1',
  'Vernier Calipers & Micrometers',
  'For measurements requiring precision beyond a standard meter rule, vernier calipers and micrometer screw gauges are utilized.',
  1
);
```
