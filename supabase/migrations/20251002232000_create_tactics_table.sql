/*
  # Create tactics table

  This was missing in the original migration set and is required before the
  later updates/seed scripts that reference `tactics`.
*/

-- Create tactics table if it does not exist
CREATE TABLE IF NOT EXISTS tactics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  position_requirements jsonb DEFAULT NULL,
  position_groups jsonb DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Basic RLS
ALTER TABLE tactics ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read tactics (used by the public anon client)
CREATE POLICY "Anyone can view tactics"
  ON tactics
  FOR SELECT
  USING (true);

-- Allow authenticated users to manage tactics (useful for admin tooling)
CREATE POLICY "Authenticated users can manage tactics"
  ON tactics
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
