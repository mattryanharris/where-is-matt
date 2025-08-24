-- Add countdown fields to the locations table
ALTER TABLE public.locations 
ADD COLUMN IF NOT EXISTS message TEXT,
ADD COLUMN IF NOT EXISTS target_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS has_countdown BOOLEAN DEFAULT FALSE;

-- Update the index to include countdown queries
CREATE INDEX IF NOT EXISTS idx_locations_countdown ON public.locations(has_countdown, created_at DESC);
