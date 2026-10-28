-- Public lesson browsing for source-derived topic headings only.
-- Draft PDFs and extracted full text remain private; the pilot exposes metadata/headings,
-- source page references, and official source links so learners can navigate the index.
create policy "Public can read pilot curriculum document metadata"
on public.curriculum_documents
for select
to anon, authenticated
using (
  id in (
    'ncdc-aep-physics-lsc-level-1-2-2023',
    'ncdc-aep-biology-lsc-level-1-2-2023'
  )
);

create policy "Public can read curriculum document topic headings"
on public.curriculum_document_topics
for select
to anon, authenticated
using (
  source_document_id in (
    'ncdc-aep-physics-lsc-level-1-2-2023',
    'ncdc-aep-biology-lsc-level-1-2-2023'
  )
);

create table if not exists public.curriculum_document_notes (
  id uuid primary key default gen_random_uuid(),
  source_document_id text not null references public.curriculum_documents(id) on delete cascade,
  source_topic_id uuid references public.curriculum_document_topics(id) on delete set null,
  subject_label text not null,
  programme text not null,
  level_label text not null,
  title text not null,
  summary text not null default '',
  learning_outcomes jsonb not null default '[]'::jsonb,
  study_sections jsonb not null default '[]'::jsonb,
  source_pages integer[] not null default '{}',
  source_url text,
  review_status text not null default 'draft'
    check (review_status in ('draft','in_review','approved','rejected')),
  publication_status text not null default 'draft'
    check (publication_status in ('draft','published','withdrawn')),
  created_by text,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint published_notes_must_be_approved check (
    publication_status <> 'published' or review_status = 'approved'
  )
);

create index if not exists curriculum_document_notes_topic_idx
  on public.curriculum_document_notes (source_document_id, level_label, title);

alter table public.curriculum_document_notes enable row level security;

create policy "Public can read published approved curriculum notes"
on public.curriculum_document_notes
for select
to anon, authenticated
using (publication_status = 'published' and review_status = 'approved');

-- No client insert/update/delete policies are granted. Writes must go through a
-- server-side admin-authenticated workflow, not a browser passcode or anon key.
