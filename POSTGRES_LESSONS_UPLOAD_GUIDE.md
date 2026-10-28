# Postgres & Google Sheets Lesson Upload Guide

This guide explains how to upload and update your lesson notes from **Google Sheets** into your **Supabase / Postgres** database using official SQL statements included in our migration setup (`supabase/migrations/20261027000000_curriculum_database_sync.sql`).

---

## 1. Preparing Your Notes in Google Sheets

Organize your lesson notes in Google Sheets with the following columns:
1. `Subject ID` (e.g., `physics`, `mathematics`, `chemistry`, `biology`, `agriculture`)
2. `Senior Level` (e.g., `1` for Senior 1, up to `6` for Senior 6)
3. `Topic Title` (e.g., `Introduction to Kinematics`)
4. `Overview Concept` (Short summary/intro)
5. `Section Heading` (e.g., `Fundamental Principles`)
6. `Section Content` (Detailed textbook explanation paragraphs)

---

## 2. Official Postgres SQL Statements

You can run these exact SQL statements directly in your **Supabase SQL Editor** or local **Postgres terminal (`psql`)**.

### Step A: Insert Subject Record
```sql
INSERT INTO public.curriculum_subjects (id, title, uneb_code, level_category)
VALUES ('physics', 'Physics', '535/1', 'O-Level / A-Level')
ON CONFLICT (id) DO UPDATE 
SET title = EXCLUDED.title, uneb_code = EXCLUDED.uneb_code;
```

### Step B: Insert Topic Record
```sql
INSERT INTO public.curriculum_topics (id, subject_id, level, title, overview_concept, subtopics, competencies, formulas)
VALUES (
  'physics_s1_kinematics_1', 
  'physics', 
  1, 
  'Introduction to Kinematics', 
  'Kinematics is the study of motion without considering forces.',
  '["Distance & Displacement", "Speed & Velocity", "Acceleration"]'::jsonb,
  '["Calculate average velocity", "Interpret displacement-time graphs"]'::jsonb,
  '["v = u + at", "s = ut + 0.5at^2"]'::jsonb
)
ON CONFLICT (id) DO UPDATE 
SET title = EXCLUDED.title, overview_concept = EXCLUDED.overview_concept, subtopics = EXCLUDED.subtopics;
```

### Step C: Insert Detailed Study Content Sections
```sql
INSERT INTO public.curriculum_sections (topic_id, heading, content, sort_order)
VALUES 
(
  'physics_s1_kinematics_1', 
  'Fundamental Principles', 
  'Motion is the continuous change in position of an object relative to a reference frame. Scalar quantities have magnitude only, whereas vector quantities possess both magnitude and direction.', 
  0
),
(
  'physics_s1_kinematics_1', 
  'Practical Investigations', 
  'Using a ticker-tape timer operating at 50Hz to measure acceleration due to gravity or trolley acceleration on an inclined runway.', 
  1
);
```

---

## 3. Workflow for Google Sheets to SQL

If you have hundreds of rows in Google Sheets:
1. Export your Google Sheet as a **CSV file**.
2. Use a simple formula or script in Google Sheets to concatenate columns into SQL insert strings:
   `="INSERT INTO public.curriculum_sections (topic_id, heading, content, sort_order) VALUES ('" & A2 & "', '" & B2 & "', '" & C2 & "', " & D2 & ");"`
3. Copy the generated SQL query block and paste it into the Supabase SQL Editor to instantly populate your live curriculum database!
