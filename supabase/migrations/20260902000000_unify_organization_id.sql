-- Migration to unify institutional identifiers and prevent cross-school data leakage
-- File: /supabase/migrations/20260902000000_unify_organization_id.sql

-- 1. Unify columns in public.profiles
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'org_id') THEN
    ALTER TABLE public.profiles RENAME COLUMN org_id TO organization_id;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'institution_id') THEN
    -- If institution_id exists, we might want to drop it after ensuring organization_id has the data
    UPDATE public.profiles SET organization_id = institution_id WHERE organization_id IS NULL AND institution_id IS NOT NULL;
    ALTER TABLE public.profiles DROP COLUMN institution_id;
  END IF;
END $$;

-- Ensure organization_id is indexed for performance
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id);

-- 2. Update public.news_broadcasts
ALTER TABLE public.news_broadcasts ADD COLUMN IF NOT EXISTS organization_id TEXT;
CREATE INDEX IF NOT EXISTS idx_news_organization_id ON public.news_broadcasts(organization_id);

-- 3. Update public.project_submissions
ALTER TABLE public.project_submissions ADD COLUMN IF NOT EXISTS organization_id TEXT;
CREATE INDEX IF NOT EXISTS idx_project_submissions_organization_id ON public.project_submissions(organization_id);

-- 4. Update helper functions
CREATE OR REPLACE FUNCTION public.get_my_organization_id()
RETURNS TEXT AS $$
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 5. Update Policies for news_broadcasts to allow filtering by organization or public
DROP POLICY IF EXISTS "Active broadcasts are public" ON public.news_broadcasts;
CREATE POLICY "Institutional or public news read" ON public.news_broadcasts
FOR SELECT
USING (
  is_active = true 
  AND (organization_id IS NULL OR organization_id = public.get_my_organization_id())
);

-- 6. Update Policies for project_submissions to enforce organization isolation
DROP POLICY IF EXISTS "Teachers can view pending submissions" ON public.project_submissions;
CREATE POLICY "Teachers can view institutional submissions" ON public.project_submissions
FOR SELECT
USING (
  (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'org_admin'))
  AND organization_id = public.get_my_organization_id()
);

-- 7. Update sync trigger for profiles if it existed
DROP TRIGGER IF EXISTS sync_profile_institution_ids_trigger ON public.profiles;
DROP FUNCTION IF EXISTS public.sync_profile_institution_ids();

-- 8. Create dashboard_tasks table to remove mock data from frontend
CREATE TABLE IF NOT EXISTS public.dashboard_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  task_type TEXT NOT NULL, -- 'quiz', 'project', 'interactive_question'
  points INTEGER NOT NULL DEFAULT 10,
  tutor_explanation TEXT,
  created_by TEXT DEFAULT 'tutor',
  organization_id TEXT REFERENCES public.organizations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS and Realtime
ALTER TABLE public.dashboard_tasks ENABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dashboard_tasks;

-- Policy: Anyone can read global tasks (org_id is null) or their own org's tasks
CREATE POLICY "Read global or institutional tasks" ON public.dashboard_tasks
FOR SELECT
USING (
  organization_id IS NULL OR organization_id = public.get_my_organization_id()
);

-- Policy: Admins and Teachers can manage institutional tasks
CREATE POLICY "Manage institutional tasks" ON public.dashboard_tasks
FOR ALL
USING (
  (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'org_admin'))
  AND organization_id = public.get_my_organization_id()
);

-- Seed default global tasks
INSERT INTO public.dashboard_tasks (title, subject, description, task_type, points, tutor_explanation, created_by)
VALUES 
('Mastering Quadratic Discriminants', 'Math', 'Explain why a quadratic equation ax² + bx + c = 0 has no real roots when b² - 4ac < 0. Provide 2 numerical examples.', 'interactive_question', 15, 'When the discriminant b² - 4ac is negative, taking its square root yields an imaginary number, meaning the parabola of the quadratic equation does not cross the x-axis. Thus, no real roots exist.', 'tutor'),
('Standing Sound Waves', 'Physics', 'Examine resonance in a closed tube. If the fundamental frequency is 256 Hz (Middle C), find the frequency of the first two overtones.', 'project', 25, 'For closed tubes, only odd harmonics exist. The fundamental is f₁ = 256 Hz. The first overtone is the 3rd harmonic: f₃ = 3 * f₁ = 768 Hz. The second overtone is the 5th harmonic: f₅ = 5 * f₁ = 1280 Hz.', 'tutor'),
('S1 Formula Balancing Challenge', 'Chemistry', 'Balance the combustion reaction of propane: C₃H₈ + O₂ → CO₂ + H₂O. Identify the stoichiometric coefficient of oxygen.', 'quiz', 15, 'To balance: C₃H₈ + 5O₂ → 3CO₂ + 4H₂O. The stoichiometric coefficient of oxygen is 5.', 'tutor'),
('Cell Mitosis Sequence Quiz', 'Biology', 'Recall the phases of mitosis in order. Explain the primary distinction between anaphase and telophase.', 'quiz', 10, 'The phases are Prophase, Metaphase, Anaphase, Telophase (PMAT). During anaphase, sister chromatids are pulled apart to opposite poles. During telophase, nuclear membranes reform around each set of chromosomes.', 'tutor')
ON CONFLICT DO NOTHING;
