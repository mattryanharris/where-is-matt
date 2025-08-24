-- Add train_info field to store JSON train information
ALTER TABLE public.locations 
ADD COLUMN IF NOT EXISTS train_info TEXT;

-- Create an index for train-related queries
CREATE INDEX IF NOT EXISTS idx_locations_train_info ON public.locations(train_info) WHERE train_info IS NOT NULL;
