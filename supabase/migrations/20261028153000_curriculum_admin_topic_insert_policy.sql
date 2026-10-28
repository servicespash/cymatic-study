create policy "Curriculum admins can insert document topic headings"
on public.curriculum_document_topics
for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and p.role in ('admin','org_admin','superadmin')
  )
);