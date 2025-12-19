/*
  # Fix admin user_profiles policy recursion

  Drops the previous admin policy that referenced user_profiles (causing infinite recursion)
  and replaces it with a version that checks admin status via the admin_emails table.
*/

DROP POLICY IF EXISTS "Admins can manage user profiles" ON user_profiles;

CREATE POLICY "Admins can manage user profiles"
  ON user_profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM admin_emails ae
      JOIN auth.users au ON au.email = ae.email
      WHERE au.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM admin_emails ae
      JOIN auth.users au ON au.email = ae.email
      WHERE au.id = auth.uid()
    )
  );
