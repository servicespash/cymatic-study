-- Create tutor_feedback table
CREATE TABLE IF NOT EXISTS tutor_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  message_id UUID NOT NULL, -- This refers to the chat_messages table id
  rating SMALLINT NOT NULL CHECK (rating IN (1, -1)),
  organization_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE tutor_feedback ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can insert their own feedback" ON tutor_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback" ON tutor_feedback
  FOR SELECT USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_tutor_feedback_message_id ON tutor_feedback(message_id);
