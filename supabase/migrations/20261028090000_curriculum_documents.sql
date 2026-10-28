-- Draft metadata registry for curriculum source documents.
-- PDF binaries and extracted prose are deliberately not copied to public storage.
-- A document remains unpublished until redistribution permission and curriculum mapping are verified.

create table if not exists public.curriculum_documents (
  id text primary key,
  title text not null,
  subject_id text references public.curriculum_subjects(id) on delete set null,
  subject_label text not null,
  curriculum_programme text not null,
  level_labels text[] not null default '{}',
  source_organization text not null,
  source_url text,
  original_filename text not null,
  sha256 text not null unique check (sha256 ~ '^[a-f0-9]{64}$'),
  mime_type text not null default 'application/pdf' check (mime_type = 'application/pdf'),
  size_bytes bigint not null check (size_bytes > 0),
  page_count integer check (page_count is null or page_count > 0),
  extracted_topic_headings jsonb not null default '[]'::jsonb,
  extracted_learning_outcomes_count integer not null default 0 check (extracted_learning_outcomes_count >= 0),
  storage_path text,
  license_status text not null default 'pending_permission'
    check (license_status in ('pending_permission', 'permission_granted', 'open_license_verified', 'link_only')),
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'review', 'published', 'rejected')),
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint curriculum_documents_publication_guard check (
    publication_status <> 'published'
    or license_status in ('permission_granted', 'open_license_verified', 'link_only')
  )
);

create index if not exists curriculum_documents_subject_idx
  on public.curriculum_documents (subject_label, publication_status);

alter table public.curriculum_documents enable row level security;

-- No anon/authenticated policies are added here. Draft source metadata is not public
-- until a separate, reviewed policy is intentionally introduced.
