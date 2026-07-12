-- Create tutor_sessions table
CREATE TABLE IF NOT EXISTS tutor_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  current_state JSONB DEFAULT '{}'::jsonb,
  history JSONB DEFAULT '[]'::jsonb,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create tutor_content table
CREATE TABLE IF NOT EXISTS tutor_content (
  content_key TEXT PRIMARY KEY,
  content_value TEXT NOT NULL,
  language TEXT DEFAULT 'en'
);

-- Enable RLS
ALTER TABLE tutor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_content ENABLE ROW LEVEL SECURITY;

-- Policies for tutor_sessions
CREATE POLICY "Users can view their own sessions" ON tutor_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON tutor_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON tutor_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for tutor_content
CREATE POLICY "Anyone can read tutor content" ON tutor_content
  FOR SELECT USING (true);
