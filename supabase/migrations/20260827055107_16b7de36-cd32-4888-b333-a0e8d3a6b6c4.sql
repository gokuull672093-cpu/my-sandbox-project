ALTER TABLE public.enquiries
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS pincode text;

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS image_url text;