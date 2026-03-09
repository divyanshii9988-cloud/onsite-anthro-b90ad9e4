-- Add location_id column to profile_corporates table
ALTER TABLE public.profile_corporates 
ADD COLUMN location_id uuid REFERENCES public.corporate_locations(id);

-- Create index for better query performance
CREATE INDEX idx_profile_corporates_location ON public.profile_corporates(location_id);