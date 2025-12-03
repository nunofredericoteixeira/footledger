/*
  # Update Tactics with Specific Position Requirements

  1. Changes
    - Update all tactics to use specific positions from player_pool
    - Use DM (Defensive Midfield), CM (Central Midfield), AM (Attacking Midfield)
    - Use LM (Left Midfield), RM (Right Midfield) for wide midfielders
    - Use CF (Centre-Forward), SS (Second Striker) for different striker roles
    - GK is always 3 for all tactics
  
  2. Position Codes
    - GK: Goalkeeper (always 3)
    - CB: Centre-Back
    - LB: Left-Back
    - RB: Right-Back
    - DM: Defensive Midfield
    - CM: Central Midfield
    - AM: Attacking Midfield
    - LM: Left Midfield
    - RM: Right Midfield
    - LW: Left Winger
    - RW: Right Winger
    - CF: Centre-Forward
    - SS: Second Striker
  
  3. Notes
    - Each formation now has specific position requirements based on tactical shape
    - Positions are doubled for squad depth (except GK which is 3)
*/

-- 1-3-5-2: 3 CB, 5 midfielders (2 DM, 3 CM), 2 strikers
UPDATE tactics SET position_requirements = '{"GK": 3, "CB": 6, "DM": 4, "CM": 6, "CF": 4}'::jsonb
WHERE name = '1-3-5-2';

-- 1-3-4-3 Line: 3 CB, 4 midfielders in line (4 CM), 3 forwards (LW, CF, RW)
UPDATE tactics SET position_requirements = '{"GK": 3, "CB": 6, "CM": 8, "LW": 2, "RW": 2, "CF": 2}'::jsonb
WHERE name = '1-3-4-3 Line';

-- 1-3-4-3 Diamond: 3 CB, 4 midfielders in diamond (1 DM, 2 CM, 1 AM), 3 forwards
UPDATE tactics SET position_requirements = '{"GK": 3, "CB": 6, "DM": 2, "CM": 4, "AM": 2, "LW": 2, "RW": 2, "CF": 2}'::jsonb
WHERE name = '1-3-4-3 Diamond';

-- 1-4-2-4: 4 defenders, 2 midfielders (2 CM), 4 forwards (LW, 2 CF, RW)
UPDATE tactics SET position_requirements = '{"GK": 3, "CB": 4, "LB": 2, "RB": 2, "CM": 4, "LW": 2, "RW": 2, "CF": 4}'::jsonb
WHERE name = '1-4-2-4';

-- 1-4-3-3 Line: 4 defenders, 3 midfielders in line (3 CM), 3 forwards
UPDATE tactics SET position_requirements = '{"GK": 3, "CB": 4, "LB": 2, "RB": 2, "CM": 6, "LW": 2, "RW": 2, "CF": 2}'::jsonb
WHERE name = '1-4-3-3 Line';

-- 1-4-3-3 (2-1): 4 defenders, 3 midfielders (2 DM, 1 AM), 3 forwards
UPDATE tactics SET position_requirements = '{"GK": 3, "CB": 4, "LB": 2, "RB": 2, "DM": 4, "AM": 2, "LW": 2, "RW": 2, "CF": 2}'::jsonb
WHERE name = '1-4-3-3 (2-1)';

-- 1-4-3-3 (1-2): 4 defenders, 3 midfielders (1 DM, 2 AM), 3 forwards
UPDATE tactics SET position_requirements = '{"GK": 3, "CB": 4, "LB": 2, "RB": 2, "DM": 2, "AM": 4, "LW": 2, "RW": 2, "CF": 2}'::jsonb
WHERE name = '1-4-3-3 (1-2)';

-- 1-4-4-2 Line: 4 defenders, 4 midfielders in line (4 CM), 2 strikers
UPDATE tactics SET position_requirements = '{"GK": 3, "CB": 4, "LB": 2, "RB": 2, "CM": 8, "CF": 4}'::jsonb
WHERE name = '1-4-4-2 Line';

-- 1-4-4-2 Square: 4 defenders, 4 midfielders in square (2 DM, 2 AM), 2 strikers
UPDATE tactics SET position_requirements = '{"GK": 3, "CB": 4, "LB": 2, "RB": 2, "DM": 4, "AM": 4, "CF": 4}'::jsonb
WHERE name = '1-4-4-2 Square';

-- 1-4-4-2 Diamond: 4 defenders, 4 midfielders in diamond (1 DM, 2 CM, 1 AM), 2 strikers
UPDATE tactics SET position_requirements = '{"GK": 3, "CB": 4, "LB": 2, "RB": 2, "DM": 2, "CM": 4, "AM": 2, "CF": 4}'::jsonb
WHERE name = '1-4-4-2 Diamond';

-- 1-4-4-2 (1-3): 4 defenders, 4 midfielders (1 DM, 3 AM), 2 strikers
UPDATE tactics SET position_requirements = '{"GK": 3, "CB": 4, "LB": 2, "RB": 2, "DM": 2, "AM": 6, "CF": 4}'::jsonb
WHERE name = '1-4-4-2 (1-3)';

-- 1-4-4-2 (3-1): 4 defenders, 4 midfielders (3 DM, 1 AM), 2 strikers
UPDATE tactics SET position_requirements = '{"GK": 3, "CB": 4, "LB": 2, "RB": 2, "DM": 6, "AM": 2, "CF": 4}'::jsonb
WHERE name = '1-4-4-2 (3-1)';

-- 1-5-4-1 Line: 5 defenders, 4 midfielders in line (4 CM), 1 striker
UPDATE tactics SET position_requirements = '{"GK": 3, "CB": 6, "LB": 2, "RB": 2, "CM": 8, "CF": 2}'::jsonb
WHERE name = '1-5-4-1 Line';

-- 1-5-4-1 Diamond: 5 defenders, 4 midfielders in diamond (1 DM, 2 CM, 1 AM), 1 striker
UPDATE tactics SET position_requirements = '{"GK": 3, "CB": 6, "LB": 2, "RB": 2, "DM": 2, "CM": 4, "AM": 2, "CF": 2}'::jsonb
WHERE name = '1-5-4-1 Diamond';

-- 1-5-3-2 (2-1): 5 defenders, 3 midfielders (2 DM, 1 AM), 2 strikers
UPDATE tactics SET position_requirements = '{"GK": 3, "CB": 6, "LB": 2, "RB": 2, "DM": 4, "AM": 2, "CF": 4}'::jsonb
WHERE name = '1-5-3-2 (2-1)';

-- 1-5-3-2 (1-2): 5 defenders, 3 midfielders (1 DM, 2 AM), 2 strikers
UPDATE tactics SET position_requirements = '{"GK": 3, "CB": 6, "LB": 2, "RB": 2, "DM": 2, "AM": 4, "CF": 4}'::jsonb
WHERE name = '1-5-3-2 (1-2)';

-- 1-5-2-3: 5 defenders, 2 midfielders (2 CM), 3 forwards (LW, CF, RW)
UPDATE tactics SET position_requirements = '{"GK": 3, "CB": 6, "LB": 2, "RB": 2, "CM": 4, "LW": 2, "RW": 2, "CF": 2}'::jsonb
WHERE name = '1-5-2-3';