
-- Add form and strength columns to medicine_inventory
ALTER TABLE public.medicine_inventory ADD COLUMN IF NOT EXISTS form text;
ALTER TABLE public.medicine_inventory ADD COLUMN IF NOT EXISTS strength text;
ALTER TABLE public.medicine_inventory ADD COLUMN IF NOT EXISTS item_type text DEFAULT 'medicine';

-- Add collector_contact to biomedical_waste
ALTER TABLE public.biomedical_waste ADD COLUMN IF NOT EXISTS collector_contact text;
