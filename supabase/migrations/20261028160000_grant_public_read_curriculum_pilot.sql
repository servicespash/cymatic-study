-- PostgREST table privileges are separate from row-level security.
-- Grant read access to the public pilot tables; RLS limits the visible rows.
grant select on table
  public.curriculum_documents,
  public.curriculum_document_topics,
  public.curriculum_document_notes
to anon, authenticated;
