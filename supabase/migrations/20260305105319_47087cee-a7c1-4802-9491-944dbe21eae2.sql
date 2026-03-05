
-- Add the missing public read policy with a unique name
CREATE POLICY "Public read corporate logos" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'corporate-logos');
