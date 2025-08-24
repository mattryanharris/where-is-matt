-- Create the locations table
CREATE TABLE public.locations (
  id BIGSERIAL PRIMARY KEY,
  city TEXT NOT NULL,
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_locations_created_at ON public.locations(created_at DESC);

-- Enable Row Level Security (optional, but recommended)
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all operations (you can make this more restrictive later)
CREATE POLICY "Allow all operations on locations" ON public.locations
FOR ALL USING (true) WITH CHECK (true);
