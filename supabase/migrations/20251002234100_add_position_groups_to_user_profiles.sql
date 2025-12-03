/*
  # Add position_groups to user_profiles and backfill from current tactic selections
*/

-- Add column if missing
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS position_groups jsonb;

-- Backfill from existing tactic selections (if both tactic and tactic.position_groups exist)
UPDATE user_profiles up
SET position_groups = t.position_groups,
    position_requirements = COALESCE(up.position_requirements, t.position_requirements)
FROM user_tactic_selection uts
JOIN tactics t ON t.id = uts.tactic_id
WHERE up.id = uts.user_id
  AND t.position_groups IS NOT NULL;
