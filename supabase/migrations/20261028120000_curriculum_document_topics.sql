-- Normalized topic index for extracted curriculum document headings.
-- Source text and PDFs are not copied into this table.
create table if not exists public.curriculum_document_topics (
  id uuid primary key default gen_random_uuid(),
  source_document_id text not null references public.curriculum_documents(id) on delete cascade,
  level_label text not null check (level_label in ('Level 1', 'Level 2', 'Other')),
  topic_number integer not null check (topic_number > 0),
  title text not null,
  source_page integer check (source_page is null or source_page > 0),
  original_summary text,
  learning_outcomes jsonb not null default '[]'::jsonb,
  review_status text not null default 'needs_review'
    check (review_status in ('needs_review', 'reviewed', 'approved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_document_id, level_label, topic_number)
);

create index if not exists curriculum_document_topics_lookup_idx
  on public.curriculum_document_topics (source_document_id, level_label, topic_number);

alter table public.curriculum_document_topics enable row level security;
