/*
  # Fix Team Value Column Precision

  1. Changes
    - Alter team_value column to support larger values (up to billions)
    - Change from numeric(10,2) to numeric(15,2)
    - This allows values up to 999,999,999,999,999.99
*/

-- Alter team_value column in teams table
ALTER TABLE teams 
ALTER COLUMN team_value TYPE numeric(15, 2);

-- Also update user_profiles table
ALTER TABLE user_profiles
ALTER COLUMN team_value TYPE numeric(15, 2);
