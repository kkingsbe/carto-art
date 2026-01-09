-- Create a public bucket for mockups
insert into storage.buckets
  (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
values
  ('mockups', 'mockups', true, false, 10485760, '{image/png,image/jpeg}'); -- 10MB limit

-- Policy: Authenticated users can upload mockups
create policy "Authenticated users can upload mockups"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'mockups' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Everyone can view mockups (public)
create policy "Public can view mockups"
  on storage.objects for select
  to public
  using (bucket_id = 'mockups');
