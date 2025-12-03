/*
  # Add Position Requirements to User Profiles

  1. Changes
    - Add `position_requirements` JSONB column to user_profiles table
    - This stores the position requirements based on selected tactic
    - Will be populated when user selects a tactic
  
  2. Notes
    - Stores data like {"GK": 2, "CB": 4, "LB": 2, "RB": 2, "CM": 6, "ST": 2}
    - Used to validate player selections in PickPlayers component
*/

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS position_requirements JSONB DEFAULT NULL;