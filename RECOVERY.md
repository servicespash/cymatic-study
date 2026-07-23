# Database Recovery Guide

The application is missing some critical database tables in your Supabase project. This usually happens if migrations were not fully applied.

## How to Fix

1. Go to your **Supabase Dashboard**.
2. Navigate to the **SQL Editor** in the left sidebar.
3. Click **New Query**.
4. Copy and paste the SQL below.
5. Click **Run**.

### SQL to Run

```sql
-- 1. Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  school_key TEXT UNIQUE,
  creator_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Project Submissions Table
CREATE TABLE IF NOT EXISTS public.project_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  project_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'verified')),
  is_verified BOOLEAN NOT NULL DEFAULT false,
  teacher_id UUID REFERENCES auth.users(id),
  teacher_name TEXT,
  teacher_license TEXT,
  school_key TEXT,
  teacher_comments TEXT,
  phase1_score NUMERIC DEFAULT 0,
  phase2_score NUMERIC DEFAULT 0,
  phase3_score NUMERIC DEFAULT 0,
  phase4_score NUMERIC DEFAULT 0,
  total_competency_score NUMERIC DEFAULT 0,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Chat Messages Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  level TEXT,
  content TEXT NOT NULL,
  file_url TEXT,
  file_type TEXT,
  file_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Enable RLS and Basic Policies
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read organizations
CREATE POLICY "Allow authenticated read organizations" ON public.organizations FOR SELECT TO authenticated USING (true);

-- Allow students to manage their own submissions
CREATE POLICY "Users can manage own submissions" ON public.project_submissions
FOR ALL TO authenticated USING (auth.uid() = student_user_id);

-- Allow teachers to read all submissions in their school (simplified for recovery)
CREATE POLICY "Teachers can read all submissions" ON public.project_submissions
FOR SELECT TO authenticated USING (true);

-- Chat policies
CREATE POLICY "Authenticated users can read chat" ON public.chat_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert chat" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
```

## After Running

Once you have run the SQL, the application should start working correctly. You may need to refresh the preview.
