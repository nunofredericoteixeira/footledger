/*
  # Add Flexible Position Groups to Tactics

  1. Changes
    - Add `position_groups` JSONB column to tactics table
    - This allows flexible position selection within compatible groups
    - Example: {"Strikers": {"positions": ["CF", "SS"], "count": 4}}
  
  2. Position Group Structure
    Each group has:
    - name: Display name for the group
    - positions: Array of compatible positions
    - count: Total players needed from this group
    - min_per_position: Optional minimum per specific position
  
  3. Benefits
    - User can choose 4 CF, or 3 CF + 1 SS, or 2 CF + 2 SS, etc.
    - More realistic squad building
    - Flexibility in tactical variations
*/

-- Add position_groups column
ALTER TABLE tactics ADD COLUMN IF NOT EXISTS position_groups JSONB DEFAULT NULL;

-- Update 1-4-4-2 Diamond with flexible groups
UPDATE tactics SET position_groups = '{
  "Goalkeeper": {"positions": ["GK"], "count": 3},
  "Centre-Backs": {"positions": ["CB"], "count": 4},
  "Left-Backs": {"positions": ["LB"], "count": 2},
  "Right-Backs": {"positions": ["RB"], "count": 2},
  "Defensive Midfield": {"positions": ["DM"], "count": 2},
  "Central Midfield": {"positions": ["CM"], "count": 4},
  "Attacking Midfield": {"positions": ["AM"], "count": 2},
  "Strikers": {"positions": ["CF", "SS"], "count": 4}
}'::jsonb WHERE name = '1-4-4-2 Diamond';

-- Update 1-4-4-2 Line with flexible groups
UPDATE tactics SET position_groups = '{
  "Goalkeeper": {"positions": ["GK"], "count": 3},
  "Centre-Backs": {"positions": ["CB"], "count": 4},
  "Left-Backs": {"positions": ["LB"], "count": 2},
  "Right-Backs": {"positions": ["RB"], "count": 2},
  "Central Midfield": {"positions": ["CM", "DM", "AM"], "count": 8},
  "Strikers": {"positions": ["CF", "SS"], "count": 4}
}'::jsonb WHERE name = '1-4-4-2 Line';

-- Update 1-4-4-2 Square
UPDATE tactics SET position_groups = '{
  "Goalkeeper": {"positions": ["GK"], "count": 3},
  "Centre-Backs": {"positions": ["CB"], "count": 4},
  "Left-Backs": {"positions": ["LB"], "count": 2},
  "Right-Backs": {"positions": ["RB"], "count": 2},
  "Defensive Midfield": {"positions": ["DM"], "count": 4},
  "Attacking Midfield": {"positions": ["AM"], "count": 4},
  "Strikers": {"positions": ["CF", "SS"], "count": 4}
}'::jsonb WHERE name = '1-4-4-2 Square';

-- Update 1-4-4-2 (1-3)
UPDATE tactics SET position_groups = '{
  "Goalkeeper": {"positions": ["GK"], "count": 3},
  "Centre-Backs": {"positions": ["CB"], "count": 4},
  "Left-Backs": {"positions": ["LB"], "count": 2},
  "Right-Backs": {"positions": ["RB"], "count": 2},
  "Defensive Midfield": {"positions": ["DM"], "count": 2},
  "Attacking Midfield": {"positions": ["AM"], "count": 6},
  "Strikers": {"positions": ["CF", "SS"], "count": 4}
}'::jsonb WHERE name = '1-4-4-2 (1-3)';

-- Update 1-4-4-2 (3-1)
UPDATE tactics SET position_groups = '{
  "Goalkeeper": {"positions": ["GK"], "count": 3},
  "Centre-Backs": {"positions": ["CB"], "count": 4},
  "Left-Backs": {"positions": ["LB"], "count": 2},
  "Right-Backs": {"positions": ["RB"], "count": 2},
  "Defensive Midfield": {"positions": ["DM"], "count": 6},
  "Attacking Midfield": {"positions": ["AM"], "count": 2},
  "Strikers": {"positions": ["CF", "SS"], "count": 4}
}'::jsonb WHERE name = '1-4-4-2 (3-1)';

