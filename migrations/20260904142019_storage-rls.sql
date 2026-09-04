-- Grant usage on storage schema and tables to authenticated and anon roles
GRANT USAGE ON SCHEMA storage TO authenticated, anon;
GRANT SELECT ON storage.buckets TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated, anon;

-- Enable Row Level Security on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS artworks_insert_policy ON storage.objects;
DROP POLICY IF EXISTS deliverables_insert_policy ON storage.objects;
DROP POLICY IF EXISTS storage_objects_public_select ON storage.objects;
DROP POLICY IF EXISTS storage_objects_modify ON storage.objects;

-- Allow upload to artworks bucket
CREATE POLICY artworks_insert_policy ON storage.objects
  FOR INSERT TO authenticated, anon
  WITH CHECK (bucket = 'artworks');

-- Allow upload to deliverables bucket
CREATE POLICY deliverables_insert_policy ON storage.objects
  FOR INSERT TO authenticated, anon
  WITH CHECK (bucket = 'deliverables');

-- Allow select on objects in artworks and deliverables
CREATE POLICY storage_objects_public_select ON storage.objects
  FOR SELECT TO authenticated, anon
  USING (bucket IN ('artworks', 'deliverables'));

-- Allow update/delete for authenticated and anon users
CREATE POLICY storage_objects_modify ON storage.objects
  FOR ALL TO authenticated, anon
  USING (bucket IN ('artworks', 'deliverables'))
  WITH CHECK (bucket IN ('artworks', 'deliverables'));
