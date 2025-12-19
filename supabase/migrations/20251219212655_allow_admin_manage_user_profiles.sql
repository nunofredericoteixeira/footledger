/*
  # Allow admins to manage any user profile

  Adds a policy so users marked as admins (user_profiles.is_admin = true) can
  insert/update/select/delete rows on behalf of other users. Regular managers
  keep the existing self-only policies.
*/

CREATE POLICY "Admins can manage user profiles"
  ON user_profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.is_admin = true
    )
  );
