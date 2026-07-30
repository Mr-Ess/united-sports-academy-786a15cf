
CREATE POLICY "public read site-media" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'site-media');
CREATE POLICY "staff upload site-media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'site-media' AND public.is_staff(auth.uid()));
CREATE POLICY "staff update site-media" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'site-media' AND public.is_staff(auth.uid()));
CREATE POLICY "staff delete site-media" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'site-media' AND public.is_staff(auth.uid()));
