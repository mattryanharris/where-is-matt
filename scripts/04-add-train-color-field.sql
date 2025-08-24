-- Add train_color field to store train line color information
ALTER TABLE public.locations 
ADD COLUMN IF NOT EXISTS train_color TEXT;

-- Create an index for color-related queries
CREATE INDEX IF NOT EXISTS idx_locations_train_color ON public.locations(train_color) WHERE train_color IS NOT NULL;
