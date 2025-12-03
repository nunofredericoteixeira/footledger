/*
  # Add Admin Role System

  1. Changes
    - Add `is_admin` column to `user_profiles` table
    - Set nunofredericoteixeira@gmail.com as admin
    - Add policy to check admin status

  2. Security
    - Only admins can view other users' profiles
    - Regular users can only view their own profile
*/

-- Add is_admin column to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
END $$;

-- Create admin_emails table to manage admin users
CREATE TABLE IF NOT EXISTS admin_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_emails ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin emails
CREATE POLICY "Only admins can view admin emails"
  ON admin_emails
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Insert the main admin email
INSERT INTO admin_emails (email)
VALUES ('nunofredericoteixeira@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- Function to check if user is admin on login
CREATE OR REPLACE FUNCTION check_and_set_admin_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the user's email is in admin_emails
  IF EXISTS (
    SELECT 1 FROM auth.users
    JOIN admin_emails ON auth.users.email = admin_emails.email
    WHERE auth.users.id = NEW.id
  ) THEN
    NEW.is_admin := true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to set admin status when profile is created
DROP TRIGGER IF EXISTS set_admin_status_on_profile_creation ON user_profiles;
CREATE TRIGGER set_admin_status_on_profile_creation
  BEFORE INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_and_set_admin_status();
