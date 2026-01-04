-- Create a private bucket for print files
insert into storage.buckets
  (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
values
  ('print-files', 'print-files', false, false, 52428800, '{image/png,image/jpeg}'); -- 50MB limit

-- Policy: Users can upload their own files
create policy "Users can upload their own print files"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'print-files' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can read their own files
create policy "Users can read their own print files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'print-files' and
    (storage.foldername(name))[1] = auth.uid()::text
  );
