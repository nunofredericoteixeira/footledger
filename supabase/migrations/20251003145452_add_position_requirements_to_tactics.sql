/*
  # Add Position Requirements to Tactics

  1. Changes
    - Add `position_requirements` JSONB column to tactics table
    - Populate each tactic with required positions (doubled for squad depth)
    - Format: {"GK": 2, "CB": 4, "LB": 2, "RB": 2, "CM": 6, "LW": 2, "RW": 2, "ST": 2}
  
  2. Position Requirements Logic
    - Each position from the formation is doubled to ensure squad depth
    - GK is always 2 (1 starter + 1 backup)
    - Defensive, midfield, and attacking positions are doubled from formation
  
  3. Notes
    - Requirements vary based on formation (3-back, 4-back, 5-back systems)
    - Midfielders and attackers adapt to each tactical system
*/

-- Add position_requirements column
ALTER TABLE tactics ADD COLUMN IF NOT EXISTS position_requirements JSONB DEFAULT '{}';

-- Update tactics with position requirements (doubled for squad depth)

-- 1-3-5-2: 3 defenders, 5 midfielders, 2 forwards
UPDATE tactics SET position_requirements = '{"GK": 2, "CB": 6, "CM": 10, "ST": 4}'::jsonb
WHERE name = '1-3-5-2';

-- 1-3-4-3 variations: 3 defenders, 4 midfielders, 3 forwards
UPDATE tactics SET position_requirements = '{"GK": 2, "CB": 6, "CM": 8, "LW": 2, "RW": 2, "ST": 2}'::jsonb
WHERE name IN ('1-3-4-3 Line', '1-3-4-3 Diamond');

-- 1-4-2-4: 4 defenders, 2 midfielders, 4 forwards (very attacking)
UPDATE tactics SET position_requirements = '{"GK": 2, "CB": 4, "LB": 2, "RB": 2, "CM": 4, "LW": 2, "RW": 2, "ST": 4}'::jsonb
WHERE name = '1-4-2-4';

-- 1-4-3-3 variations: 4 defenders, 3 midfielders, 3 forwards
UPDATE tactics SET position_requirements = '{"GK": 2, "CB": 4, "LB": 2, "RB": 2, "CM": 6, "LW": 2, "RW": 2, "ST": 2}'::jsonb
WHERE name IN ('1-4-3-3 Line', '1-4-3-3 (2-1)', '1-4-3-3 (1-2)');

-- 1-4-4-2 variations: 4 defenders, 4 midfielders, 2 forwards
UPDATE tactics SET position_requirements = '{"GK": 2, "CB": 4, "LB": 2, "RB": 2, "CM": 8, "ST": 4}'::jsonb
WHERE name IN ('1-4-4-2 Line', '1-4-4-2 Square', '1-4-4-2 Diamond', '1-4-4-2 (1-3)', '1-4-4-2 (3-1)');

-- 1-5-4-1 variations: 5 defenders, 4 midfielders, 1 forward
UPDATE tactics SET position_requirements = '{"GK": 2, "CB": 6, "LB": 2, "RB": 2, "CM": 8, "ST": 2}'::jsonb
WHERE name IN ('1-5-4-1 Line', '1-5-4-1 Diamond');

-- 1-5-3-2 variations: 5 defenders, 3 midfielders, 2 forwards
UPDATE tactics SET position_requirements = '{"GK": 2, "CB": 6, "LB": 2, "RB": 2, "CM": 6, "ST": 4}'::jsonb
WHERE name IN ('1-5-3-2 (2-1)', '1-5-3-2 (1-2)');

-- 1-5-2-3: 5 defenders, 2 midfielders, 3 forwards
UPDATE tactics SET position_requirements = '{"GK": 2, "CB": 6, "LB": 2, "RB": 2, "CM": 4, "LW": 2, "RW": 2, "ST": 2}'::jsonb
WHERE name = '1-5-2-3';