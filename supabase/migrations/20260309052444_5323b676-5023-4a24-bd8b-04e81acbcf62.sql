-- Allow admins to delete corporates
CREATE POLICY "Admin can delete corporates"
ON public.corporates
FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
));