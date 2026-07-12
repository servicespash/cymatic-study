-- Migration to align database schema with frontend application requirements
-- Adding missing columns to profiles and project_submissions

-- 1. Update profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS teacher_license_id TEXT;

-- 2. Update project_submissions table
ALTER TABLE public.project_submissions ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.project_submissions ADD COLUMN IF NOT EXISTS teacher_token TEXT;
ALTER TABLE public.project_submissions ADD COLUMN IF NOT EXISTS student_user_id UUID REFERENCES auth.users(id);

-- 3. Add column to quiz_attempts (if missing, based on error logs)
-- Note: Further inspection showed potential issues in other tables; 
-- this migration covers the most immediate blocking issues reported by the compiler.
