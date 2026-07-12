-- Migration for Chat Media Attachments

-- 1. Update chat_messages table to support attachments
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_type TEXT, -- 'image', 'pdf', 'doc'
ADD COLUMN IF NOT EXISTS file_name TEXT;

-- 2. Storage Bucket for Chat Attachments
-- (Note: Bucket creation usually happens via Supabase UI or API, 
-- but we can define the policies here assuming the bucket 'chat_attachments' exists)

-- Policies for chat_attachments bucket (handled via storage schema)
-- We need to ensure users can only access files from their own school/level
-- This is often done by including org_id/level in the storage path.

-- Example path structure: {org_id}/{level}/{user_id}/{filename}

-- Helper for storage policies
CREATE OR REPLACE FUNCTION public.get_user_level(uid uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT level FROM public.profiles WHERE user_id = uid);
END;
$$;
