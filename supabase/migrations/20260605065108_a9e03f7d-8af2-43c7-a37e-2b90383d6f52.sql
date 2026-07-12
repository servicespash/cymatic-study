
-- 1) Chat INSERT must match sender's org_id + level
DROP POLICY IF EXISTS "Authenticated users can post their own messages" ON public.chat_messages;
CREATE POLICY "chat_insert_own_org_level"
  ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.org_id IS NOT NULL
        AND chat_messages.org_id = (p.org_id)::text
        AND p.level IS NOT NULL
        AND chat_messages.level = p.level
    )
  );

-- 2) Chat SELECT: require non-null org & level (closes null-org bypass)
DROP POLICY IF EXISTS "Users read chat in their org and level" ON public.chat_messages;
CREATE POLICY "chat_select_own_org_level"
  ON public.chat_messages FOR SELECT TO authenticated
  USING (
    chat_messages.org_id IS NOT NULL
    AND chat_messages.level IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.org_id IS NOT NULL
        AND chat_messages.org_id = (p.org_id)::text
        AND p.level IS NOT NULL
        AND chat_messages.level = p.level
    )
  );

-- 3) Hide sensitive token columns from students; only service_role may read them
REVOKE SELECT (teacher_token, marking_token) ON public.project_submissions FROM authenticated;
