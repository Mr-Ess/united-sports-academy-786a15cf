
DROP POLICY IF EXISTS "attachments upload auth" ON storage.objects;
CREATE POLICY "attachments upload auth" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'attachments');

DROP POLICY IF EXISTS "attachments read auth" ON storage.objects;
CREATE POLICY "attachments read auth" ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'attachments');

DROP POLICY IF EXISTS "attachments delete mgmt" ON storage.objects;
CREATE POLICY "attachments delete mgmt" ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'attachments'
    AND public.has_any_academy_role(
      auth.uid(),
      ARRAY['super_admin','top_management','branch_admin','finance','hr']::public.academy_role[]
    )
  );
