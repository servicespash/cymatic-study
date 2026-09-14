-- Force schema cache reload to fix project_submissions error
NOTIFY pgrst, reload_schema;

-- Ensure admin records cannot be queried by non-admins in profiles
-- (We already did something similar, but let's strictly enforce it at the policy level for students reading profiles)

-- First drop the policy if we need to refine it
-- CREATE OR REPLACE VIEW student_records AS ... (we can also do this, but the prompt says "service-side filter")
