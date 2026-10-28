-- Admin review/write access is tied to the authenticated database profile role.
-- Public users may only read approved published notes through the earlier policy.
drop policy if exists "Curriculum admins can read all document notes" on public.curriculum_document_notes;

create policy "Curriculum admins can read all document notes"
on public.curriculum_document_notes
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and p.role in ('admin','org_admin','superadmin')
  )
);

drop policy if exists "Curriculum admins can insert document notes" on public.curriculum_document_notes;

create policy "Curriculum admins can insert document notes"
on public.curriculum_document_notes
for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and p.role in ('admin','org_admin','superadmin')
  )
);

drop policy if exists "Curriculum admins can update document notes" on public.curriculum_document_notes;

create policy "Curriculum admins can update document notes"
on public.curriculum_document_notes
for update
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and p.role in ('admin','org_admin','superadmin')
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and p.role in ('admin','org_admin','superadmin')
  )
);

drop policy if exists "Curriculum admins can delete document notes" on public.curriculum_document_notes;

create policy "Curriculum admins can delete document notes"
on public.curriculum_document_notes
for delete
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and p.role in ('admin','org_admin','superadmin')
  )
);

drop policy if exists "Curriculum admins can update document topic index" on public.curriculum_document_topics;

create policy "Curriculum admins can update document topic index"
on public.curriculum_document_topics
for update
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and p.role in ('admin','org_admin','superadmin')
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and p.role in ('admin','org_admin','superadmin')
  )
);

drop policy if exists "Curriculum admins can update source document metadata" on public.curriculum_documents;

create policy "Curriculum admins can update source document metadata"
on public.curriculum_documents
for update
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and p.role in ('admin','org_admin','superadmin')
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and p.role in ('admin','org_admin','superadmin')
  )
);