-- Update 1-4-3-3 variations with flexible wingers/forwards
UPDATE tactics SET position_groups = '{
  "Goalkeeper": {"positions": ["GK"], "count": 3},
  "Centre-Backs": {"positions": ["CB"], "count": 4},
  "Left-Backs": {"positions": ["LB"], "count": 2},
  "Right-Backs": {"positions": ["RB"], "count": 2},
  "Central Midfield": {"positions": ["CM"], "count": 6},
  "Left Wing": {"positions": ["LW", "LM"], "count": 2},
  "Right Wing": {"positions": ["RW", "RM"], "count": 2},
  "Strikers": {"positions": ["CF", "SS"], "count": 2}
}'::jsonb WHERE name = '1-4-3-3 Line';

-- Update 1-4-3-3 (2-1)
UPDATE tactics SET position_groups = '{
  "Goalkeeper": {"positions": ["GK"], "count": 3},
  "Centre-Backs": {"positions": ["CB"], "count": 4},
  "Left-Backs": {"positions": ["LB"], "count": 2},
  "Right-Backs": {"positions": ["RB"], "count": 2},
  "Defensive Midfield": {"positions": ["DM"], "count": 4},
  "Attacking Midfield": {"positions": ["AM"], "count": 2},
  "Left Wing": {"positions": ["LW", "LM"], "count": 2},
  "Right Wing": {"positions": ["RW", "RM"], "count": 2},
  "Strikers": {"positions": ["CF", "SS"], "count": 2}
}'::jsonb WHERE name = '1-4-3-3 (2-1)';

-- Update 1-4-3-3 (1-2)
UPDATE tactics SET position_groups = '{
  "Goalkeeper": {"positions": ["GK"], "count": 3},
  "Centre-Backs": {"positions": ["CB"], "count": 4},
  "Left-Backs": {"positions": ["LB"], "count": 2},
  "Right-Backs": {"positions": ["RB"], "count": 2},
  "Defensive Midfield": {"positions": ["DM"], "count": 2},
  "Attacking Midfield": {"positions": ["AM"], "count": 4},
  "Left Wing": {"positions": ["LW", "LM"], "count": 2},
  "Right Wing": {"positions": ["RW", "RM"], "count": 2},
  "Strikers": {"positions": ["CF", "SS"], "count": 2}
}'::jsonb WHERE name = '1-4-3-3 (1-2)';

-- Update 1-4-2-4
UPDATE tactics SET position_groups = '{
  "Goalkeeper": {"positions": ["GK"], "count": 3},
  "Centre-Backs": {"positions": ["CB"], "count": 4},
  "Left-Backs": {"positions": ["LB"], "count": 2},
  "Right-Backs": {"positions": ["RB"], "count": 2},
  "Central Midfield": {"positions": ["CM", "DM", "AM"], "count": 4},
  "Left Wing": {"positions": ["LW", "LM"], "count": 2},
  "Right Wing": {"positions": ["RW", "RM"], "count": 2},
  "Strikers": {"positions": ["CF", "SS"], "count": 4}
}'::jsonb WHERE name = '1-4-2-4';

-- Update 1-3-5-2
UPDATE tactics SET position_groups = '{
  "Goalkeeper": {"positions": ["GK"], "count": 3},
  "Centre-Backs": {"positions": ["CB"], "count": 6},
  "Defensive Midfield": {"positions": ["DM"], "count": 4},
  "Central Midfield": {"positions": ["CM", "AM"], "count": 6},
  "Strikers": {"positions": ["CF", "SS"], "count": 4}
}'::jsonb WHERE name = '1-3-5-2';

-- Update 1-3-4-3 Line
UPDATE tactics SET position_groups = '{
  "Goalkeeper": {"positions": ["GK"], "count": 3},
  "Centre-Backs": {"positions": ["CB"], "count": 6},
  "Central Midfield": {"positions": ["CM", "DM", "AM"], "count": 8},
  "Left Wing": {"positions": ["LW", "LM"], "count": 2},
  "Right Wing": {"positions": ["RW", "RM"], "count": 2},
  "Strikers": {"positions": ["CF", "SS"], "count": 2}
}'::jsonb WHERE name = '1-3-4-3 Line';

