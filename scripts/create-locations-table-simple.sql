-- Create locations table
CREATE TABLE locations (
  id BIGSERIAL PRIMARY KEY,
  city TEXT NOT NULL,
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_locations_created_at ON locations(created_at DESC);
