-- Create a table to store location data
CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  city VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on created_at for faster queries
CREATE INDEX IF NOT EXISTS idx_locations_created_at ON locations(created_at DESC);
