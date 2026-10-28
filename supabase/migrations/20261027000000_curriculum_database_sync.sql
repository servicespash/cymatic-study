-- Migration: Curriculum Database Sync Schema
-- Enables storing subjects, topics, subtopics, and study sections in Postgres for zero hardcoded reliance.

CREATE TABLE IF NOT EXISTS public.curriculum_subjects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  uneb_code TEXT NOT NULL,
  level_category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.curriculum_topics (
  id TEXT PRIMARY KEY,
  subject_id TEXT REFERENCES public.curriculum_subjects(id) ON DELETE CASCADE,
  level INTEGER NOT NULL,
  title TEXT NOT NULL,
  overview_concept TEXT,
  subtopics JSONB DEFAULT '[]'::jsonb,
  competencies JSONB DEFAULT '[]'::jsonb,
  formulas JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.curriculum_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id TEXT REFERENCES public.curriculum_topics(id) ON DELETE CASCADE,
  heading TEXT NOT NULL,
  content TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.curriculum_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_sections ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Allow public read on curriculum_subjects" ON public.curriculum_subjects FOR SELECT USING (true);
CREATE POLICY "Allow public read on curriculum_topics" ON public.curriculum_topics FOR SELECT USING (true);
CREATE POLICY "Allow public read on curriculum_sections" ON public.curriculum_sections FOR SELECT USING (true);

-- Authenticated admin/teacher write policies
CREATE POLICY "Allow admin/teacher write on curriculum_subjects" ON public.curriculum_subjects FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin/teacher write on curriculum_topics" ON public.curriculum_topics FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin/teacher write on curriculum_sections" ON public.curriculum_sections FOR ALL USING (auth.role() = 'authenticated');
