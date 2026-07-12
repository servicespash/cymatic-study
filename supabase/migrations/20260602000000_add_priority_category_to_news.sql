ALTER TABLE public.news_broadcasts
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal';

-- Update existing rows if necessary
UPDATE public.news_broadcasts SET category = 'General', priority = 'normal' WHERE category IS NULL;
