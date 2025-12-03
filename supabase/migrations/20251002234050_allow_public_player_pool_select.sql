/*
  # Allow public read on player_pool

  Makes the player catalog visible to unauthenticated visitors so the UI can list players even before a session is established.
*/

CREATE POLICY "Anyone can view player pool"
  ON player_pool
  FOR SELECT
  USING (true);
