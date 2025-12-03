/*
  # Create user tactic selection table

  Needed before later migrations that alter constraints and update selections.
*/

CREATE TABLE IF NOT EXISTS user_tactic_selection (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tactic_id uuid NOT NULL REFERENCES tactics(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE user_tactic_selection ENABLE ROW LEVEL SECURITY;

-- Users can view their own selection
CREATE POLICY "Users can view their tactic selection"
  ON user_tactic_selection
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert/update/delete their own selection
CREATE POLICY "Users can manage their tactic selection"
  ON user_tactic_selection
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
