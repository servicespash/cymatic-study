-- Migration: Create pending_educators table
CREATE TABLE IF NOT EXISTS public.pending_educators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.pending_educators ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own requests
CREATE POLICY "Users can insert their own requests" ON public.pending_educators
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow admins (or specific email) to read all requests
-- Assuming you have a way to identify admins, or use the email check
CREATE POLICY "Admins can read all requests" ON public.pending_educators
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.email = 'latifisabirye123@gmail.com'
        )
    );