-- Update 1-3-4-3 Diamond
UPDATE tactics SET position_groups = '{
  "Goalkeeper": {"positions": ["GK"], "count": 3},
  "Centre-Backs": {"positions": ["CB"], "count": 6},
  "Defensive Midfield": {"positions": ["DM"], "count": 2},
  "Central Midfield": {"positions": ["CM"], "count": 4},
  "Attacking Midfield": {"positions": ["AM"], "count": 2},
  "Left Wing": {"positions": ["LW", "LM"], "count": 2},
  "Right Wing": {"positions": ["RW", "RM"], "count": 2},
  "Strikers": {"positions": ["CF", "SS"], "count": 2}
}'::jsonb WHERE name = '1-3-4-3 Diamond';

-- Update 1-5-4-1 Line
UPDATE tactics SET position_groups = '{
  "Goalkeeper": {"positions": ["GK"], "count": 3},
  "Centre-Backs": {"positions": ["CB"], "count": 6},
  "Left-Backs": {"positions": ["LB"], "count": 2},
  "Right-Backs": {"positions": ["RB"], "count": 2},
  "Central Midfield": {"positions": ["CM", "DM", "AM"], "count": 8},
  "Strikers": {"positions": ["CF", "SS"], "count": 2}
}'::jsonb WHERE name = '1-5-4-1 Line';

-- Update 1-5-4-1 Diamond
UPDATE tactics SET position_groups = '{
  "Goalkeeper": {"positions": ["GK"], "count": 3},
  "Centre-Backs": {"positions": ["CB"], "count": 6},
  "Left-Backs": {"positions": ["LB"], "count": 2},
  "Right-Backs": {"positions": ["RB"], "count": 2},
  "Defensive Midfield": {"positions": ["DM"], "count": 2},
  "Central Midfield": {"positions": ["CM"], "count": 4},
  "Attacking Midfield": {"positions": ["AM"], "count": 2},
  "Strikers": {"positions": ["CF", "SS"], "count": 2}
}'::jsonb WHERE name = '1-5-4-1 Diamond';

-- Update 1-5-3-2 (2-1)
UPDATE tactics SET position_groups = '{
  "Goalkeeper": {"positions": ["GK"], "count": 3},
  "Centre-Backs": {"positions": ["CB"], "count": 6},
  "Left-Backs": {"positions": ["LB"], "count": 2},
  "Right-Backs": {"positions": ["RB"], "count": 2},
  "Defensive Midfield": {"positions": ["DM"], "count": 4},
  "Attacking Midfield": {"positions": ["AM"], "count": 2},
  "Strikers": {"positions": ["CF", "SS"], "count": 4}
}'::jsonb WHERE name = '1-5-3-2 (2-1)';

-- Update 1-5-3-2 (1-2)
UPDATE tactics SET position_groups = '{
  "Goalkeeper": {"positions": ["GK"], "count": 3},
  "Centre-Backs": {"positions": ["CB"], "count": 6},
  "Left-Backs": {"positions": ["LB"], "count": 2},
  "Right-Backs": {"positions": ["RB"], "count": 2},
  "Defensive Midfield": {"positions": ["DM"], "count": 2},
  "Attacking Midfield": {"positions": ["AM"], "count": 4},
  "Strikers": {"positions": ["CF", "SS"], "count": 4}
}'::jsonb WHERE name = '1-5-3-2 (1-2)';

-- Update 1-5-2-3
UPDATE tactics SET position_groups = '{
  "Goalkeeper": {"positions": ["GK"], "count": 3},
  "Centre-Backs": {"positions": ["CB"], "count": 6},
  "Left-Backs": {"positions": ["LB"], "count": 2},
  "Right-Backs": {"positions": ["RB"], "count": 2},
  "Central Midfield": {"positions": ["CM", "DM", "AM"], "count": 4},
  "Left Wing": {"positions": ["LW", "LM"], "count": 2},
  "Right Wing": {"positions": ["RW", "RM"], "count": 2},
  "Strikers": {"positions": ["CF", "SS"], "count": 2}
}'::jsonb WHERE name = '1-5-2-3';